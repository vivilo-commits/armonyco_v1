---
name: api-integrating
description: Handles API integration including REST/GraphQL clients, authentication, error handling, and rate limiting. Use when the user mentions API, integration, HTTP requests, webhooks, or third-party services.
triggers:
  - "Integrate API..."
  - "Connect to service..."
  - "API call..."
  - "Webhook..."
---

# API Integrating

## When to use this skill
- User wants to integrate with external APIs
- User mentions REST, HTTP requests, GraphQL, or webhooks
- User asks about API authentication or rate limiting
- User needs to create API clients or wrappers
- User wants to handle API errors or retries

## Workflow

### 1. P.R.I.S.M.A. Phase 2: Reach (Connectivity)
- [ ] Test all API connections and `src/.env` credentials before proceeding.
- [ ] **Supabase Rule**: Use the **Supabase JS Client** (`.from().select()`) for all authenticated data fetching. **RAW `fetch()` is FORBIDDEN.**
- [ ] Build a minimal **Handshake Script** to verify service response using the client.
- [ ] **n8n Webhook Standard**: Use `n8n.cloud` webhooks for automation triggers. Define a clear `Trigger -> Action -> Supabase Persist` flow.
- [ ] **Workflow Standards**: Implement retry logic with exponential backoff for transient failures.
- [ ] **Error Handling**: Every HTTP request MUST have a fail-safe or fallback path.

### 2. Client Implementation
- [ ] Create type-safe API client
- [ ] Implement authentication
- [ ] Add retry logic and error handling
- [ ] Implement rate limiting
- [ ] Add request/response logging

## Instructions

### Step 1: API Client Setup

**TypeScript API Client Template:**
```typescript
// lib/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface ApiClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private retries: number;

  constructor(config: ApiClientConfig) {
    this.retries = config.retries ?? 3;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        // Retry logic
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < this.retries && this.shouldRetry(error)) {
          config.retry += 1;
          console.log(`[API] Retry ${config.retry}/${this.retries} for ${config.url}`);
          
          // Exponential backoff
          await this.delay(Math.pow(2, config.retry) * 1000);
          
          return this.client(config);
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private normalizeError(error: any) {
    if (error.response) {
      // Server responded with error
      return {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        status: 0,
        message: 'No response from server',
        data: null,
      };
    } else {
      // Error setting up request
      return {
        status: 0,
        message: error.message,
        data: null,
      };
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}
```

### Step 2: Authentication Patterns

**API Key Authentication:**
```typescript
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  apiKey: process.env.API_KEY,
});
```

**OAuth 2.0 Authentication:**
```typescript
class OAuthClient extends ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  async authenticate(clientId: string, clientSecret: string) {
    const response = await this.post<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>('/oauth/token', {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    this.accessToken = response.access_token;
    this.refreshToken = response.refresh_token;
    this.tokenExpiry = Date.now() + response.expires_in * 1000;

    // Update default headers
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  async ensureAuthenticated() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post<{
      access_token: string;
      expires_in: number;
    }>('/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
    });

    this.accessToken = response.access_token;
    this.tokenExpiry = Date.now() + response.expires_in * 1000;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }
}
```

### Step 3: Rate Limiting

**Client-Side Rate Limiter:**
```typescript
import Bottleneck from 'bottleneck';

class RateLimitedApiClient extends ApiClient {
  private limiter: Bottleneck;

  constructor(config: ApiClientConfig & { rateLimit?: { maxConcurrent: number; minTime: number } }) {
    super(config);

    this.limiter = new Bottleneck({
      maxConcurrent: config.rateLimit?.maxConcurrent ?? 5,
      minTime: config.rateLimit?.minTime ?? 200, // ms between requests
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.limiter.schedule(() => super.get<T>(url, config));
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.limiter.schedule(() => super.post<T>(url, data, config));
  }
}

// Usage
const client = new RateLimitedApiClient({
  baseURL: 'https://api.example.com',
  apiKey: process.env.API_KEY,
  rateLimit: {
    maxConcurrent: 5,    // Max 5 concurrent requests
    minTime: 200,        // Min 200ms between requests (300 req/min)
  },
});
```

### Step 4: Type-Safe API Wrapper

**Generate Types from API:**
```typescript
// types/api.ts
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// api/users.ts
export class UsersApi {
  constructor(private client: ApiClient) {}

  async getUser(id: string): Promise<User> {
    return this.client.get<User>(`/users/${id}`);
  }

  async listUsers(page = 1, perPage = 20): Promise<PaginatedResponse<User>> {
    return this.client.get<PaginatedResponse<User>>('/users', {
      params: { page, per_page: perPage },
    });
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    return this.client.post<User>('/users', data);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.client.put<User>(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<void> {
    return this.client.delete<void>(`/users/${id}`);
  }
}
```

### Step 5: Webhook Handling

**Express Webhook Endpoint:**
```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Webhook endpoint
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  const payload = req.body.toString();

  // Verify signature
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
    return res.status(401).send('Invalid signature');
  }

  // Parse event
  const event = JSON.parse(payload);

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.failed':
      handlePaymentFailure(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handlePaymentSuccess(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Update database, send confirmation email, etc.
}

async function handlePaymentFailure(paymentIntent: any) {
  console.log('Payment failed:', paymentIntent.id);
  // Notify user, log error, etc.
}
```

### Step 6: GraphQL Integration

**GraphQL Client:**
```typescript
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: `Bearer ${process.env.API_KEY}`,
  },
});

// Define queries
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      name
      posts {
        id
        title
      }
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
    }
  }
`;

// Execute queries
async function getUser(id: string) {
  const data = await client.request(GET_USER, { id });
  return data.user;
}

async function createPost(title: string, content: string) {
  const data = await client.request(CREATE_POST, {
    input: { title, content },
  });
  return data.createPost;
}
```

## Error Handling Patterns

**Typed Error Handling:**
```typescript
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function safeApiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle API errors
      if (error.status === 401) {
        // Redirect to login
        throw new Error('Authentication required');
      } else if (error.status === 429) {
        // Rate limited
        throw new Error('Too many requests, please try again later');
      } else if (error.status >= 500) {
        // Server error
        throw new Error('Server error, please try again later');
      }
    }
    throw error;
  }
}
```

## Testing API Integrations

**Mock API Responses:**
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('https://api.example.com/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id,
        email: 'test@example.com',
        name: 'Test User',
      })
    );
  }),

  rest.post('https://api.example.com/users', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: '123',
        ...body,
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Resources
- [Axios Documentation](https://axios-http.com/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [REST API Design](https://restfulapi.net/)

## Validation Checklist
- [ ] Authentication implemented and tested
- [ ] Rate limiting configured
- [ ] Retry logic with exponential backoff
- [ ] Error handling covers all status codes
- [ ] Types generated from API schema
- [ ] Request/response logging enabled
- [ ] Webhook signatures verified
- [ ] API client tested with mocks
