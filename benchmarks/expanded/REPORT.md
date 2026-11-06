# Expanded workflows: targeted regression check

Run on 6 November 2026 (local date). Ten synthetic development examples were frozen before generation, covering financial fraud, account hacking, impersonation/FIR distinction, economic control, Hindi support, private notices, conditional police safeguards, an explicit attendance date, an unstated payment term and conflicting dates. Inputs, checks, full outputs, usage and prompt hashes are retained. No real user case data was used.

- Model: `gpt-5.4-mini-2026-03-17`; 1,200 completion-token ceiling; reasoning disabled; storage disabled.
- Guard: at most ten attempts and $0.25 conservatively accounted locally; unknown usage retains the reservation; no automatic retries. This is a local guard, not a provider billing limit.
- Actual: 10 attempts, 10 AI responses, 10/10 implementer-authored checks; measured token-rate estimate **$0.02041425**, ignoring cache discounts.
- Exact document verdicts: 3/3. Other examples use limited content/routing proxies; these cannot establish legal correctness, completeness, empathy or market performance.
- These are authored development regressions, not independent, held-out, Public LegalBench or lawyer-reviewed scores. Do not combine them with historical v4 scores.

## Final hardening after the live run

Inspection found that a private-notice question mentioning a police summons could still retrieve police cards as related material. The final release also prevents FAQ/subsection numbers from accidentally authorising unrelated statutory section citations. It excludes those cards for private-notice-only contexts and tests that distinction through both primary and related retrieval. The ten live responses are preserved from before that narrower routing correction; they are not a measurement of the final source hash. The final build passes 169 automated checks, including this additional regression. No additional paid run was made after the correction. Independent qualified legal review is pending.

Browser checks verified the nonfinancial checklist switch, a downloaded incident brief with the actual entered values, the selected-safety alert, separate notice fields, synthetic file reading and question preparation without automatic submission. Quotation offsets/whitespace are covered by automated tests; a fresh live UI quote-navigation request was not run.

The runner checks frozen input and implementation hashes and refuses to append changed-code results to the preserved run. Use a new versioned evaluation for another release.
