# Nyaya: Render deployment branch

An India-focused legal-information and case-preparation web app for Kuku's AI Generalist assignment. This branch runs **Next.js on Node 22 with PostgreSQL** and includes the existing refund journey, document assistant, case workspace and inspectable benchmark results.

**Branch:** `render-deploy`. The existing Cloudflare/Sites app remains on `main`; this branch has not been deployed to Render yet.

See **[RENDER.md](RENDER.md)** for the exact dashboard settings, database setup, secret names, access controls, verification commands and limits. A reviewable **[render.yaml](render.yaml)** Blueprint is included.

## Quick start

```sh
npm ci --include=dev --include=optional
npm run build
```

Create a private `.env.local` from `.env.example`. Set `APP_PASSWORD` to a private value of at least 16 characters. For AI, add `DATABASE_URL` and `AI_API_KEY`. Then:

```sh
npm start
```

The production server migrates the dedicated PostgreSQL database, binds `0.0.0.0`, and reads `PORT` (default 3000 locally). Protected reviewer access is the default. The public home page shows a sign-in link; click it and enter username `reviewer` and the configured password. The workspace and APIs require authentication. The health endpoint is `/api/health`; startup logs report local health and home-page response statuses.

For a localhost-only no-key preview, use `ACCESS_MODE=public npm run dev`. Guided chat and local preparation work without a provider key. A missing key never triggers an external AI call. The default hosted configuration remains password-gated; public access must be explicitly chosen by the operator.

## Verification

```sh
npm test
npm run test:render
npm run typecheck
npm run build
npm run test:postgres:local
npm run test:http
```

The last two commands use an isolated temporary PostgreSQL instance and do not call a paid AI provider. See the deployment guide for prerequisites or testing against a dedicated database.

The PostgreSQL limiter preserves the shared $0.50/day and 100-attempt allowance, adds a durable shared 40-attempt/hour limit, and settles each reservation at most once. These are per-deployment local accounting controls, not account billing guarantees. No case text, attachments or personal identifiers are stored in the budget tables.

## Evaluation and scope

The 50-case comparison and raw results remain available at `/benchmarks` and in [benchmarks/v5](benchmarks/v5/REPORT.md). Historical evaluated snapshots are preserved; platform migration is not a new legal-accuracy benchmark. Independent Indian legal review remains pending.

The app helps organise facts, read supplied excerpts and prepare editable factual requests. It does not establish document authenticity, legal entitlement or court outcomes, calculate legal deadlines, file a case or send a notice. See `/how-it-works` and [SOURCE_REGISTER.md](SOURCE_REGISTER.md).
