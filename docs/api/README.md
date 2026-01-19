# API Backend for Stripe and Registration

These are Vercel serverless functions to handle Stripe payments and email sending.

## Setup

### 1. Install backend dependencies

```bash
npm install stripe @sendgrid/mail @vercel/node
```

### 2. Configure environment variables

Create a `.env` file or configure on Vercel Dashboard:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid (or other email service)
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@armonyco.com

# Supabase (if needed for webhooks)
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
```

### 3. Configure Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Deploy to Vercel

```bash
vercel --prod
```

## Endpoints

### POST /api/stripe/create-checkout

Creates a Stripe Checkout session.

**Body:**
```json
{
  "planId": 1,
  "planName": "STARTER",
  "amount": 30428,
  "credits": 25000,
  "email": "user@company.com",
  "metadata": {
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "Company LLC",
    "vatNumber": "12345678901"
  },
  "successUrl": "https://...",
  "cancelUrl": "https://..."
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### GET /api/stripe/verify-payment?session_id=...

Verifies payment status.

**Response:**
```json
{
  "status": "success",
  "paymentIntentId": "pi_...",
  "amount": 30428,
  "metadata": {...}
}
```

### POST /api/webhooks/stripe

Handles Stripe webhooks (called automatically by Stripe).

### POST /api/email/welcome

Sends welcome email.

**Body:**
```json
{
  "to": "user@company.com",
  "subject": "Welcome to Armonyco",
  "data": {
    "firstName": "John",
    "planName": "STARTER",
    "credits": 25000,
    "dashboardUrl": "https://..."
  }
}
```

## Local Testing

To test locally:

```bash
vercel dev
```

Endpoints will be available at `http://localhost:3000/api/...`

## Important Notes

- ⚠️ Functions are in MOCK mode until you configure the API keys
- ⚠️ Uncomment Stripe code in functions after configuring keys
- ⚠️ Webhook requires body parser to be disabled (already configured)
- ⚠️ Test with Stripe test cards: https://stripe.com/docs/testing

## Stripe Test Cards

- **Success:** 4242 4242 4242 4242
- **Requires 3D Secure:** 4000 0025 0000 3155
- **Failure:** 4000 0000 0000 9995
- **Expiration:** Any future date
- **CVV:** Any 3 digits
- **ZIP:** Any 5 digits


