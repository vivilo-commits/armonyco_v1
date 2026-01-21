---
name: documentation-generating
description: Generates comprehensive documentation including README files, API docs, and architecture diagrams. Use when the user mentions documentation or README.
triggers:
  - "Document..."
  - "Write README..."
  - "API docs..."
---

# Documentation Generating

## When to use this skill
- User requests documentation creation or updates
- User mentions README, API docs, or code documentation
- User wants architecture diagrams or system overview
- User asks to document functions, classes, or modules
- User wants to generate changelog or release notes

## Workflow

### 1. Documentation Scope
- [ ] Identify documentation type (README, API, architecture)
- [ ] Determine target audience (developers, users, stakeholders)
- [ ] Gather existing documentation
- [ ] Define documentation structure
- [ ] Plan diagrams and examples

### 2. P.R.I.S.M.A. Phase 4: Stylization (Payload Refinement)
- [ ] Format all outputs (Slack blocks, Notion layouts, Email HTML) for professional delivery
- [ ] Ensure all documentation follows a visually consistent layout
- [ ] Present stylized results to the user for feedback before final delivery
- [ ] Use rich markdown, carousels, and alerts in documentation artifacts

## Instructions

### Step 1: README Template

**Comprehensive README Structure:**
```markdown
# Project Name

Brief description of what this project does and who it's for.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- ✨ Feature 1: Description
- 🚀 Feature 2: Description
- 🔒 Feature 3: Description

## Quick Start

\```bash
# Clone the repository
git clone https://github.com/username/project.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev
\```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis (optional, for caching)

### Environment Variables

Create a `.env` file with the following variables:

\```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_KEY=your_api_key_here
JWT_SECRET=your_secret_here
\```

## Usage

### Basic Example

\```typescript
import { ApiClient } from './lib/api-client';

const client = new ApiClient({
  baseURL: 'https://api.example.com',
  apiKey: process.env.API_KEY,
});

const user = await client.get('/users/123');
console.log(user);
\```

### Advanced Usage

[Link to detailed usage guide](docs/USAGE.md)

## API Reference

### Endpoints

#### GET /api/users/:id

Retrieve a user by ID.

**Parameters:**
- `id` (string, required): User ID

**Response:**
\```json
{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe"
}
\```

**Example:**
\```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.example.com/api/users/123
\```

## Architecture

### System Overview

\```mermaid
graph TB
    Client[Client App] --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Users[User Service]
    API --> Orders[Order Service]
    Users --> DB[(Database)]
    Orders --> DB
    Orders --> Queue[Message Queue]
    Queue --> Worker[Background Worker]
\```

### Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, PostgreSQL
- **Infrastructure**: Docker, AWS, Redis

## Development

### Project Structure

\```
project/
├── src/
│   ├── components/     # React components
│   ├── lib/            # Utility libraries
│   ├── api/            # API client
│   └── types/          # TypeScript types
├── tests/              # Test files
├── docs/               # Documentation
└── scripts/            # Build/deployment scripts
\```

### Running Tests

\```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- path/to/test.spec.ts
\```

### Code Style

This project uses ESLint and Prettier for code formatting.

\```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
\```

## Deployment

### Production Build

\```bash
# Build for production
npm run build

# Preview production build
npm run preview
\```

### Docker

\```bash
# Build Docker image
docker build -t project-name .

# Run container
docker run -p 3000:3000 project-name
\```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 📖 Docs: [documentation.example.com](https://docs.example.com)

## Acknowledgments

- [Library Name](https://github.com/library) - Description
- [Another Library](https://github.com/another) - Description
\```

### Step 2: API Documentation

**OpenAPI/Swagger Spec:**
```yaml
openapi: 3.0.0
info:
  title: Project API
  version: 1.0.0
  description: API for managing users and orders

servers:
  - url: https://api.example.com
    description: Production server
  - url: https://staging.api.example.com
    description: Staging server

paths:
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found

  /users:
    post:
      summary: Create new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
      required:
        - id
        - email
        - name

    CreateUserRequest:
      type: object
      properties:
        email:
          type: string
          format: email
        name:
          type: string
        password:
          type: string
          minLength: 8
      required:
        - email
        - name
        - password
```

### Step 3: Code Documentation

**JSDoc/TSDoc Comments:**
```typescript
/**
 * Fetches a user from the API by their ID.
 * 
 * @param id - The unique identifier of the user
 * @returns A promise that resolves to the user object
 * @throws {ApiError} When the user is not found or the API request fails
 * 
 * @example
 * ```typescript
 * const user = await getUser('123');
 * console.log(user.email);
 * ```
 */
export async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch user');
  }
  
  return response.json();
}

/**
 * Configuration options for the API client.
 */
export interface ApiClientConfig {
  /** Base URL for all API requests */
  baseURL: string;
  
  /** API key for authentication */
  apiKey?: string;
  
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;
}
```

### Step 4: Architecture Documentation

**Create Architecture Decision Records (ADR):**
```markdown
# ADR 001: Use PostgreSQL for Primary Database

## Status
Accepted

## Context
We need to choose a database for storing user data, orders, and product information. The system requires ACID compliance, complex queries with joins, and strong data integrity.

## Decision
We will use PostgreSQL as our primary database.

## Consequences

### Positive
- ACID compliance ensures data integrity
- Excellent support for complex queries and joins
- Strong ecosystem and tooling
- JSON support for flexible data structures
- Proven scalability for our use case

### Negative
- Requires more operational overhead than managed NoSQL solutions
- Vertical scaling can be expensive
- Requires careful index management for performance

## Alternatives Considered
- **MongoDB**: Better for unstructured data, but lacks ACID guarantees
- **MySQL**: Similar to PostgreSQL, but weaker JSON support
- **DynamoDB**: Fully managed, but limited query capabilities
```

### Step 5: Changelog Generation

**CHANGELOG.md Template:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X for improved user experience

### Changed
- Updated dependency Y to version 2.0.0

### Fixed
- Bug where Z would cause application crash

## [1.2.0] - 2024-01-19

### Added
- User authentication with JWT tokens
- Rate limiting for API endpoints
- Comprehensive error logging

### Changed
- Migrated from REST to GraphQL for user queries
- Improved database query performance by 40%

### Deprecated
- Legacy `/api/v1/users` endpoint (use `/api/v2/users` instead)

### Removed
- Removed deprecated payment gateway integration

### Fixed
- Fixed memory leak in WebSocket connections
- Corrected timezone handling in date calculations

### Security
- Updated dependencies to patch CVE-2024-1234
- Implemented CSRF protection for all forms

## [1.1.0] - 2024-01-01

### Added
- Dark mode support
- Export data to CSV functionality

### Fixed
- Login redirect loop issue

## [1.0.0] - 2023-12-01

### Added
- Initial release
- User registration and authentication
- Product catalog
- Shopping cart
- Order management
```

### Step 6: Generate from Code

**Auto-generate docs from code:**
```bash
# TypeDoc for TypeScript
npx typedoc --out docs src/index.ts

# JSDoc for JavaScript
npx jsdoc -c jsdoc.json

# Swagger from Express routes
npm install swagger-jsdoc swagger-ui-express
```

**Example Swagger setup:**
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'], // Path to API routes
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

## Documentation Best Practices

### README
- [ ] Clear project description
- [ ] Installation instructions
- [ ] Quick start guide
- [ ] Usage examples
- [ ] API reference or link to docs
- [ ] Contributing guidelines
- [ ] License information

### API Documentation
- [ ] All endpoints documented
- [ ] Request/response examples
- [ ] Authentication requirements
- [ ] Error codes and messages
- [ ] Rate limiting information
- [ ] Versioning strategy

### Code Comments
- [ ] Complex algorithms explained
- [ ] Non-obvious decisions documented
- [ ] Public APIs have JSDoc/TSDoc
- [ ] TODOs tracked with issue numbers
- [ ] No commented-out code

### Architecture Docs
- [ ] System overview diagram
- [ ] Data flow diagrams
- [ ] Database schema
- [ ] Deployment architecture
- [ ] ADRs for major decisions

## Resources
- [Write the Docs](https://www.writethedocs.org/)
- [Mermaid Diagrams](https://mermaid.js.org/)
- [OpenAPI Specification](https://swagger.io/specification/)

## Validation Checklist
- [ ] README is clear and comprehensive
- [ ] All public APIs documented
- [ ] Examples are tested and working
- [ ] Diagrams are up-to-date
- [ ] Links are not broken
- [ ] Documentation versioned with code
