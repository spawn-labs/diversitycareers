# Diversity Careers

DEI-focused U.S. job board: seekers search and apply; employers pay via Stripe before listings go live.

**Stack:** React + Vite + Tailwind · Cloudflare Pages Functions · Cloudflare KV (JSON document store) · Stripe Checkout (server-side only)

## Quick start (local)

```bash
cd diversity-careers
npm install

# 1. KV namespace (one-time)
npx wrangler kv namespace create DC_DATA
npx wrangler kv namespace create DC_DATA --preview
# Paste the returned ids into wrangler.toml → [[kv_namespaces]]

# 2. Secrets (only on your machine)
cp .dev.vars.example .dev.vars
# Edit .dev.vars — see “Stripe setup” below

# 3. Terminal A — API
npm run build && npx wrangler pages dev dist --port 8788

# 4. Terminal B — frontend
npm run dev
# Open http://localhost:5173 (API proxied to :8788)
```

## Stripe setup (sandbox vs production)

| Variable | Sandbox (local `.dev.vars`) | Production (Cloudflare dashboard) |
|----------|-----------------------------|----------------------------------|
| `STRIPE_SECRET_KEY` | `sk_test_…` from [Stripe Test API keys](https://dashboard.stripe.com/test/apikeys) | `sk_live_…` from [Live API keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (below) or a **test** webhook endpoint | From **live** webhook endpoint |
| `APP_URL` | `http://localhost:8788` | `https://your-site.pages.dev` |
| `JOB_POSTING_PRICE_CENTS` | e.g. `9900` ($99) | same |
| `SESSION_SECRET` | `openssl rand -hex 32` | **different** value for prod |
| `ADMIN_EMAILS` | your email | your email |

**Never** put `sk_test_` or `sk_live_` in React code, `VITE_*` vars, or git. The publishable key (`pk_test_` / `pk_live_`) is not required for hosted Checkout — users pay on Stripe’s page.

### Local webhook forwarding

```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:8788/api/stripe/webhook
# Copy whsec_… into .dev.vars → STRIPE_WEBHOOK_SECRET
```

### Production webhook (recommended)

In Stripe Dashboard → Webhooks → Add endpoint:

- URL: `https://YOUR_DOMAIN/api/stripe/webhook`
- Event: `checkout.session.completed`
- Copy signing secret → Cloudflare **Production** env → `STRIPE_WEBHOOK_SECRET`

If the webhook is missing or misconfigured, the success page still publishes the job by
verifying payment directly with Stripe when you land on `/employer/success?session_id=...`.

## Admin & seed data

1. Register/login with an email listed in `ADMIN_EMAILS`.
2. Open `/admin` → **Import seed jobs** (loads `data/seed-jobs.json`).
3. Add RSS/JSON crawl sources and run **Crawl now** to pull external listings.

## Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist
```

In the Pages project settings:

- Bind KV namespace `DC_DATA` (same as `wrangler.toml`).
- Add **Production** environment variables (live Stripe keys, `APP_URL`, etc.).
- Optionally add **Preview** variables with test keys.

Connect the GitHub repo for automatic deploys on push.

## Security notes

- Payments: Stripe Checkout only; card data never hits this app.
- Jobs publish only after `checkout.session.completed` webhook marks payment paid.
- Forms: honeypot field, minimum submit time, per-IP rate limits.
- Sessions: signed HttpOnly cookies (`SESSION_SECRET`).

## Project layout

```
diversity-careers/
  data/seed-jobs.json      # Sample jobs for admin import
  functions/api/           # Cloudflare Pages Functions (API)
  src/                     # React UI
  .dev.vars                # Local secrets (you create — gitignored)
  .env.example             # Documented variable reference
```
