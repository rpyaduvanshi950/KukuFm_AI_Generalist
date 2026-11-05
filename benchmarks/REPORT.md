# Nyaya: evaluation-driven improvements

The broader benchmark found real defects and substantial provider unreliability. The app is better at routing, intent handling and graceful degradation, but the live results do **not** support a claim of high general legal accuracy or public-service readiness.

## Application changes

- Current safety statements and negation now matter. Historical or quoted violence is not automatically classified as an immediate emergency.
- Reporting forged evidence is distinguished from asking the assistant to create it.
- Explicit foreign-law matters remain outside scope even when the person asking is physically in India. Indian employment/property matters are not rejected solely because a foreign company or residence is mentioned.
- A clear user topic takes precedence over instructions embedded in an attachment. Document text can still help classify an otherwise unspecified matter; this is not a complete prompt-injection defence.
- Reference validation checks every section in a list/range, unknown articles/authorities and invented filing deadlines. Known references remain usable.
- Uploaded-text questions can produce a structured answer: supported, contradicted, not established, or unclear, accompanied by source-matched quotations. Quote matching does not prove the interpretation is correct.
- AI outages preserve topic-specific reviewed next steps, emergency routing and explicit labelled document fields. Extracted fields remain unverified suggestions.
- A native Gemini adapter is available for explicit configuration, but the small probe did not establish a reliable transport improvement, so it is not automatically enabled.

## Frozen authored cases

| Evaluation | Result | Interpretation |
|---|---:|---|
| Original app on development set | 29 / 43 | Before changes |
| Improved app on development set | 43 / 43 | Known development cases, not generalisation |
| First held-out execution | 12 / 13 | One false emergency on a general definition question |
| After fixing the holdout error | 13 / 13 | Regression result after exposure; not a fresh holdout |
| Forced 503, eight paired cases: original | 1 / 8 | Required-content proxy checks |
| Forced 503, eight paired cases: improved | 8 / 8 | Useful fallback guidance under the same simulated outage |
| Forced 503, four live-holdout regressions: improved | 4 / 4 | Post-exposure regression, not independent validation |

The development fixes resolved 14 failing scenarios and 17 failed assertions. The case file and expected values were frozen with a checksum before changes. The same agent authored the cases and implementation. No independent legal professional graded them.

## Independent public labels: document interpretation

Source: LegalBench's CC BY 4.0 `contract_nli_confidentiality_of_agreement` subtask, derived from ContractNLI. The pinned test file has 82 examples. Six Yes and six No examples were selected by source-text hashes before seeing responses. The model received only each clause and the document question, not the label.

| Metric | Result |
|---|---:|
| Attempted examples | 12 |
| Answers with a classifiable verdict | 3 / 12 |
| Correct, including outages/abstentions as failures | **2 / 12 (16.7%)** |
| Correct among answered examples | **2 / 3 (66.7%)** |
| Balanced accuracy, all attempts | 16.7% |
| 503 responses | 8 |
| Timeouts | 1 |
| Descriptive Wilson 95% interval, end-to-end | 4.7%–44.8% |

This is an **adapted subtask sample**, using the production app's prompt, not an official LegalBench score. It measures English document entailment, not Indian legal advice.

One substantive error is retained: source row 17 was labelled Yes upstream, but the app returned not_found. The clause explicitly included the existence/content of the agreement in Confidential Information; the model treated the lack of a separately written prohibition in that excerpt as absence of the target obligation. We did not change the prompt or label to turn that public error into a pass. An exact source quote alone cannot settle entailment.

## Provider and comparison limits

Across 36 generation attempts, the provider returned frequent 503 errors and timeouts. The eight-case intermediate paired run had zero AI responses, so it cannot establish a prompt-quality improvement over the old model run. The original and improved runs also happened at different times; availability was not randomised or controlled.

A separate native-endpoint probe on a fixed balanced six-example subset produced 2 answers, both correct, and 4 service errors. Overall accuracy was 2/6, not 100%. Its answered-only 2/2 is too small to infer a robust improvement. No failures were replaced in the original twelve-example table.

The four live holdout cases passed 3/4 automated content checks. One Hindi cyber case answered in AI mode; two cases encountered 503; one foreign-law case was correctly declined without a model call. These keyword checks are not expert legal grading.

All **36** generation requests are logged, using one key and one model, with no retries or key rotation. Captured provider-reported tokens total **12,063**; timeouts may consume additional unreported tokens. The budget is exhausted and the runner will not silently make further calls.

## What the test suite establishes

148 automated checks pass, including the 56 authored-case regressions. This is not 148 independent legal scenarios: tests overlap and include protocol/transport/quotation checks. Reference probes block five deliberately unsupported responses while allowing two known reference forms. TypeScript and production build checks are part of release validation.

## Remaining work before serious use

Independent review by an Indian legal professional, an unseen representative case set, state-specific legal packs, stronger document and multilingual tests, durable public-service quotas, and provider reliability work. The useful current scope is a transparent legal-information and case-preparation prototype. The benchmark should guide those next investments rather than advertise a misleading perfect score.

Reproduction, immutable inputs and licences: README.md, ATTRIBUTION.md, data/*-manifest.json. All raw run files are retained in results/.
