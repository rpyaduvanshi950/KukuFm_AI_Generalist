# Ordered improvement pass — 6 November 2026

| Evaluation | Result |
| --- | ---: |
| Frozen development baseline | 16/24 |
| General prompt revision + routing/provenance fixes | 22/24 |
| Focused reading policy selected | 24/24 |
| Frozen final set, first evaluation | 16/16 |
| Existing public LegalBench regression sample | 11/12 |

The 24 development and 16 final cases were frozen before implementation; their hashes remain unchanged. The author wrote both the application and these synthetic cases. Final cases were withheld from iterative execution, not independently blind. The final set was run once after development; no prompt change followed it. The public sample is the previously inspected balanced subset of one ContractNLI-derived task, not new holdout or full LegalBench. Licence and attribution: `../ATTRIBUTION.md`.

## What changed and what failed

The baseline confused missing amounts/timing/signatures with contradiction, lacked page provenance, missed a current knife threat and explicit foreign-law wording, and misrouted the NCH abbreviation. The first general revision reached 22/24 but retained two missing-information errors. The selected policy uses a focused single-call reading prompt for suitable closed document questions, while legal advice, safety and urgent questions retain the reviewed legal workflow. Both use the same model, validator and 1,200-token ceiling. All earlier responses and failures remain in `results/`.

The public failure is source row 11: a bare definition includes agreement existence, while the task expects Yes for its nondisclosure hypothesis. The selected prompt returned not_found. This is retained rather than rewriting the expected label or claiming a perfect score. Task convention and practical legal-duty interpretation should be reviewed by a qualified reviewer.

## Scope of grading

Document verdicts compare all four labels exactly. A PDF-text page test checks server-derived quote locations, rather than trusting model page numbers. Safety/foreign routing checks use explicit expected flags. Some practical answer checks remain phrase proxies; they are labelled as such. They are not lawyer correctness scores. Provider/validator failures would remain failures for document cases; deterministic foreign/fabrication refusal does not require a generation call.

**Independent Indian-law review remains pending.** `REVIEW.md` defines the human rubric and `review.csv` is ready for annotation. No reviewer was contacted or hired. These results do not establish correctness across all laws, authenticity of uploaded documents, legal enforceability or market superiority.

## Cost and reproduction

Model: `gpt-5.4-mini-2026-03-17`, reasoning none, no extra classifier call, no retries, no LLM judge. There were **94 generation attempts**, with calculated provider-reported token charges of **$0.183128** at the recorded rates, under the shared **$0.50 / 100-attempt** guard. This is usage accounting, not an invoice. End-to-end preview/release checks use the website's separate persistent allowance and are not benchmark score cases.

Commands: `node benchmarks/v4/run.mjs baseline development --run`; `node benchmarks/v4/run.mjs current development --tag=focused --run`; `node benchmarks/v4/run.mjs current public --run`; `node benchmarks/v4/run.mjs current final --release-evaluation --run`. Existing runs refuse changed implementation hashes. Preserve them; use a new versioned directory/protocol for future changes. `baseline-lib/` preserves the original engine. Each result records source/input/prompt hashes, usage, timings, checks and provider request IDs. Expected answers never enter a model request.

The final set grades the assistant engine directly; separate Worker/browser checks cover database access, PDF rendering, consent, timeline, summary and usage controls. A Worker redirect-mode incompatibility found during those checks was fixed in the endpoint wrapper without changing the evaluated prompt. Wider deployment remains owner-private.

## Release checks

157 automated checks and TypeScript checks passed. Browser QA verified a synthetic scanned PDF renders as a selected-page image, requires consent, and returns INR 4500 with an unverified-vision label. A dated timeline event and lawyer-summary download retained the date and reading limits. An initial date-field automation compatibility issue was fixed with input-event handling and rechecked; the evaluated assistant engine hash remains unchanged.

`results/runtime-allowance.json` records the local exhausted-allowance check: guided response, paused status, and no paid call. Local counters were restored to their exact actual pre-test values, retaining the reservation from the earlier Worker redirect failure. Production and local counters are separate.
