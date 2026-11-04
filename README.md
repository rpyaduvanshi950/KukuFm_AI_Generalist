# Nyaya — your legal next step

A responsive India-focused legal information web app for the Kuku AI Generalist assignment, Problem 2. Built with React, TypeScript and Vinext; deploys to Cloudflare Workers through Sites.

## Run locally

Requires Node 22.13+.

```sh
npm run install:ci
npm run dev
```

Open the Local URL printed by the server. Without AI settings, the app clearly labels itself as guided mode.

## Configure Gemini or another provider

Copy `.env.example` to **`.dev.vars`** in this folder, then provide your own key. This file is ignored by Git. Restart the preview after editing it.

For Gemini, the tested configuration is:

```dotenv
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.5-flash-lite
AI_API_KEY=YOUR_PRIVATE_KEY
```

Never use a browser-exposed environment variable for the key. Hosted settings belong in Sites runtime secrets. Model availability and free-tier limits can change. The initial `gemini-2.5-flash-lite` test failed because Google no longer offers it to new users; its API response directed us to the tested replacement. The app makes one bounded request per submitted message, with a 20-second timeout and no automatic retries or key rotation. Three successful synthetic Gemini tests consumed 415 reported total tokens combined.

Other OpenAI-compatible services can use the same adapter. Local Ollama can use `http://127.0.0.1:11434/v1` with an installed model; hosted workers cannot reach your laptop's loopback address.

## Build and verify

```sh
npx tsc --noEmit
npm run build
node --test tests/legal.test.mjs
```

`outputs/raw-guided-cases.json` contains unedited results from ten deterministic test cases. `outputs/raw-gemini-cases.json` contains three actual Gemini responses and usage. `scripts/test-provider.mjs` asks for the test key on hidden stdin; no key is stored in source. API tests use synthetic cases only.

## What works

- Conversational English/Hindi intake with configurable AI and a transparent guided fallback.
- Refund, deposit and unpaid-salary workflows; out-of-scope referral.
- Case facts, evidence checklist, editable factual request and downloadable exports.
- Curated official-source links, review dates, limitations, urgent-risk flags.
- Browser saving is opt-in and facts-only. Clear-case removes that saved record.
- The app never sends a legal notice, files a complaint or contacts anyone.

## Design and risk boundaries

AI handles empathetic paraphrasing and factual follow-up questions. Legal guidance and source URLs come from reviewed application data, not model-generated citations. A shape/length/phrase validator rejects some unsafe output and falls back to guided assistance. This reduces risk; it does **not** prove factual correctness or stop every adversarial prompt. A human must review every draft.

State-specific rental entitlements, legal deadlines, court filings, criminal defence and complex disputes are not covered. Detailed guidance and checklists are English; intake and factual drafts support Hindi. Urgency and topic detection use keywords and may miss paraphrases or trigger false positives. A statement such as “I am not in danger” can trigger the conservative urgency warning. The app does not ingest evidence files, perform live legal research or guarantee outcomes.

## Privacy and deployment

No application database, analytics or case-content logging is implemented. Browser memory holds the current conversation; user-selected local storage is not encrypted. With AI configured, conversation text is sent to that provider and its terms/retention apply. Hosting infrastructure may retain ordinary access metadata. Avoid sensitive identifiers. The initial hosted Site is owner-private; sharing for evaluation must be configured deliberately.

The supplied Kuku scripts and PDF are outside this app folder and are excluded from publication. No credentials belong in the repository or output files. See `RESEARCH.md` for official-source research and `EVALUATION.md` for validation and limitations.
