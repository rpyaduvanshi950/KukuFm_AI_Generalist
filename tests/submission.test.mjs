import test from 'node:test';
import assert from 'node:assert/strict';
import {respond,validateModelOutput} from '../lib/assistant.mjs';
const input={topic:'property',language:'en',messages:[{role:'user',content:'Do both records unambiguously establish the same amount?'}],attachments:[{id:'doc',name:'records.txt',kind:'text',text:'Record A: paid 830. Record B: paid 380. Same transaction, no correction.'}],documentConsent:true};
const evidence=[{attachmentId:'doc',quote:'Record A: paid 830.'},{attachmentId:'doc',quote:'Record B: paid 380.'}];
const base={reply:'The records disagree.',question:'',sourceIds:[],facts:[],documentFindings:[],documentAnswer:{verdict:'unclear',answer:'The same transaction has inconsistent records.',evidence},documentIssues:[{kind:'conflict',summary:'Two different amounts for the same transaction.',evidence}]};
test('a reported conflict cannot simultaneously establish a decisive amount using those passages',()=>{
 assert.throws(()=>validateModelOutput({...base,documentAnswer:{...base.documentAnswer,verdict:'supported'}},input,[]),/inconsistent_document_answer/);
});
test('a cautious conflict answer preserves both checked quotations',()=>{
 const output=validateModelOutput(base,input,[]);assert.equal(output.documentAnswer.verdict,'unclear');assert.equal(output.documentAnswer.evidence.length,2);assert.equal(output.documentIssues.length,1);
});
test('unknown refund amount stays unfilled in no-key guidance',async()=>{
 const output=await respond({topic:'refund',language:'en',messages:[{role:'user',content:'My refund is missing. I do not know the amount. Do not guess it.'}]},{});
 assert.match(output.reply,/unknown amount blank/);assert.equal(output.mode,'guided');assert.ok(!(output.facts||[]).some(f=>f.field==='amount'));
});
test('unknown refund amount stays unfilled in Hindi fallback',async()=>{
 const output=await respond({topic:'refund',language:'hi',messages:[{role:'user',content:'मेरा रिफंड नहीं मिला। राशि याद नहीं है।'}]},{});
 assert.match(output.reply,/खाली/);assert.ok(!(output.facts||[]).some(f=>f.field==='amount'));
});
test('a negated outcome guarantee is allowed, an affirmative or mixed promise is rejected',()=>{
 const output={reply:'This is not a guaranteed refund.',question:'',sourceIds:[],facts:[]};
 assert.equal(validateModelOutput(output,input,[]).reply,output.reply);
 assert.throws(()=>validateModelOutput({...output,reply:'This is a guaranteed refund.'},input,[]),/unsupported_claim/);
 assert.throws(()=>validateModelOutput({...output,reply:'No guaranteed refund, but you get guaranteed bail.'},input,[]),/unsupported_claim/);
 assert.throws(()=>validateModelOutput({...output,reply:'Not only a guaranteed refund, but damages too.'},input,[]),/unsupported_claim/);
});
test('unknown amount reminder is maintained with an otherwise valid AI response',async()=>{
 const payload={reply:'Keep the seller messages.',question:'',sourceIds:[],facts:[]};
 const fetcher=async()=>Response.json({choices:[{message:{content:JSON.stringify(payload)}}]});
 for(const [language,text,expected] of [['en','The amount is unknown.',/unknown amount blank/],['hi','राशि याद नहीं है।',/खाली/]]){
  const output=await respond({topic:'refund',language,messages:[{role:'user',content:text}]},{base:'https://example.com/v1',model:'test'},fetcher);
  assert.equal(output.mode,'ai');assert.match(output.reply,expected);
 }
});
