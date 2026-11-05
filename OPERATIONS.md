# Private pilot operations

The hosted app remains owner-private. It is not represented as independently lawyer-validated or ready for an unrestricted public release.

## AI usage controls

- GPT-5.4 mini snapshot only; 1,200 completion tokens. Unpriced providers/models are blocked by the web endpoint.
- The D1 `ai_budget` table persists a **$0.50 conservative daily AI allowance** and 100-attempt ceiling across all users and Worker restarts. The day resets at 00:00 UTC (05:30 IST). The earlier per-identity 40/hour memory limiter remains an additional best-effort throttle.
- An atomic conditional UPSERT reserves estimated cost before sending a request. Actual provider usage reconciles that reservation without cache discounts. Failures and unknown usage retain the reservation; there are no automatic retries or model/key rotation.
- Missing/broken tracking, oversized context or exhausted allowance stops paid requests and keeps guided information available. This is an application allowance based on checked token prices, not an account billing limit or a guarantee against future pricing changes. Configure account billing controls separately before wider use.
- Text reservation uses a generous byte-based bound and a separate image allowance. Images use high detail, resized locally to 1,800 pixels on the longest edge. Unsupported model settings cannot silently bypass pricing.

## Monitoring and privacy

`/api/status` reports availability and aggregate remaining allowance, never a key. Structured `legal_request` logs contain a random request ID, mode, status/failure category and duration. Settlement failures emit `usage_settlement_failed`. No messages, model answers, document bodies, user identifiers or keys are intentionally logged. These logs support diagnosis; no external alert delivery or unattended source monitor has been configured.

The usage table contains only UTC day and aggregate counters. Case facts/timeline remain in browser memory, with optional browser persistence that is off by default and not encrypted. Original attachments and selected PDF pages stay in browser memory until consented sending; they are not stored in D1 or R2. Case export/summary downloads are user-controlled. Removing an attachment or starting a new case clears its application reference. The AI provider's own retention terms are separate from the app's local storage behavior.

Keep the Site owner-private pending independent legal and security review. Before broad access, add a durable per-user quota and abuse controls, define an operational owner and incident procedure, review retention/access policy and obtain a qualified Indian lawyer's review of the benchmark and legal source pack.

## Database and release

Schema is declared in `db/schema.ts`; generated migrations and metadata are committed under `drizzle/`. Hosted publication applies pending migrations before uploading the Worker. Never edit an applied migration. Local preview and production databases are separate.

The local migration was exercised through Wrangler and the spending SQL was also tested against SQLite with concurrent connections. A Worker-only redirect incompatibility found in the first scanned-page check was fixed by using `redirect: manual`, preserving the no-cross-host-credential-forwarding boundary. Unknown-usage reservations from that failed check were not erased to improve figures.

Re-run core tests and type checks after changes. Use a new versioned benchmark directory when changing the evaluated engine. Keep final evaluation results separate from development and do not tune on their outcomes while claiming an untouched final set.
