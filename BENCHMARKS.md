# Latest GPT evaluation

See [the GPT mini evaluation](benchmarks/openai/REPORT.md) for the 6 November prompt comparison, fresh reading tests, token usage and retained failures.

# Nyaya benchmark report

The current evaluation is [Evaluation v3](benchmarks/REPORT.md). It adds frozen authored cases, a held-out execution, externally labelled LegalBench examples, outage tests and complete failure accounting.

- Development behaviour: **29/43 before → 43/43 after**.
- First held-out execution: **12/13**; the later 13/13 is explicitly a post-exposure regression.
- Public document interpretation: **2/12 overall**, with 3/12 answered; provider unreliability dominates this small run.
- Simulated outage content checks: **1/8 before → 8/8 after**.
- **148 automated checks pass**; these are not independent legal cases.

The report does not claim perfect accuracy or market superiority. See [methodology and reproduction](benchmarks/README.md), [dataset attribution](benchmarks/ATTRIBUTION.md), and [archived v2 report](benchmarks/ARCHIVED_V2.md).
