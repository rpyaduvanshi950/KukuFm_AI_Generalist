# Audit remediation: 8 November 2026

Implemented locally on `main`, based on commit `7116f78`. This report records the local verification stage, before publication was separately authorized. No commit, push, deployment, hosting-setting change or paid AI call occurred during that stage. See the root README for current branch status. No actual API key was read, printed or requested. The preview used a clearly synthetic credential and a test-only provider fixture that blocks external fetches. All test records are synthetic.

## Finding status

| Finding | Status | Implementation and limits |
| --- | --- | --- |
| 1. Stale drafts and exports | Fixed | One context key covers facts, specialist notes, topic, language, attachment revisions, evidence selections, timeline and user resolutions. Both preparation flows use it. Material changes reset confirmation and invalidate draft/review state. Stale edited text remains visible; normal copying and draft downloads are blocked. Regeneration retains edited versions for comparison. JSON excludes stale draft text/current findings and labels the historical review separately. Lawyer summaries omit superseded findings and include warnings. |
| 2. Conflicting fact adoption | Fixed with stated boundaries | Unresolved alternatives carry status and sources and have no ordinary adoption action. A user must explain controlling evidence and deliberately select a value. Resolutions are labelled user assertions, not verified truth. Earlier unresolved groups persist in exports with their review context; later explanations do not silently change current facts. Explicit corrections have their own confirmation status. Two numbers for different transactions are not automatically a legal conflict. |
| 3. Supporting references | Partially addressed | Misleading support claims were removed. UI and summaries say “Related passage: support not verified.” The checker drops instruction-only requests, short fragments and plainly unrelated associations; user assertions are separate from recommendations and app summaries are separate from statutes. Lexical filters cannot establish semantic entailment or legal applicability. Qualified review remains necessary. |
| 4. Attachment analysis and consent | Fixed in source; browser file checks incomplete | All existing attachment-change callbacks already withdrew consent. New monotonic record revisions distinguish adding, removing, redacting text and switching page/image material, even if original text is restored. Results retain the reviewed record identity; changed context hides current findings/adoption controls and labels prior analysis superseded. Removed/revised document quotations are omitted from subsequent provider-bound assistant history, while local history retains its original context. |
| 5a. Hindi safety/privacy/controls | Important copy translated; full localisation partial | Consent, privacy, uncertainty, urgency/escalation, common errors, preparation/adoption controls, draft warnings and export warnings have Hindi text. Some source notes, headings, evidence items and detailed specialist field labels remain English. Hindi legal/procedure translations still need bilingual qualified review. |
| 5b. Composer focus | Fixed and browser verified | Later CSS restores a visible outline over the composer reset. Keyboard navigation and `:focus-visible` were observed at a real 390×844 viewport. |
| 5c. Answer mode vs availability | Fixed in source | Each assistant message says AI-assisted or Guided information independently of the service-availability badge. Fixture responses are explicitly labelled mocked and are not model evaluation. |
| 5d. Build identity | Fixed; HTTP verified | Footer and `/api/status` expose only build/source fingerprint, source-pack version and prompt version. No arbitrary runtime settings are exposed. |
| 5e. Public/private wording | Already fixed in current main | Current public-facing copy no longer describes the demo as owner-private. Historical evaluation descriptions retain their original context. |
| 5f. 184/183 typo | Fixed, documentation only | The v5 report now says “not 184 independent legal cases.” No measured result or benchmark data was changed. |

## Software verification

- `npm test`: 207 application checks passed, zero failed. This includes 17 focused audit regressions. These are not 207 independently reviewed legal scenarios.
- `npm run test:render`: 2 origin checks passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; final validation was repeated after source changes.
- `npm run test:http`: production no-key HTTP smoke passed with temporary PostgreSQL. It covers public access, health/assets, origin/input rejection, guided chat and no paid reservations without a key.
- `node scripts/test-postgres-local.mjs --audit-http`: production HTTP checks passed with a blocked-network provider fixture, including unresolved amount alternatives, explicit correction confirmation and the build-identity allowlist. It is a mocked integration test, not fresh model evaluation.

The audit-specific tests cover stale export exclusion, edited-history preservation, material context changes, record revisions, stale-quotation omission, conflict resolution, corrections/different transactions, irrelevant references, safe saved-state parsing, stale-quotation omission, clear-case request cancellation and public build metadata.

## Browser observations

Observed against the local development preview with temporary PostgreSQL and a mocked provider:

- Generated an INR 830 Case workspace draft, edited its text, then changed the amount to INR 380. Confirmation reset; Copy, Download and preparation were disabled; the edited old text and an outdated warning remained visible. This was observed on desktop and mobile.
- Applied a 390×844 viewport and read actual `window.innerWidth=390`, `innerHeight=844`. The inspected document scroll width was 375, with no horizontal overflow in that view. This is not comprehensive coverage of all mobile states.
- Used keyboard Enter to open mobile navigation and the Case workspace. Shift+Tab reached composer `#problem`; it matched `:focus-visible` and had a solid outline.
- Enabled optional saving, reloaded and confirmed amount INR 380 and the synthetic story restored, without a draft. Clearing the synthetic case and reloading left the fields empty and saving off.
- Build/source-pack/prompt identifiers were visible in the footer.

Proof: [stale draft](stale-draft.png), [mobile composer focus](mobile-focus.png).

## Browser limitations

The download event stalled and reset the browser session. A later file-chooser attempt also stalled; the bounded temporary preview stopped automatically. Browser download completion, PDF/DOCX/TXT extraction, readable file errors, truncation/page warnings, document-consent blocking/renewal, attachment removal, quote navigation and the conflict/correction adoption controls were therefore **not verified in the browser** during this pass. Their source-level and deterministic coverage must not be advertised as completed browser or live model tests. Hindi visual flows and a complete keyboard/screen-reader audit also remain unverified.

The viewport override was reset. No public deployment or real user case was used for these checks.

## Changed areas

- `app/page.tsx`: shared preparation/review freshness, conflict resolution UI, current-only exports, consent wiring, answer mode and Hindi safety copy.
- `lib/case-integrity.mjs`, `lib/case-storage.mjs`: shared state/export rules, record versions and bounded optional saving.
- `components/refund-journey.tsx`, `attachments.tsx`, `specialist-workflow.tsx`: preparation freshness, file privacy/consent copy and translated controls.
- `lib/assistant.mjs`: suggestion status in validated and fallback outputs.
- `lib/answer-support.mjs`, `components/answer-support.tsx`, `lib/case-brief.mjs`: conservative related-passages policy and honest export labels.
- `app/globals.css`: focus and narrow-screen safeguards.
- `lib/ui-copy.mjs`: critical Hindi messages.
- `next.config.ts`, `lib/build-identity.mjs`, `/api/status`: non-sensitive build identification.
- `tests/audit-*.mjs`, `tests/fixtures/audit`, `scripts/make-audit-fixtures.py` and the isolated PostgreSQL wrapper: reproducible no-paid-call checks.

Independent Indian legal review remains pending. In particular, review source applicability, semantic associations, Hindi safety wording, notice procedures and whether a user’s chosen resolution is actually supported by complete original records. The app still cannot authenticate records, determine rights or outcomes, calculate legal deadlines, send notices or file cases.

Historical benchmark inputs, raw outputs, failures, scores and evaluated snapshots are unchanged. The only historical-report edit is the explicitly requested 184/183 explanatory typo.
