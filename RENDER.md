# Deploy Nyaya to Render

The submission branch `main` uses standard Next.js on Node 22 and PostgreSQL. The existing Render service uses the separate `render-deploy` branch, which is left unchanged by this submission update. The earlier Cloudflare/Sites source remains in Git history at `c7f3986` (also retained as a local archive branch); this Node build is not a Sites Worker build.

## Render settings

Create a **Web Service**, connect `rpyaduvanshi950/KukuFm_AI_Generalist`, and select:

| Field | Value |
| --- | --- |
| Branch | `main` for a deployment of the submitted version |
| Root directory | Leave blank |
| Runtime | Node |
| Build | `npm ci --include=dev --include=optional && npm run build` |
| Start | `npm start` |
| Health check | `/api/health` |

Alternatively, explicitly apply the included `render.yaml` Blueprint to create a free demo web service and a separate free PostgreSQL database in the same region. No resources are created merely by pushing this branch.

Use a new, dedicated PostgreSQL database. Put its **internal connection URL** into `DATABASE_URL`. Startup applies the versioned SQL migrations before binding the web port. Applied migration hashes are checked; editing an applied migration is rejected. The web server binds `0.0.0.0` and uses Render's `PORT`. Health reports liveness only, not whether paid AI is available.

## Environment variables

Set these privately under Render **Environment**:

| Variable | Value |
| --- | --- |
| `NODE_VERSION` | `22` |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `DATABASE_URL` | Your dedicated Render PostgreSQL internal URL |
| `AI_BASE_URL` | `https://api.openai.com/v1` |
| `AI_MODEL` | `gpt-5.4-mini-2026-03-17` |
| `AI_API_KEY` | Optional. Leave absent/blank for guided mode |

Do not use `NEXT_PUBLIC_` for the key or database URL. Do not copy `.env.local`, `.env.openai.local` or `.dev.vars` into GitHub. No actual credentials are included in this branch or Blueprint.

For a custom domain, also set `APP_ORIGIN=https://your-domain.example`. Otherwise, the API uses Render's supplied `RENDER_EXTERNAL_URL` for origin checks. This handles external HTTPS correctly behind Render's internal HTTP connection without trusting arbitrary forwarded host headers.

## Public access

The workspace, guide, benchmarks and APIs open without sign-in. The former reviewer-login URL redirects directly to the workspace. `ACCESS_MODE` and `APP_PASSWORD` are no longer used and can be removed from existing Render environment settings. Existing values do not block startup or access.

Responses are marked private/no-store. The shared database-backed AI spending limits and origin checks still apply.

## AI spending and database behavior

- Paid AI requires a configured key, supported model settings and a working migrated PostgreSQL database. Startup refuses a paid-AI configuration without a database.
- Without a key, chat uses guided information and never contacts the AI provider or creates paid reservations.
- The conservative allowance is $0.50 and 100 attempts per UTC day across the whole Render deployment. There is also a shared 40-attempt UTC-hour limit. These are shared limits, not per-user quotas; supplied IP/user headers cannot create a new allowance.
- Atomic PostgreSQL updates reserve cost before the provider call. Unknown usage retains its reservation. A random reservation ID makes settlement idempotent, so repeated settlement cannot double-refund the allowance.
- PostgreSQL preserves counters and reservations across web restarts and redeployments. A database outage pauses paid requests rather than silently removing the spending guard.
- This is local token-based accounting, not a provider billing cap. Cases, messages, original files and user identifiers are not stored in these tables. Reservation rows contain random IDs and usage amounts.
- The Render database and its counters are separate from the existing Site's D1 database; counters are not transferred or shared between those two deployments.

Free Render web services sleep on idle, and free PostgreSQL databases have an expiry period. They are appropriate for a review demo, not a durable production service. Check the current limits before deploying and plan a database upgrade/replacement if needed. No paid plan or service is provisioned by this work.

## Local verification

```sh
npm ci --include=dev --include=optional
npm test
npm run test:render
npm run typecheck
npm run build
```

For local guided preview, run `npm run dev`. This is a localhost-only development server. For production-like startup, use a private `.env.local` based on `.env.example`, then run `npm start`. Production startup also supports guided mode without a database if no AI key is set.

Real PostgreSQL verification:

```sh
npm run test:postgres:local
npm run test:http
```

These commands require PostgreSQL binaries at `/usr/lib/postgresql/16/bin` or `POSTGRES_BIN`. They create and clean up an isolated temporary database, accessible only through a private Unix socket. They do not use the live Site database or make paid AI calls. The HTTP check starts a temporary public production server, verifies access without credentials, health, assets, origin checks, guided chat and zero paid reservations without a key, then stops it.

On other platforms, set `TEST_DATABASE_URL` to a dedicated test PostgreSQL database and run `npm run test:postgres`. The tests create and remove only their own randomly named schema. The test user needs permission to create schemas.

## Sources

- [Render Next.js deployment](https://render.com/docs/deploy-nextjs-app)
- [Render web-service port binding](https://render.com/docs/web-services#port-binding)
- [Render PostgreSQL connections](https://render.com/docs/postgresql-creating-connecting)
- [Render environment variables](https://render.com/docs/configure-environment-variables)
- [Render free-instance limits](https://render.com/docs/free)

## Readiness diagnostics

Use `/api/health` as the Render Health Check Path. The root `/` opens the workspace directly without credentials.

After startup, logs include `startup_probe` entries for `/api/health` and `/`. A status of 200 for both confirms the server responds locally. If Render still reports a deployment timeout with both probes at 200, inspect the service's Health Check Path, Events and Render networking rather than treating the log as a confirmed code crash. The probe logs contain no passwords, bodies or database URLs. The optional missing `.env.local` message remains normal on Render.
