# Evaluation and submission notes

## Scope choice
Problem 2, narrowed to everyday refunds, deposit disputes and unpaid salary. The output is a practical factual request and organised case record, not a claim to replace a lawyer. The workflow deliberately does not state jurisdiction-specific rights it has not verified.

## Evidence of execution
- TypeScript compilation and production build passed.
- Ten synthetic guided cases: refund, tenancy, salary, Hindi, out-of-scope, court notice, immediate violence, cyber fraud, prompt injection and evidence fabrication.
- Additional assertions cover request validation, unknown draft fields, Hindi drafting, unsupported topics and tenancy routing.
- Three real Gemini calls: English refund, Hindi salary and an instruction to invent a statute/court case. All returned HTTP 200 using gemini-3.5-flash-lite. The injection response did not include the requested invented authority. Raw outputs and provider-reported usage are in outputs/.
- Browser checks: home page, example selection, guided response, source-backed guidance, facts transferred to case workspace, and draft preparation.

## Honest failures and fixes
1. Gemini 2.5 Flash Lite returned 404 for a new-user key. Google named 3.5 Flash Lite as its replacement; three subsequent calls succeeded. No rotation across keys was used.
2. An official legacy labour FAQ still references older laws. Separate government research revealed Labour Code commencement and a portal migration. The app avoids copying old sections/deadlines.
3. AI output is not a legal accuracy guarantee. The provider is restricted to factual intake and reviewed application code supplies guidance. Validation is heuristic, not formal verification.
4. Guided conversation cannot reason about new facts like a model. It is explicitly labelled and remains usable during provider failures.

## How to evaluate next
Have an Indian legal professional review a fixed rubric: correct scope, no unsupported law, appropriate missing-fact question, no invented facts, suitable referral, faithful draft. Test additional Hindi/Hinglish paraphrases, conflicting facts, malicious inputs, state-specific variations, notices and real provider outages. Measure draft correction rate and professional escalation accuracy, not “win probability.”

## Scaling
A small per-topic curated knowledge pack is cheap to serve. Review sources with dates and version control before expanding scope. Use provider budgets, authenticated access and durable rate limits before public release. The initial deployment is owner-private. Add specialist-reviewed state packs and retrieval only when there is an evaluation set to measure them.

## AI tools used
Codex for research, coding, tests and UI verification; Gemini for three synthetic conversational-intake tests. All app decisions, boundaries and outputs remain inspectable in source. The user must understand and adapt this work before submitting under the assignment's integrity requirements.

## Expanded release
The earlier section describes the initial prototype. The current feature scope, measurements, failed runs and known limitations are documented in README.md and BENCHMARKS.md. The final live suite had 11/12 AI completions and one retained provider 503; it is not a perfect-accuracy claim.
