## GPT update — 6 November 2026

The private deployment now uses GPT-5.4 mini with a 1,200-token output ceiling and the evaluated v2 prompt. See [the GPT benchmark report](benchmarks/openai/REPORT.md) for raw results, costs and remaining failures. The interface uses a simpler case workspace with readable text and expandable references. The local benchmark key belongs in the ignored `.env.openai.local` file; hosted keys are server secrets.

# Nyaya — your legal next step

A responsive, India-focused legal information and case-preparation **web app** built for Problem 2 of the Kuku AI Generalist assignment. React + TypeScript + Vinext; Cloudflare Workers hosting through Sites.

## Run locally

Node 22.13+ is required.

```sh
npm run install:ci
npm run dev
```

Open the Local URL printed by the server. Without AI settings, the app explicitly labels guided mode. The current local preview uses an ignored `.dev.vars` file; credentials are never in the browser bundle or source repository.

## AI configuration

Copy `.env.example` to `.dev.vars`, or use `node scripts/configure-local-ai.mjs` to enter a test key on hidden stdin. Restart the preview after changing settings.

```dotenv
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.5-flash-lite
AI_API_KEY=YOUR_PRIVATE_KEY
```

For hosting, configure these values as Sites runtime settings and mark the key secret. An OpenAI-compatible provider can be substituted. Local Ollama can use `http://127.0.0.1:11434/v1` with an installed model; a hosted Worker cannot access your laptop's loopback address. No large local model is bundled.

Gemini 2.5 Flash Lite was rejected for a new-user key; Google's response directed us to 3.5 Flash Lite, which was then tested. Availability and free quotas can change. The app makes one bounded request per message (1,400 output-token cap, 30-second timeout), with no automatic retries or key rotation. An in-memory 40-request/hour budget is best-effort protection for the private prototype, not a durable public-service quota. Replace any key shared in a chat after testing.

## Features and boundaries

- Seven intake areas: refunds, rental deposits, salary, cyberfraud, domestic safety, police/court notices, and property/contract document organisation.
- Source-backed explanations from a small versioned official reference pack. Current-law completeness is not claimed.
- English/Hindi conversational replies, factual requests and selected law summaries. Some navigation, checklists and source notes remain English.
- Case facts, evidence checklist, editable factual request, JSON case export and text draft download.
- AI-suggested facts require user review before applying. Unknown values stay unknown.
- Immediate-danger and urgent-case routes continue to work when AI fails. Explicit foreign-jurisdiction questions are declined without applying Indian law.
- Factual requests are supported for refunds, deposits and wages. Court pleadings, bail guarantees, title opinions, tax, immigration, complex disputes and deadline calculation are not supported.
- The app never sends a notice, files a case or contacts anyone.

## Attachments

Attach up to **3 files**, **10 MB each**:

| Format | Reading behaviour |
|---|---|
| PDF | Browser-local text extraction, first 20 pages, up to 18,000 characters per file |
| DOCX | Main-body paragraphs and table-cell text; no embedded images, comments, headers or footers |
| TXT / MD / CSV | Plain text, up to 18,000 characters |
| JPG / PNG / WebP | Resized to a maximum 1,800-pixel side for AI vision |

Combined document text sent is limited to 36,000 characters. Scanned PDFs are reported as unreadable text; attach a clear image of the relevant page instead. Password-protected or malformed PDFs receive an error. Word expansion limits reduce compressed-file risks. Parsing runs in the browser; there is no server file store.

Review and redact extracted text before sending. Document-sharing consent is required. Known text quotes are matched to the extracted text with whitespace normalisation; image readings remain explicitly unverified. Source documents are not authenticated and enforceability is not determined. File instructions are treated as untrusted content; no defence is claimed to stop every possible injection.

The matching PDF.js worker is committed as a local static asset with its licence. After upgrading `pdfjs-dist`, refresh it:

```sh
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

## Build and test

```sh
npm run typecheck
npm test
npm run build
```

- `tests/legal.test.mjs`: core routing and draft regression tests.
- `tests/assistant.test.mjs`: attachments, quotation provenance, source validation, outages, urgency, foreign scope and provider adapter tests.
- `scripts/benchmark-live.mjs`: 12 synthetic Gemini cases using the same `respond` function as production; key accepted on hidden stdin.
- `tests/fixtures/`: synthetic PDF, DOCX, image, Hindi and adversarial documents; no actual user or assignment content.
- `outputs/`: selected unedited/redacted test records, including failed runs, retained for review.

See **BENCHMARKS.md** for measured results. These are custom application tests, not LegalBench/IL-TUR scores or legal certification.

## Architecture and privacy

`lib/knowledge.mjs` holds reviewed source summaries and law cards. `lib/legal.mjs` supplies deterministic routing, emergency guidance and factual templates. `lib/assistant.mjs` supplies the provider prompt, structured output validation and evidence checks. The server attaches allowlisted URLs; it never trusts generated links. Model explanations can still misinterpret facts or law despite valid sources.

Conversation and attachments stay in browser memory until sent to the server/provider. Facts-only local saving is opt-in and unencrypted. Clearing a case removes that browser record. No application database, analytics or case-content logging is implemented; infrastructure/provider metadata and retention policies still apply. Avoid sensitive identifiers. Test diagnostics are used only on synthetic benchmark data.

The hosted Site is owner-private. Change sharing deliberately before evaluation; do not publish this as an unrestricted legal service without expert review, authentication, durable quotas and a data-handling policy. The confidential Kuku input pack is outside this app directory and is not published.

## Evaluation v3 changes

Current-safety updates, intent-aware fabrication refusal and jurisdiction handling are improved. The app now distinguishes supported, contradicted, not-established and unclear document answers, with checked source quotations. Reviewed fallback guidance and explicit labelled text fields remain available during provider outages.

See [benchmarks/REPORT.md](benchmarks/REPORT.md) for frozen cases, external labels, failures and uncertainty. The latest live evaluation was substantially less reliable than the earlier 12-case run; do not quote the older availability result as current performance.

Optional `AI_TRANSPORT=gemini-native` uses the official native endpoint with the same configured Gemini model/key. It has no retries or automatic model switching and is not the default; the small transport probe did not establish a reliable advantage.
