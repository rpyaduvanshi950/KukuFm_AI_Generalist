import {KNOWLEDGE_VERSION} from './knowledge.mjs';
import {PROMPT_VERSION} from './prompt-policy.mjs';
// Exactly these public identifiers are exposed, never arbitrary runtime settings.
export function buildIdentity(){return {id:process.env.NEXT_PUBLIC_BUILD_ID||'local-unversioned',sourcePack:KNOWLEDGE_VERSION,prompt:PROMPT_VERSION}}
