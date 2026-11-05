# External dataset attribution

Task: **contract_nli_confidentiality_of_agreement**, distributed as part of LegalBench and derived from ContractNLI.

- Task description and licence: https://hazyresearch.stanford.edu/legalbench/tasks/contract_nli_confidentiality_of_agreement.html
- Licence: **Creative Commons Attribution 4.0 (CC BY 4.0)**, https://creativecommons.org/licenses/by/4.0/
- Guha et al., *LegalBench: A Collaboratively Built Benchmark for Measuring Legal Reasoning in Large Language Models* (2023), https://arxiv.org/abs/2308.11462
- Koreeda and Manning, *ContractNLI: A Dataset for Document-level Natural Language Inference for Contracts* (2021), https://arxiv.org/abs/2110.01799
- Dataset distribution: https://huggingface.co/datasets/nguha/legalbench

The original test TSV is preserved with its upstream revision and SHA-256 checksum in `data/public-manifest.json`. A deterministic subset of six Yes and six No examples was selected by sorting source text hashes within each label. Selection did not use model responses.

**Changes/adaptation:** Clauses were supplied as text attachments to the production app. Its document-answer verdict was mapped to Yes (supported), No (contradicted/not_found), or abstention (unclear/missing/provider failure). The app's own production prompt was used, rather than LegalBench's demonstration prompt. This is an adapted 12-example subtask sample, not the full LegalBench benchmark or an official leaderboard result. Expected labels were never included in assistant input.

The six-example native-transport probe uses the first three examples of each label in the frozen 12-example sample. It was selected for diagnosis after service failures and is not a fresh independent holdout.
