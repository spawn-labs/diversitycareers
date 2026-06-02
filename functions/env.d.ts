interface Env {
  DC_DATA: KVNamespace;
  /** Stripe secret key — NEVER expose to the client. Sandbox: sk_test_… Production: sk_live_… */
  STRIPE_SECRET_KEY: string;
  /** Webhook signing secret from Stripe Dashboard → Webhooks */
  STRIPE_WEBHOOK_SECRET: string;
  /** Job posting price in cents (e.g. 9900 = $99.00) */
  JOB_POSTING_PRICE_CENTS?: string;
  /** Base URL for redirects (local: http://localhost:8788, prod: https://your-domain.pages.dev) */
  APP_URL: string;
  /** HMAC secret for session cookies — generate: openssl rand -hex 32 */
  SESSION_SECRET: string;
  /** Comma-separated admin emails allowed to use /admin */
  ADMIN_EMAILS?: string;
  /** Optional honeypot field name override */
  HONEYPOT_FIELD?: string;
}
