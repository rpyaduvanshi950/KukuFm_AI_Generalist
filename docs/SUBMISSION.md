# Problem 2 submission walkthrough

## Review order

1. Read the [README](../README.md) for setup, scope and safeguards.
2. Open the [hosted demo](https://kukufm-ai-generalist.onrender.com/). It runs `render-deploy`; use `main` locally for the latest submission fixes.
3. Try the refund journey below. It produces a factual request even without AI.
4. Inspect [50 original inputs](../benchmarks/v5/cases.json), [raw final outputs](../benchmarks/v5/results/final.json), [historical report](../benchmarks/v5/REPORT.md) and [later regression](../benchmarks/submission/REPORT.md).

## Five-minute demonstration

Use synthetic facts only.

1. Open **Refund preparation**. Enter: “I cancelled an online order. The seller approved a refund, but payment is pending. I want a written update and my payment returned.”
2. Set seller **Example Store**, order **ORDER-TEST-10**, and the requested outcome. Leave amount/date blank to show explicit unknowns.
3. Under **Records and options**, attach `tests/fixtures/refund-record.pdf`. Expand the text and compare with the original. **INR 4500** is a quoted suggestion, not an automatically accepted fact.
4. Optional with configured AI: attempt review without consent to see the block. Review/redact the extract, check consent and request analysis. Inspect quotes and reading limits. Provider failure is labelled as guided fallback.
5. Open **Review your request**. Generation is disabled until confirmation. Check the facts, confirm and prepare the request. Unsupplied amount/location/date stay as placeholders.
6. Edit and download the request and lawyer summary. Nothing is sent/filed; this is not a lawyer-issued legal notice.
7. Change the seller/details: prior confirmation and downloads become stale and need review again.
8. Switch to Hindi to inspect the translated preparation labels/request. Some navigation and reference notes remain English.

For conflict reading, inspect `benchmarks/submission/cases.json`: inconsistent receipts for one event should yield **unclear**. An explicit correction or two different transactions should not automatically become a conflict. These are expected behaviours, not guaranteed generations.

## Assignment mapping

| Requirement | Evidence |
| --- | --- |
| Describe an Indian legal problem | English/Hindi text conversation and scoped routing |
| Build the case | Reviewed facts, evidence, manual timeline, notes and exports |
| Help act | Complete refund journey; deposit/salary requests; specialist briefs |
| Admit uncertainty and escalate | Visible limits, urgent routes, unknowns, fallback and lawyer referral |
| Explain hallucination safeguards | README, guide, source pack, validators and adversarial tests |
| Own test cases and raw outputs | Versioned inputs, complete model text, errors and comparisons |

Voice and argument rehearsal are absent; the statement allows text **or** voice and presents rehearsal as optional. Independent legal review remains pending. Mechanical checks are not legal accuracy; offline replay is not fresh model testing.

## Branches

`main` is the submitted Node/Next.js/PostgreSQL app. The existing Render service remains on `render-deploy`; this update does not push that branch. Earlier Sites source remains at `c7f3986`. Secrets, real case records and the confidential Problem 1 input pack are outside this submission.
