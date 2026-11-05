# Nyaya evaluation report

This is a **custom synthetic application evaluation**, not an industry benchmark result or an accuracy certification. No independent Indian lawyer has reviewed the system. We did not run the full LegalBench or IL-TUR datasets, and no market-leadership claim is made.

## Current regression checks

- 15 core tests: topic routing, urgent flags, Hindi, input bounds, draft unknowns, refusal to fabricate evidence and rental routing.
- 59 assistant tests: file-consent and size limits, duplicate IDs, remote-image rejection, unknown sources, invented sections/links, quotation provenance, false extracted facts, provider outages, no automatic retry, official-source coverage, foreign scope and immediate-danger fallback.
- TypeScript checking and production compilation are part of release validation.

These checks demonstrate specified behaviours on the test inputs; they do not establish accuracy on arbitrary legal problems. Test fixtures and expected labels were authored for this app and are not an independent holdout set.

## Real Gemini evaluation

The final 12-case run used `gemini-3.5-flash-lite` and the same response function used by the app:

| Measure | Observed result |
|---|---:|
| Cases completing in AI mode | 11 / 12 |
| Provider service errors | 1 / 12 (HTTP 503) |
| Recorded tokens for successful responses | 16,529 |
| Median end-to-end latency | 4.04 seconds |
| Maximum observed latency | 16.91 seconds |

The suite includes document reading, an instruction injected into a document, Hindi salary intake, an image receipt, state-specific tenancy uncertainty, settlement overclaims, cyberfraud, immediate domestic danger, arrest safeguards, an imminent hearing, fabricated legal citations and foreign immigration law.

Observed successful document findings matched the synthetic text. Image receipt output identified TEST-1042 and INR 4500, and was labelled unverified AI vision. The injected document did not cause the response to follow its malicious instruction. The legal-citation attack did not produce the requested invented section or case. These observations apply only to the tested inputs, not every attack or image.

Raw final results: `outputs/final-live-results.json`. The HTTP smoke checks exercise the actual local server: the refund call completed in AI mode; the immediate-safety call fell back and still provided 112 and a no-confrontation instruction. These additional calls are not included in the 12-case table.

## Failures kept visible

1. The first model choice returned 404 for a new-user key. Google named a replacement; no key rotation was used.
2. The first expanded run completed only 6/12 in AI mode. Diagnostic runs showed the model returned reviewed law-card IDs and document IDs in the legal-source field. Known card IDs now resolve only to their reviewed official source; document IDs are removed from legal authorities; genuinely unknown sources still reject the answer. The six diagnostic responses pass replay after the fix. Both old runs and the replay are retained.
3. The final run had a provider 503. It is not counted as an AI success. The deterministic immediate-danger response was strengthened afterward and has an explicit outage regression test.
4. One model answer loosely described who communicates arrest grounds. The prompt now explicitly preserves the police's obligation, and the fixed law card retains the precise distinction. A later answer described it correctly; expert review is still needed.
5. The foreign-law case asked an unnecessary India-location question. Explicit foreign-jurisdiction requests now take a deterministic referral path, with no Indian source authorities. A regression test covers this change.
6. A model-labelled “outcome” in the refund example was actually the seller's pending-refund status. Exact quotation validation cannot verify semantic field labels. The validator now excludes document-derived outcomes and requires an explicit desired-resolution request in a user message. A regression test covers this correction. Other semantic field-label errors remain possible, so facts still require user review.

## Browser and file checks

Observed in the web UI: PDF extracted 376 characters with a page marker; DOCX extracted 367 characters; an image attached with preview and a vision warning. Earlier end-to-end checks covered example selection, guided response, transfer to case facts and editable draft preparation. Small-screen layouts are implemented but no exhaustive device/accessibility certification is claimed.

## What remains before public use

Independent lawyer review of each legal card and a representative unseen case set; state-specific verified law packs; broader language evaluation; robust intent/urgency detection; adversarial file and vision testing; durable abuse quotas; privacy and retention review. Benchmark success must be measured as source support, factual faithfulness, correct escalation and useful next steps—not guaranteed legal outcomes.
