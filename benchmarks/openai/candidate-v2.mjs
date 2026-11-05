import {prepareRequest as prepareV1} from './candidate.mjs';
export const candidateVersion='semantic-evidence-v2';
export function reviseSystem(system){
 return system.replace('Do not infer a specific obligation from a generic confidentiality label.',
 'Assess meaning rather than identical wording. A prohibition may apply through a defined term, reciprocal duty or a clear paraphrase. A bare heading alone is not evidence. For a question asking whether an item is treated as confidential, an explicit definition including that item supports that classification, but does not establish an unstated remedy or enforceability. Distinguish that classification from an additional specific duty the text never states. Account for express exceptions without treating a qualified duty as no duty. Do not require the question’s exact vocabulary in the document; do not assume missing cross-references, unidentified parties or omitted terms.')
 .replace('max 1600 characters','max 900 characters').replace('max 500 characters','max 250 characters')
 .replace('array of at most 4 {attachmentId,quote,comment}','array of at most 2 {attachmentId,quote,comment}')
 +'\nANSWER CHECK: Answer the latest question directly. Use the evidence and reviewed pack, preserving each actor, condition and exception. Your verdict and explanation must agree about the same proposition. Quotes must be literal; conclusions should interpret meaning, not compare strings. Keep the reply to 2–4 short sentences; ask at most one essential missing-fact question and otherwise use an empty question string. Avoid repeating the same document quotations in documentFindings when documentAnswer already contains them. Do not offer generic follow-ups after answering a closed document question. Return the required JSON only.';
}
export function prepareRequest(body,variant){
 const request=prepareV1(body,'original');
 if(variant==='candidate')request.messages[0].content=reviseSystem(request.messages[0].content);
 else if(variant!=='original')throw Error('Unknown prompt variant');
 return request;
}
