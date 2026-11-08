import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewKey,recordMaterial,versionRecords,messagesForReview,isCurrent,createReviewSession,prepareDraft,factCandidates,resolveCandidate,caseExport,outstandingConflicts} from '../lib/case-integrity.mjs';
import {lawyerBrief} from '../lib/case-brief.mjs';
import {checkedAnswerSupport} from '../lib/answer-support.mjs';
import {savedCase} from '../lib/case-storage.mjs';
import {buildIdentity} from '../lib/build-identity.mjs';
const context={facts:{story:'Synthetic refund',amount:'INR 830'},notes:{refund:{sellerReply:'Pending'}},topic:'refund',language:'en',attachments:[{id:'doc',name:'receipt.txt',kind:'text',text:'Receipt A: INR 830. Receipt B: INR 380.',warnings:[]}],evidenceChecked:[],events:[]};
const key=reviewKey(context),draft=prepareDraft(null,'Edited request for INR 830',key,{...context,attachments:[]});
const evidence=[{attachmentId:'doc',quote:'Receipt A: INR 830.'},{attachmentId:'doc',quote:'Receipt B: INR 380.'}];
const review={reviewId:'review-1',reviewKey:key,snapshot:{language:'en',attachments:[{id:'doc',name:'receipt.txt'}]},facts:[{field:'amount',value:'INR 830',sourceId:'doc',quote:evidence[0].quote},{field:'amount',value:'INR 380',sourceId:'doc',quote:evidence[1].quote}],documentAnswer:{verdict:'unclear',answer:'Conflicting values for the same event.',evidence},documentIssues:[{kind:'conflict',evidence}],sourceIds:[]};
test('changing an amount excludes the stale edited draft and analysis from current exports',()=>{
 const next={...context,facts:{...context.facts,amount:'INR 380'}};
 const out=caseExport({context:next,key:reviewKey(next),draft,analysis:review});
 assert.equal(out.facts.amount,'INR 380');assert.equal(out.draft,null);assert.equal(out.draftStatus,'outdated_excluded');assert.equal(out.reviewedInformation,null);assert.equal(out.historicalReview.status,'superseded_not_current_evidence');assert.equal(out.unresolvedConflicts.length,1);
 const brief=lawyerBrief({facts:next.facts,topic:'refund',analysis:out.reviewedInformation,warnings:out.warnings,conflicts:out.unresolvedConflicts});assert.doesNotMatch(brief,/DOCUMENT INTERPRETATION: NEEDS REVIEW/);assert.match(brief,/UNRESOLVED/);
});
test('every material preparation input invalidates a draft, not only the amount',()=>{
 for(const next of [{...context,language:'hi'},{...context,topic:'rental'},{...context,notes:{refund:{sellerReply:'Denied'}}},{...context,attachments:[]},{...context,evidenceChecked:['Receipt']},{...context,events:[{date:'',description:'Changed event',source:'User'}]}])assert.equal(isCurrent(draft,reviewKey(next)),false);
});
test('regeneration retains edited previous text for comparison but never exports stale history as a current draft',()=>{
 const next={...context,facts:{story:'Updated',amount:'INR 380'}},nextKey=reviewKey(next),renewed=prepareDraft(draft,'New checked request INR 380',nextKey,{});
 assert.equal(renewed.history[0].text,'Edited request for INR 830');assert.equal(caseExport({context:next,key:nextKey,draft:renewed}).draft,'New checked request INR 380');assert.ok(!JSON.stringify(caseExport({context:next,key:nextKey,draft:renewed})).includes('Edited request for INR 830'));
});
test('invalidated records stay outdated even after restoring the same content',()=>assert.equal(isCurrent({...draft,invalidated:true},key),false));
test('text editing, adding, removing, PDF page switching and image changes alter the review version',()=>{
 const first=reviewKey(recordMaterial(context.attachments));
 for(const items of [[],[...context.attachments,{id:'second',kind:'text',text:'Second record'}],[{...context.attachments[0],text:'Edited extract'}],[{...context.attachments[0],kind:'image',image:'data:image/jpeg;base64,AAAA',page:2}],[{...context.attachments[0],page:3}]])assert.notEqual(reviewKey(recordMaterial(items)),first);
 assert.notEqual(reviewKey(recordMaterial([{id:'scan',kind:'image',image:'image-one'}])),reviewKey(recordMaterial([{id:'scan',kind:'image',image:'image-two'}])));
});
test('all competing amounts in an unresolved review require an explained resolution',()=>{
 assert.ok(factCandidates(review.facts,review).every(f=>f.adoption==='resolution_required'&&f.status==='unresolved'));
 assert.throws(()=>resolveCandidate(review.facts[0],'',review),/Explain/);
 assert.throws(()=>resolveCandidate({...review.facts[0],value:'INR 999'},'I selected the controlling receipt.',review),/not part/);
 const resolution=resolveCandidate(review.facts[1],'I checked the original bank record and chose receipt B.',review);
 assert.equal(resolution.status,'user_resolved_not_verified');assert.equal(outstandingConflicts(review,[resolution])[0].resolution.sourceId,'doc');
});
test('an explicit correction is not labelled an unresolved conflict but needs evidence confirmation',()=>{
 const corrected={facts:[{field:'amount',value:'INR 380',sourceId:'doc',quote:'Correction: amount is INR 380.'}],documentAnswer:{verdict:'supported',evidence:[{attachmentId:'doc',quote:'Correction: amount is INR 380.'}]}};
 const [candidate]=factCandidates(corrected.facts,corrected);assert.equal(candidate.status,'supported_correction');assert.equal(candidate.adoption,'resolution_required');
});
test('different numbers alone are not a legal conflict, and a single fact stays an ordinary unverified candidate',()=>{
 const [candidate]=factCandidates([review.facts[0]],{documentAnswer:{verdict:'supported'}});assert.equal(candidate.status,'unverified');assert.equal(candidate.adoption,'confirm');
 const candidates=factCandidates(review.facts,{});assert.ok(candidates.every(f=>f.status==='multiple_candidates'));
});
test('an unresolved review is retained prominently when a newer review replaces it',()=>{
 const out=caseExport({context,key,analysis:{reviewId:'new',reviewKey:key,facts:[]},conflictRecords:[review]});assert.equal(out.unresolvedConflicts[0].reviewId,'review-1');assert.equal(out.unresolvedConflicts[0].alternatives.length,2);
});
test('instruction-only user quotes cannot be attached as support for a seller recommendation',()=>{
 const reply='Write to the seller and request a refund.';
 assert.deepEqual(checkedAnswerSupport([{statement:reply,sourceId:'message-0',quote:'Please help me write to the seller for a refund.'}],reply,{messages:[{role:'user',content:'Please help me write to the seller for a refund.'}]},[],[]),[]);
});
test('short legal fragments and lexically irrelevant passages are dropped',()=>{
 const source={id:'law',scope:'appearance-notice process',title:'Official summary'};
 assert.deepEqual(checkedAnswerSupport([{statement:'Write to the seller and request your refund.',sourceId:'law',quote:source.scope}],'Write to the seller and request your refund.',{},[],[source]),[]);
 assert.deepEqual(checkedAnswerSupport([{statement:'Write to the seller and request your refund.',sourceId:'law',quote:'The appearance notice concerns a separate police process.'}],'Write to the seller and request your refund.',{},[],[{...source,scope:'The appearance notice concerns a separate police process.'}]),[]);
});
test('a related literal passage is explicitly not semantic support in UI/export data',()=>{
 const statement='The refund is approved but the payment is pending.',quote='Refund approved; payment is still pending.';
 const [entry]=checkedAnswerSupport([{statement,sourceId:'doc',quote}],statement,{messages:[],attachments:[{id:'doc',kind:'text',name:'receipt',text:quote}]},[],[]);
 assert.equal(entry.kind,'document');assert.equal(entry.supportStatus,'related_not_verified');assert.match(entry.verification,/support not verified/);
 const brief=lawyerBrief({facts:{},topic:'refund',analysis:{answerSupport:[entry]}});assert.match(brief,/RELATED PASSAGE: SUPPORT NOT VERIFIED/);assert.doesNotMatch(brief,/SUPPORT FOR A RESPONSE SENTENCE/);
});
test('optional saved facts are bounded and unsafe/malformed values do not restore executable or draft state',()=>{
 const restored=savedCase(JSON.stringify({facts:{story:'Synthetic',amount:830},topic:'untrusted',events:[{bad:true}],checked:['record',123],draft:'stale',analysis:review}),['auto','refund']);
 assert.equal(restored.facts.amount,'');assert.equal(restored.topic,'auto');assert.deepEqual(restored.checked,['record']);assert.deepEqual(restored.events,[]);assert.equal(restored.draft,undefined);assert.equal(restored.analysis,undefined);
 assert.throws(()=>savedCase('not json',[]));
});
test('public build identity contains exactly non-sensitive allowlisted fields',()=>assert.deepEqual(Object.keys(buildIdentity()).sort(),['id','prompt','sourcePack']));

test('record revisions change on edits and remain distinct even when the original text is restored',()=>{
 const first=versionRecords([],context.attachments),edited=versionRecords(first,[{...first[0],text:'Redacted'}]),restored=versionRecords(edited,[{...edited[0],text:first[0].text}]);
 assert.notEqual(first[0].revision,edited[0].revision);assert.notEqual(first[0].revision,restored[0].revision);assert.equal(versionRecords(first,first)[0].revision,first[0].revision);
});

test('removed or revised record quotations are not silently resent as assistant history',()=>{
 const docs=versionRecords([],context.attachments);const m={role:'assistant',content:'Old record quote INR 830.',reviewContext:{records:docs.map(({id,revision,name,kind,warnings})=>({id,revision,name,kind,warnings}))}};
 assert.equal(messagesForReview([m],[]).length,0);const revised=versionRecords(docs,[{...docs[0],text:'Changed record'}]);assert.equal(messagesForReview([m],revised).length,0);
 assert.equal(messagesForReview([m],docs).length,1);assert.equal(messagesForReview([{role:'user',content:'My own account.'}],[]).length,1);
});

test('clearing a case aborts the old request and prevents a late response from repopulating it',()=>{
 const session=createReviewSession(),old=session.begin();assert.equal(old.current(),true);session.cancel();assert.equal(old.signal.aborted,true);assert.equal(old.current(),false);const next=session.begin();assert.equal(next.current(),true);assert.equal(old.current(),false);
});
