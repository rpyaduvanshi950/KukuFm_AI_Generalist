# Submission regression: 7 November 2026

This is a post-exposure regression, not a new holdout or expert legal assessment. Three cases reproduce known v5 failures; seven are new implementer-authored variations covering competing receipts, corrections, different transactions, missing amounts, Hindi and injected document instructions.

## First recorded generation

Ten requests used the production response engine and `gpt-5.4-mini-2026-03-17`, a 1,200-completion-token ceiling, disabled reasoning, `store:false`, no retries and a local $0.10 cap. Cost is reserved before each request; unknown usage retains its reservation.

- **7/10** passed the declared mechanical checks; **8/10** produced accepted AI answers.
- All six closed-document cases passed their verdict checks, including the previously failing competing-payment example. This selected regression does not establish general document-reading accuracy.
- Unknown-English-amount and injected-attachment responses were rejected because the validator misread “not a guaranteed refund” as an outcome promise.
- The Hindi unknown-amount response preserved the unknown fact but omitted the expected explicit reminder. It failed a content proxy; it did not invent an amount.
- Usage: 15,224 input and 2,394 completion tokens; estimated **$0.022191**, ignoring cache discounts. This is local accounting, not an invoice. One separate browser integration request is excluded.

`results.json` retains full responses, raw provider text, usage, latency and failures. `cases.json` includes inputs and checks. `evaluated-lib/` is the exact first-run engine; `evaluated-run.mjs` is the runner snapshot. `manifest.json` records their hashes. Historical v5 records were not changed.

## Fixes and offline replay

The validator now recognises narrow grammatical negations while rejecting affirmative or mixed promises. Unknown refund amounts receive an explicit English/Hindi reminder. Software tests cover the disclaimer, attempted bypasses and preserved unknowns.

`replay.json` records those same provider responses passed through the patched engine: **10/10 replay checks passed with zero network requests**. This demonstrates the observed validation/wording fixes for stored responses, not ten new generations, a new accuracy score or unseen evaluation. No further paid model test was run after these fixes.

Document prompting also compares all relevant records and distinguishes unresolved same-event disagreements from explicit corrections/different transactions. A consistency check rejects a decisive answer that reports a conflict using the same supporting passages. Not all conflicts are guaranteed to be detected.

## Reproduction

```sh
npm run benchmark:submission          # no-network plan
node benchmarks/submission/replay.mjs # offline replay; no API call
```

The paid runner refuses to overwrite `results.json`. Do not remove it to present repeated testing as fresh. Use a new version/budget for future evaluation. All inputs are synthetic; no confidential Kuku or real user record was sent.

Independent review is pending. See [review handoff](../../docs/LEGAL_REVIEW.md) and [submission verification](../../docs/VERIFICATION.md).
