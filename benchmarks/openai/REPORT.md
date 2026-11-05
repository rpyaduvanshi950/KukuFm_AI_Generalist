# GPT mini evaluation — 6 November 2026

Model: `gpt-5.4-mini-2026-03-17`, Chat Completions, reasoning `none`, maximum 1,200 completion tokens, storage disabled. Both prompt variants use identical model settings and the current production answer validator. No search tools, retries, key rotation or model judge were used.

| Evaluation | Original prompt | First candidate | Selected v2 |
| --- | ---: | ---: | ---: |
| Public LegalBench sample, correct / 12 | 9 | 7 | 11 |
| Existing custom content checks, pass / 12 | 12 | 12 | 12 |
| Fresh synthetic document questions, binary correct / 12 | 12 | — | 12 |
| Fresh synthetic document questions, exact four-way verdict correct / 12 | 11 | — | 11 |

The first candidate was rejected. V2 changes document reading from literal wording matching to evidence-based interpretation of definitions, reciprocal duties, paraphrases and exceptions. It also asks for shorter replies and avoids duplicated quotations. The selected policy is in `lib/prompt-policy.mjs`.

## Limits and remaining errors

- **Public sample is a development result.** It is the same 12-row, balanced subset of one LegalBench task used earlier. V2 was revised after inspecting round-one errors. It is not a blind score, full LegalBench score, independent comparison or Indian legal advice accuracy estimate.
- The 12 fresh reading examples were written and frozen before v2 calls. Both model variants then saw identical inputs. The app author also wrote these cases; this is not external lawyer validation. Both variants answered all binary questions correctly, but both mislabeled an unspecified refund deadline as `contradicted` instead of `not_found`. This is a retained failure.
- V2 still misses public source row 7: it treats confidentiality of the agreement's existence as insufficient for the task proposition. The raw unsuccessful answer remains in the results.
- Custom scores are automated required/forbidden phrase and routing proxies, not expert legal correctness. One foreign-jurisdiction scenario deliberately returns guided refusal without making an API request. The original prompt also produced an unsupported section in a document-injection case; the application rejected it and returned guided help. This still passed the content proxy, demonstrating the proxy's limits.
- An initial original-prompt request was blocked by the local network environment. Its guided response remains in round-one results and its conservative cost reservation is retained. After network access was granted, no provider connection failures occurred in either round. This environmental failure should not be attributed to GPT availability.
- No statistical claim of superiority follows from these small, authored and partly reused samples. Further independent, jurisdiction-specific review is needed.

## Usage and brevity

There were **93 generation attempts** in the two rounds, including the initial blocked connection. Provider-reported token charges, calculated conservatively without cache discounts at $0.75/M input and $4.50/M output, total **$0.20198625**. Local accounting including the unknown-usage reservation is **$0.22111575**, under the combined $0.50 guard. This is an estimate from returned usage, not an invoice. The local guard does not configure an account billing limit or cap ordinary website use.

On the 22 existing cases with usage captured for both original and v2, mean completion tokens fell from **269.45 to 209.50 (22.25%)**. This includes one original answer rejected by the validator. It is a descriptive result from a single run, not a general speed/cost guarantee. The longest v2 answer on the existing custom/public cases used 333 completion tokens, below the 1,200-token ceiling.

Release checks are excluded from the scores and the 93-attempt benchmark count. Two initial synthetic checks (browser question and HTTP attachment) revealed that the running preview retained its previous Gemini settings; their results are preserved in `ui-smoke-before-restart.json`. After restarting, one additional HTTP attachment check verified the selected GPT model, an evidence-backed supported verdict and the output ceiling; see `ui-smoke.json`. Browser fact application, the case workspace and editable draft creation were also checked. No confidential user documents were used.

## Reproduction and evidence

- `../results/openai-mini/`: round-one frozen plan, raw answers, usage, request IDs, failures and checks.
- `../results/openai-mini-v2/`: v2 plan and answers, plus original/v2 fresh-case comparison.
- `fresh-documents.json` and `fresh-manifest.json`: 12 authored reading cases and their pre-call checksum.
- `candidate.mjs`, `candidate-v2.mjs`, `run.mjs`, `run-v2.mjs`: prompts and protocol used. Plan hashes record the implementation and input hashes at execution. Original app engine was commit `62f4aa530e4cf59e3042befdf52b0892d5c73fc4`; subsequent application changes apply the selected v2 policy.
- The runner persists a cost reservation before each network call, alternates paired order, stops on provider/network errors, refuses concurrent runs and refuses resuming against changed source. It never sends expected labels or phrase checks to the model. Existing result directories are historical; do not overwrite them to rerun a changed app.
- V2 runs only the candidate on the existing 24 cases, and both variants on the 12 fresh cases. Its generic raw summary's original `planned: 36` field does not describe that selection; the original v2-round plan was 12 fresh cases. Use the explicit completed denominators above.

Public task attribution, dataset revision and licence are recorded in `../ATTRIBUTION.md` and `../data/public-manifest.json`.

Official model/pricing reference: https://developers.openai.com/api/docs/models/gpt-5.4-mini

## API key

Paste the key after `OPENAI_API_KEY=` in `.env.openai.local` for local benchmark scripts. It is excluded by `.gitignore`, with owner-only file permissions. Never put keys in client code, source control or chat. The deployed site's key is a server runtime secret; local files do not automatically configure hosting. The previous Gemini local configuration is preserved in an ignored owner-only backup.
