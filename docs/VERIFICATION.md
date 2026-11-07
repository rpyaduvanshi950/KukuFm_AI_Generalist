# Submission verification: 7 November 2026

## Current main source

- `npm ci --include=dev --include=optional`: passed on Node 22 with the committed lockfile.
- `npm test`: **190/190** application checks passed, including conflict consistency, unknown amounts, affirmative/negated guarantees and Hindi fallback.
- `npm run test:render`: **2/2** origin checks passed.
- `npm run test:postgres:local`: **9/9** isolated PostgreSQL checks passed for migrations, concurrent reservations, persistent limits and idempotent settlement.
- `npm run typecheck` and `npm run build`: passed.
- `npm run test:http`: passed against the built Node server using temporary PostgreSQL, without a provider key. It verifies public workspace/status/benchmark access, health, PDF worker, origin rejection, input validation, guided chat, startup probes and zero paid reservations.
- Recorded v5 cases, development/final raw outputs and original guided output remain byte-for-byte unchanged from `0286ed9`.
- Tracked/submission files were checked for common API-key patterns; no matches were found. This is not an independent security audit.

These are software and integration checks, not 201 independently reviewed legal scenarios. The latest paid regression and zero-network replay have separate results in [the report](../benchmarks/submission/REPORT.md).

## Existing public deployment

The existing Render service, on `render-deploy`, was checked separately before pushing main. It does not contain the later submission source changes.

Observed in the public app:

1. `/api/health` returned HTTP 200 and `{ok:true}`. `/api/status` reported the configured provider available. The workspace opened without sign-in.
2. The four-stage refund journey accepted synthetic details; amount, dates and location stayed blank.
3. A synthetic one-page PDF extracted **376 characters**. The document remained visible for inspection.
4. Review without document-sharing consent was blocked. One consented synthetic review returned an AI answer with document quotations and fact suggestions. No suggestions were silently applied to the case.
5. Confirmation gated request generation. The generated draft retained unknown placeholders and said it was not sent or lawyer-issued.
6. Both refund-request and lawyer-summary downloads completed.
7. Hindi preparation labels displayed; switching language invalidated the prior confirmation.

[Refund request screenshot](screenshots/refund-request.png) shows synthetic material only. One live browser AI request is separate from the ten-call regression; its token cost was not measured separately. No further live AI requests were made for this verification.

Observed limitation: a linked legal-summary quotation was topically related but did not directly support the whole sentence it accompanied. Literal matching is not semantic validation. The UI explains that limit; qualified legal review remains necessary. Vision wording also appeared in a text-extraction comment, so the model's phrasing is not treated as a verified processing description.

## Remaining external review

Independent Indian legal and security reviews are not complete. Voice input, opposing-side rehearsal, complete localisation, comprehensive current-law retrieval and individual abuse controls are outside this submission's implemented scope. The demo must not be represented as lawyer-approved or safe for every legal situation.

This update changes only `main`. It does not push `render-deploy`, alter the existing Render configuration, or publish a Sites version. Main can be reviewed/run locally using the README instructions.
