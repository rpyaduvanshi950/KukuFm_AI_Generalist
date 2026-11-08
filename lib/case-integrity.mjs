// Pure shared rules for every draft, review, adoption and export entry point.
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
export const reviewKey=context=>JSON.stringify(stable(context));
export const recordMaterial=items=>items.map(({id,revision,name,kind,text,image,page,pages,coverage,warnings})=>({id,revision,name,kind,text,image,page,pages,coverage,warnings}));
export const recordSummary=items=>items.map(({id,revision,name,kind,page,pages,coverage,warnings})=>({id,revision,name,kind,page,pages,coverage,warnings}));
export function versionRecords(previous,next){return next.map(item=>{const old=previous.find(p=>p.id===item.id);const unchanged=old&&reviewKey(recordMaterial([{...old,revision:undefined}]))===reviewKey(recordMaterial([{...item,revision:undefined}]));return {...item,revision:unchanged?(old.revision||old.id):crypto.randomUUID()}})}
export function messagesForReview(messages,attachments){
 const current=reviewKey(recordSummary(attachments));
 return messages.filter(m=>!m.reviewContext?.records?.length||reviewKey(m.reviewContext.records)===current).map(({role,content,reviewContext})=>({role,content:reviewContext?'[Historical answer context: '+JSON.stringify(reviewContext)+']\n'+content:content}));
}
export const isCurrent=(record,key)=>Boolean(record&&!record.invalidated&&record.reviewKey===key);
export function createReviewSession(){
 let serial=0,controller;
 return {begin(){controller?.abort();const active=new AbortController(),ticket=++serial;controller=active;return {signal:active.signal,current:()=>ticket===serial&&!active.signal.aborted}},cancel(){serial++;controller?.abort();controller=undefined}};
}
export function prepareDraft(previous,text,key,snapshot){
 const history=[...(previous?.history||[])];
 if(previous?.text)history.push({text:previous.text,preparedAt:previous.preparedAt,snapshot:previous.snapshot});
 return {text,reviewKey:key,snapshot,preparedAt:new Date().toISOString(),invalidated:false,history};
}
export function factCandidates(facts=[],analysis={}){
 return facts.map(f=>{
  const alternatives=facts.filter(other=>other.field===f.field&&other.value.trim()!==f.value.trim());
  const quotedConflict=(analysis.documentIssues||[]).some(issue=>issue.kind==='conflict'&&(issue.evidence||[]).some(e=>e.attachmentId===f.sourceId&&(e.quote.includes(f.value)||f.quote.includes(e.quote))));
  const unresolved=analysis.documentAnswer?.verdict==='unclear'||quotedConflict;
  const correction=analysis.documentAnswer?.verdict==='supported'&&(analysis.documentAnswer.evidence||[]).some(e=>e.attachmentId===f.sourceId&&e.quote.includes(f.value)&&/correct(?:ion|ed)|replaces|सुधार/i.test(e.quote));
  return {...f,adoption:unresolved||alternatives.length||correction?'resolution_required':'confirm',status:unresolved?'unresolved':correction?'supported_correction':alternatives.length?'multiple_candidates':'unverified',reason:unresolved?'The reviewed records are unresolved. Identify controlling evidence or explain your resolution.':correction?'A correction is recorded. Identify the controlling passage before using the corrected value.':alternatives.length?'Different values are proposed for one case field. They may describe different transactions; explain which belongs here.':''};
 });
}
export function outstandingConflicts(review,resolutions=[]){
 const candidates=factCandidates(review?.facts||[],review||{}),fields=[...new Set(candidates.filter(f=>f.adoption==='resolution_required').map(f=>f.field))];
 return fields.map(field=>({reviewId:review?.reviewId,reviewedAt:review?.reviewedAt,context:review?.snapshot,field,status:candidates.some(f=>f.field===field&&f.status==='unresolved')?'unresolved':candidates.some(f=>f.field===field&&f.status==='supported_correction')?'supported_correction':'selection_required',alternatives:candidates.filter(f=>f.field===field).map(({value,sourceId,quote})=>({value,sourceId,quote})),resolution:resolutions.find(r=>r.reviewId===review?.reviewId&&r.field===field)||null}));
}
export function resolveCandidate(candidate,explanation,review){
 if(typeof explanation!=='string'||explanation.trim().length<12)throw Error('Explain the controlling evidence or how you resolved the alternatives.');
 if(!(review?.facts||[]).some(f=>f.field===candidate.field&&f.value===candidate.value&&f.sourceId===candidate.sourceId&&f.quote===candidate.quote))throw Error('This candidate is not part of the reviewed records.');
 return {reviewId:review.reviewId,field:candidate.field,value:candidate.value,sourceId:candidate.sourceId,quote:candidate.quote,explanation:explanation.trim(),status:'user_resolved_not_verified'};
}
/** @param {any} input */
export function caseExport(input){
 const {context,key,draft,analysis,resolutions=[],messages=[],conflictRecords}=input;
 const current=isCurrent(analysis,key),draftFresh=isCurrent(draft,key);
 const pick=a=>a?{topic:a.topic,sourceIds:a.sourceIds,documentAnswer:a.documentAnswer,documentFindings:a.documentFindings,documentIssues:a.documentIssues,answerSupport:a.answerSupport}:null;
 return {exportedAt:new Date().toISOString(),...context,attachments:recordSummary(context.attachments||[]),messages,draft:draftFresh?draft.text:null,draftStatus:!draft?'none':draftFresh?'current':'outdated_excluded',draftPreparedAt:draft?.preparedAt,
  reviewedInformation:current?pick(analysis):null,reviewStatus:!analysis?'none':current?'current':'superseded',
  historicalReview:analysis&&!current?{status:'superseded_not_current_evidence',reviewId:analysis.reviewId,reviewedAt:analysis.reviewedAt,context:analysis.snapshot,information:pick(analysis)}:null,
  unresolvedConflicts:(conflictRecords||[analysis]).flatMap(r=>outstandingConflicts(r,resolutions)),factResolutions:resolutions,
  warnings:[...(!draftFresh&&draft?[context.language==='hi'?'पुराना मसौदा हटाया गया है। वर्तमान विवरण जाँचकर नया मसौदा बनाएँ।':'Outdated draft excluded. Review current facts and regenerate before sharing.']:[]),...(!current&&analysis?[context.language==='hi'?'पिछली समीक्षा पुरानी है; उसके निष्कर्ष वर्तमान प्रमाण नहीं हैं।':'Previous analysis is superseded; its findings are not current evidence.']:[])],note:context.language==='hi'?'उपयोगकर्ता के तथ्य और समाधान असत्यापित हैं। कुछ भेजा या दाखिल नहीं किया गया।':'User statements and resolutions are unverified. Nothing has been sent or filed.'};
}
