# Render branch verification

Verified against the standard Node/Next.js production build, without deploying a Render service or calling a paid AI provider.

- Clean dependency installation from the updated lockfile succeeded.
- `npm run build` passed with Next.js 16.3.4 on Node 22. It emits the app, guide, benchmark page, chat/status/health API routes and access proxy.
- TypeScript checks passed.
- Existing legal/document/refund regression suite: 184 checks passed.
- Render access/origin tests: 6 passed, including failure on missing credentials, denial of forged Sites/Cloudflare identity headers, custom-domain and external-HTTPS origin handling.
- Real temporary PostgreSQL tests: 9 passed, including migrations, concurrent daily reservations, persistent hourly/daily limits, idempotent settlement, unknown usage, restart persistence and changed-migration rejection.
- Production HTTP smoke checks passed: password-gated pages/API, public health and PDF worker asset, origin rejection, guided chat and an empty paid-reservations table when no AI key is configured.
- Browser verification of the built server passed for client hydration, PDF text extraction, Word text extraction and rendering a selected PDF page as an image. Only synthetic test fixtures were used.

The existing `main` checkout and live private Site were left unchanged. The branch is prepared for the user to create the Render service and supply private settings. No Render URL, database or paid hosting plan has been created here.

See RENDER.md for exact setup and test commands. Historical legal-model benchmarks remain historical; platform verification is not independent legal review.
