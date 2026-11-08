# v5: refund journey and evidence evaluation

Run date: 7 November 2026, India local date. Independent legal review is pending.

## What was tested

Fifty synthetic scenarios cover refund intake, missing or corrected details, English/Hindi/Hinglish, literal document interpretation, conflicting records, notices, domestic safety, cyber incidents, state/foreign scope and prompt injection. Inputs and expected mechanical checks are in `cases.json`; the input hash and limits are in `manifest.json`. The implementer wrote the cases and had access to them. They are not blinded, independently authored, Public LegalBench, or lawyer-approved examples.

Thirty development cases were run first. A routing miss for police appearance notices was fixed and sentence-support output was moved after the primary answer fields before running the twenty reserved final cases once. The exact final engine is preserved in `evaluated-lib/`. Development and final implementation hashes differ. The aggregate 50-case figure therefore combines development and final snapshots and is not a single-release holdout score.

## Comparison

| System | Development checks | First final checks | Combined checks | Final document verdicts | Combined AI responses |
| --- | --- | --- | --- | --- | --- |
| General guided information | 15/30 | 7/20 | 22/50 | 0/8 | 0/50 |
| Plain GPT baseline | 26/30 | 14/20 | 40/50 | 6/8 | 50/50 |
| Nyaya | 29/30 | 15/20 | 44/50 | 7/8 | 45/50 |

The five non-AI Nyaya responses consist of deterministic refusals/escalation handling and validation fallbacks. Coverage is reported separately. A fallback can pass some routing or phrase checks; that is not completed AI document interpretation.

Both paid arms used `gpt-5.4-mini-2026-03-17`, a 1,200-completion-token ceiling, disabled reasoning and `store:false`. Inputs were identical and execution order alternated between the paid arms. The plain baseline received a generic helpful/safety prompt and the required output schema, but no curated reference library, deterministic routing or production output validator. This compares complete systems, not isolated model quality. Guided mode is a capability baseline, not a competing document model.

Nyaya's first final document result was 7/8; the baseline was 6/8. Across both splits the counts were 18/19 and 16/19. These samples are too small and internally authored to establish a statistically reliable advantage, general Indian-law competence, or market superiority.

## Cost and latency

The evaluation made **98 paid requests**, with an estimated **$0.15146325** from reported token usage at the recorded rates, ignoring cache discounts. The local shared cap was $0.50 and 102 requests. Unknown usage retains a conservative reservation, and failures are not retried automatically. Two Nyaya cases were handled without provider calls. Browser verification is separate from these 98 requests and used synthetic material only.

- Plain baseline: $0.04847025; combined median latency 1.862 seconds.
- Nyaya: $0.102993; combined median latency 1.808 seconds.
- Guided: no provider spend; local timing is not comparable to network latency.

These estimates are not an invoice or a promised per-user cost. No claim that Nyaya is cheaper than the plain baseline is made.

## What the checks mean

Common case checks cover declared routing flags, topic labels, narrow required/forbidden content proxies, exact document verdicts and literal evidence/page matching. A phrase match can pass a poor answer or fail a reasonable paraphrase. The reference-policy check is reported separately: it checks conformance to Nyaya's limited source policy, not correctness under all law. Quote matching verifies text provenance, not semantic entailment, document authenticity or legal applicability.

Sentence-level support was returned and accepted for 8/50 Nyaya responses across the two snapshots. Closed document questions have their separate document-answer evidence. Answers without matched sentence support explicitly say so in the interface. This is not a claim that every generated sentence has verified support.

## Retained failures and later fixes

Full failures and raw model text are preserved in the recorded development/final JSON files. Notable examples:

- `refund-partial` produced malformed structure and fell back to guided information despite passing the coarse phrase checks. This illustrates why coverage must be shown separately.
- `final-no-amount` also fell back and failed the missing-detail content check.
- `final-doc-conflict2` returned the wrong label for competing payment records. That model error remains in the final score; it was not prompt-tuned and re-run.
- `final-hindi`, `final-negated-danger` and `final-rental` exposed deterministic routing weaknesses involving consumer-court wording in Hindi, a general safety question and the word “tenancy”.

After recording the first final results, those three routing weaknesses were fixed. `post-final-routing.json` records four distinct, deterministic regression examples, including an active attack alongside a general-question phrase. This is **post-final regression evidence**, not another unseen evaluation. The release source hash differs from the evaluated final snapshot. The final scores above were not overwritten, regraded or advertised as measurements of the later release.

The final automated software suite has 184 passing checks. These checks are not 184 independent legal cases. Manual browser checks cover the refund request, confirmation invalidation, consent, exports and quotation navigation; see the UI verification note for the observed outcome.

## Reviewer handoff and reproducibility

`REVIEW.csv` is deliberately blank. A qualified reviewer should grade factual accuracy, legal support, escalation and usefulness, identify critical errors, and record disagreements without changing the original outputs.

- `cases.json`, `manifest.json`: inputs, split, expected proxies and hash.
- `results/development.json`, `results/final.json`: complete outputs, raw provider text, errors, usage, timing and hashes.
- `results/ledger.json`: request reservations and reconciled usage.
- `summary.json`: computed aggregates and all failed checks.
- `evaluated-lib/`: exact final evaluated engine, with a matching content hash.
- `post-final-routing.json`: separate later deterministic hardening results.
- `/benchmarks`: inspectable web view of all 50 cases and their outputs.

The exact development snapshot is also retained in `development-lib/` and matches its recorded hash. The original `run.mjs` refuses to append changed-engine results. Do not repeat the reserved set and label it an untouched holdout. A new model run requires a new versioned evaluation and an explicit budget. Keys are read from ignored local configuration and never written into results.

## Separate integration check

Two synthetic browser review requests were sent. The first returned an AI response but a development reload cleared the in-memory preview before it was inspected. The second was rejected by the output validator and visibly returned guided information. One separate diagnostic request (`ui-review-diagnostic.json`) succeeded with two matched sentence references and two matched document findings; its measured cost was $0.0047535. These are not additional scored benchmark cases. Browser usage is unknown and is conservatively reserved separately from the 98-request ledger.

Integration inspection also found that the app-generated phrase “legal deadline” in its own review request triggered an urgency banner. The helper now sends plain labelled facts and a neutral review question, with a separate regression test. This is another post-evaluation integration change, not a retested final score. The last browser verification is recorded in `UI-VERIFICATION.md`.
