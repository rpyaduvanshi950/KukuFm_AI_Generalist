# Browser verification

Synthetic material only. No real user document was uploaded.

Verified locally:

- The four refund stages work without an AI call. A locally quoted amount requires a deliberate “Use this amount” action.
- Unknown dates and location stay blank and become explicit placeholders in the draft.
- The confirmation checkbox gates generation. Changing the seller resets confirmation and hides stale request downloads.
- The refund request and lawyer summary download successfully. The summary includes user-entered additional notes and the attachment coverage, without bundling originals.
- Requesting document review without consent is blocked.
- The final synthetic review succeeded with an AI response, matching document quotations and two matched legal-summary references. It did not display the earlier false urgency banner from the helper instructions. User preparation text was preserved rather than replaced by generated instructions.
- “Show quoted passage” opened the extract and selected exactly `Refund approved; transfer pending.` in the source textarea.
- The evaluation page displayed all 50 cases and the three systems. Selecting the final split and failed-only filter showed five Nyaya failures. A failed competing-payment example opened with input, expected verdict, actual reply and failed check.

Important observed limitation: one AI-linked legal summary discussed consumer complaints rather than directly supporting the proposed seller-letter step. It passed literal source matching, not semantic entailment. The UI therefore labels these as references linked to the answer, states the matching limit, and labels the excerpt as the app’s reviewed summary rather than original statutory wording. Qualified review is still necessary.

The two earlier browser requests and separate diagnostic are documented in the report. Including the final successful browser review, total requests were 98 scored + 3 browser + 1 diagnostic = 102. Unknown browser usage is conservatively reserved in `integration-budget.json`. No further paid calls were made.
