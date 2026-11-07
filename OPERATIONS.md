# Render review-demo operations

Deployment instructions are in [RENDER.md](RENDER.md). The branch is password-gated by default and is not represented as independently lawyer-reviewed or production-ready for unrestricted public legal assistance.

## Access and monitoring

- `ACCESS_MODE=protected` requires a private `APP_PASSWORD` of at least 16 characters. Missing configuration fails closed. The password is a shared reviewer gate, not individual accounts.
- The unauthenticated homepage is a minimal HTTP 200 sign-in page, allowing a root readiness probe to pass without exposing the workspace. `/reviewer-login` supplies the password challenge. Only explicit `ACCESS_MODE=public` removes the workspace gate. The branch push does not deploy or change hosting access.
- Sites and Cloudflare identity headers have no authority here. The paid limiter uses a shared database scope rather than forgeable user/IP headers.
- Health is `/api/health`; paid-AI readiness is `/api/status` behind the access gate. Origin checks use `APP_ORIGIN`, Render's external URL, or localhost for development.
- Logs intentionally contain only request IDs, modes, status/failure categories and timing. Database errors are logged without connection URLs or credentials. Messages, document text and AI output are not intentionally logged.

## Storage and allowances

PostgreSQL stores aggregate daily/hourly counters and random reservation IDs/amounts. No automatic retention pruning is currently configured. Case facts, conversations and attachments remain in browser memory, with the existing optional local fact storage and user-controlled exports. AI-provider retention is separate.

Atomic reservations protect the shared daily amount and attempts under concurrency. Settlement is idempotent and uses the stored reservation amount. Missing or unavailable tracking stops paid requests; unknown usage retains the full reservation. Limits are based on the selected model's recorded token prices and are not a provider billing cap.

Startup migrations use a transaction and advisory lock. Applied migration content hashes are checked; create a new SQL migration instead of editing one already applied. A new Render database does not inherit the live Site's usage history. Use a dedicated database for this deployment.

## Verification and wider use

The migration preserves historical benchmark inputs and outputs and adds Node access/origin tests, real PostgreSQL concurrency/restart/migration tests, and production HTTP smoke checks without paid AI calls. Run the commands in RENDER.md after platform changes. A fresh versioned evaluation is required for new model-performance claims.

Before unrestricted use, obtain qualified legal/security review and implement the desired individual-account, abuse-control, retention and operational support policies. Free Render services and databases have idle/expiry limits; consult Render before relying on them for durable service.
