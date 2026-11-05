# Nyaya evaluation v3

This evaluation distinguishes application behaviour, document interpretation, unavailable responses and regression tests. It does not certify Indian legal advice.

## Frozen inputs and reproducibility

- `data/india-cases.json`: 56 authored cases, frozen before development changes. SHA-256 and the original application commit are in `india-manifest.json`.
- Development: 43 cases. Holdout: 13 cases not executed during development. The author had access to their contents; this is not an independent or blinded expert test.
- `data/live-cases.json`: eight paired cases and four live holdout cases, with explicit required/forbidden content checks fixed before model runs.
- `data/legalbench-sample.json`: twelve externally labelled, balanced examples from the licensed public ContractNLI/LegalBench subtask. The upstream version, original test-file checksum, selected rows and licence are in `public-manifest.json`.
- `baseline/`: the three original modules copied from commit `04413070163e7410c0b9d2e84b0097148a008bec` for reproducible comparisons.

Run offline checks:

```sh
npm test
npm run benchmark:offline
node benchmarks/outage.mjs
node benchmarks/summarise.mjs
```

The first holdout output is preserved in `results/final-holdout.json`. One error was fixed after inspecting it; `post-holdout-regression.json` is a regression result, not another untouched holdout score.

## Live runner

`node benchmarks/live.mjs current paired` uses server-side provider configuration from environment variables or ignored `.dev.vars`. It imports the same response function as production. It does not send any benchmark answers or grading rules to the assistant.

A shared usage ledger records every generation attempt **before** the request. This evaluation used its full cap of **36 requests**, so further live runs will stop unless a new evaluation budget is explicitly configured. There were no retries or key rotations. Native Gemini was tested as a separate six-example transport probe, not silently substituted for failed responses.

All live inputs are synthetic cases or licensed public benchmark clauses. No real user document, Kuku screenplay or secret is part of this evaluation. Raw model text and usage are retained in each run's debug entries; provider error bodies and keys are not recorded.

## Metrics and interpretation

- **Behaviour case pass:** all predeclared expected flags/topic/refusal properties match. This checks routing and policy behaviour, not substantive rights.
- **Automated content checks:** required phrase groups and forbidden phrases are transparent proxies. They can produce false positives/negatives and do not replace expert grading.
- **Public end-to-end accuracy:** correct external labels divided by all twelve attempted examples. Provider failures and abstentions count as incorrect.
- **Public answered-only accuracy:** correct labels divided by answered examples. Always reported with coverage and denominator.
- **Balanced accuracy:** mean per-label recall; abstentions remain incorrect.
- **Wilson intervals:** descriptive 95% intervals under an independence assumption. Tiny, deterministic stratified samples do not justify population-level claims.
- **Forced outage:** a mocked HTTP 503, with no network calls, tests whether the application still gives useful reviewed guidance. This is not a live-model accuracy result.

The public task tests English contract-clause interpretation. It does not measure current Indian law, local court procedure, general legal expertise or actual case outcomes. Model training contamination is possible for public benchmarks. See ATTRIBUTION.md for licence and adaptation details.
