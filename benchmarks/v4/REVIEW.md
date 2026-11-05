# Independent review pack

Status: **not independently reviewed**. These cases were authored by the implementation agent. No lawyer has approved their expected answers or the application.

Before legal quality claims or wider release, have a qualified Indian lawyer review the frozen cases and the dated source register. Do not send user documents; this pack uses synthetic examples only. Reviewer contact or engagement has not been arranged.

Score each response separately for: correct legal scope and jurisdiction; supported law and current applicability; actor/condition/exception preservation; factual accuracy; source/evidence sufficiency; missing-information handling; safe practical steps; clear language. Use 0 (wrong/unsafe), 1 (material omission), 2 (minor issue), 3 (acceptable). Record the source, reason, reviewer qualification, review date and any conflict of interest. A second reviewer should resolve disputed cases.

Document decisions use four distinct labels: supported (proposition follows), contradicted (opposite established), not_found (neither established), unclear (ambiguity or conflicting evidence prevents a decision). A missing term is not proof of its opposite. Binary accuracy alone hides these distinctions.

`development.json` contains 24 cases; `final.json` contains 16 fixed cases. `manifest.json` records their pre-change checksums. Final expected answers are excluded from model requests and results must not be used for another tuning pass under the same holdout claim. The author has seen cases while writing them; the set is withheld from iterative evaluation, not independently blind.

Record expert annotations in a separate versioned file; preserve original expectations and all failures. Report provider/validator failures in the end-to-end denominator. Report phrase checks as proxies, never as lawyer correctness. Do not merge synthetic results with public LegalBench scores.
