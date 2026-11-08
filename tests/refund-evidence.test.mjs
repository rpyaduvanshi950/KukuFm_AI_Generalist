import test from 'node:test';
import assert from 'node:assert/strict';
import {missingRefundFacts,refundRequest,refundPreparationSummary,refundAnalysisQuestion,refundSuggestions} from '../lib/refund-journey.mjs';
import {checkedAnswerSupport} from '../lib/answer-support.mjs';
import {validateModelOutput} from '../lib/assistant.mjs';
import {assess} from '../lib/legal.mjs';
import {lawyerBrief} from '../lib/case-brief.mjs';
const facts={story:'I paid INR 1234 and the seller has not refunded it.',recipient:'Example Store',amount:'INR 1234',location:'Pune',dates:'Date unknown',outcome:'Return the payment'};
const input={topic:'refund',language:'en',messages:[{role:'user',content:'The seller promised a refund.'}],attachments:[{id:'doc',name:'receipt.txt',kind:'text',text:'[Page 2]\nRefund   approved. Payment is pending.'}]};
const cards=[{id:'route',sourceId:'nch',text:'NCH provides pre-litigation grievance assistance.',hi:'NCH मुकदमे से पहले सहायता देता है।'}];
const sources=[{id:'nch',title:'NCH',url:'https://consumerhelpline.gov.in/public/about',checked:'2026-11-07',scope:'Pre-litigation assistance only.'}];
test('refund intake asks the next blank field without replacing supplied details',()=>{
 assert.equal(missingRefundFacts({}).length,5);assert.equal(missingRefundFacts(facts).length,0);assert.equal(missingRefundFacts({...facts,amount:''})[0][0],'amount');
});
test('factual request preserves unknowns, quoted seller position and user outcome',()=>{
 const draft=refundRequest({...facts,dates:''},{order:'TEST-88',sellerReply:'Refund approved; bank transfer pending.'});
 assert.match(draft,/TEST-88/);assert.match(draft,/bank transfer pending/);assert.match(draft,/\[Dates\]/);assert.match(draft,/Return the payment/);assert.doesNotMatch(draft,/within \d+ days|Section \d|guaranteed/);
});
test('Hindi preparation and no-key exports remain factual',()=>{
 assert.match(refundRequest(facts,{purchase:'किताब'},'hi'),/किताब/);assert.match(refundPreparationSummary({},{}),/USER ACCOUNT, NOT VERIFIED/);assert.match(refundPreparationSummary({},{}),/Not supplied/);assert.match(refundAnalysisQuestion(facts,{},'en'),/Distinguish my account from the document text/);
});
test('fabrication request does not become a refund draft',()=>assert.match(refundRequest({story:'Please fabricate evidence for my refund.'}),/cannot help fabricate/));
test('sentence support uses known sources and exact reply statements',()=>{
 const reply='A refund is approved, but the payment is pending.';
 const entries=[{statement:reply,sourceId:'doc',quote:'Refund approved. Payment is pending.'}];
 const result=checkedAnswerSupport(entries,reply,input,cards,sources);assert.equal(result[0].kind,'document');assert.equal(result[0].locators[0].page,2);
 assert.deepEqual(checkedAnswerSupport([{...entries[0],quote:'Payment was completed.'}],reply,input,cards,sources),[]);
 assert.deepEqual(checkedAnswerSupport([{...entries[0],statement:'A sentence not in the answer'}],reply,input,cards,sources),[]);
});
test('legal reference metadata comes from the library, never the model',()=>{
 const reply='NCH offers pre-litigation assistance.';
 const result=checkedAnswerSupport([{statement:reply,sourceId:'route',quote:cards[0].text,url:'https://attacker.example',checked:'2099-01-01'}],reply,input,cards,sources);
 assert.equal(result[0].url,sources[0].url);assert.equal(result[0].checked,'2026-11-07');assert.match(result[0].verification,/Legal applicability and meaning need qualified review/);
 assert.equal(checkedAnswerSupport([{statement:reply,sourceId:'unknown',quote:cards[0].text}],reply,input,cards,sources).length,0);
});
test('user allegations stay labelled as user account, assistant messages cannot support facts',()=>{
 const reply='You say the seller promised a refund.';const e={statement:reply,sourceId:'message-0',quote:'The seller promised a refund.'};
 assert.equal(checkedAnswerSupport([e],reply,input,cards,sources)[0].kind,'user_account');
 assert.equal(checkedAnswerSupport([e],reply,{...input,messages:[{role:'assistant',content:e.quote}]},cards,sources).length,0);
});
test('invalid support is dropped without inventing replacement citations',()=>{
 const result=validateModelOutput({reply:'Check the payment record.',question:'',sourceIds:[],facts:[],documentFindings:[],answerSupport:[{statement:'Check the payment record.',sourceId:'not-real',quote:'Invented quotation'}]},input,[]);
 assert.deepEqual(result.answerSupport,[]);
});
test('summary preserves matched support and its review limits',()=>{
 const text=lawyerBrief({facts,topic:'Refund',analysis:{answerSupport:[{statement:'The payment is pending.',kind:'document',name:'receipt.txt',quote:'Payment is pending.',verification:'Authenticity unverified.'}]}});
 assert.match(text,/RELATED PASSAGE: SUPPORT NOT VERIFIED/);assert.match(text,/Authenticity unverified/);
});

test('a model cannot attach a link, date or fake jurisdiction to user-account evidence',()=>{
 const reply='You say the seller promised a refund.';
 const entry={statement:reply,sourceId:'message-0',quote:'The seller promised a refund.',url:'https://attacker.example',checked:'2099-01-01',jurisdiction:'Everywhere'};
 const result=checkedAnswerSupport([entry],reply,input,cards,sources)[0];assert.equal(result.url,undefined);assert.equal(result.checked,undefined);assert.equal(result.jurisdiction,undefined);
});
test('a short official-summary fragment is omitted instead of claiming sentence support',()=>{
 const reply='NCH offers pre-litigation assistance.';
 assert.deepEqual(checkedAnswerSupport([{statement:reply,sourceId:'nch',quote:sources[0].scope}],reply,input,[],sources),[]);
 assert.deepEqual(checkedAnswerSupport([{statement:reply,sourceId:'nch',quote:sources[0].scope}],reply,input,[],[]),[]);
});

test('appearance notices route correctly without assuming all notices are police process',()=>{
 assert.equal(assess({topic:'auto',language:'en',messages:[{role:'user',content:'I received a police appearance notice in India.'}]}).topic,'police');
});
test('local refund suggestions quote the account and avoid guessing totals for multiple payments',()=>{
 const story='I paid INR 2400 for headphones.';const s=refundSuggestions({story});assert.equal(s[0].value,'INR 2400');assert.ok(story.includes(s[0].quote));assert.deepEqual(refundSuggestions({story,amount:'Confirmed amount'}),[]);
 assert.deepEqual(refundSuggestions({story:'I paid INR 200 and paid INR 300.'}),[]);assert.deepEqual(refundSuggestions({story:'I paid for an item but forgot the amount.'}),[]);
});

test('post-evaluation routing hardening has separate regression examples',()=>{
 const input=text=>({topic:'auto',language:'en',messages:[{role:'user',content:text}]});
 assert.equal(assess(input('राष्ट्रीय उपभोक्ता हेल्पलाइन और उपभोक्ता अदालत में क्या अंतर है?')).topic,'refund');
 assert.equal(assess(input('Explain the Model Tenancy Act for a home in Jaipur.')).topic,'rental');
 assert.equal(assess(input('This is a general question about domestic violence, not something happening to me.')).danger,false);
 assert.equal(assess(input('I have a general question, but my partner is attacking me right now.')).danger,true);
});

test('the refund review helper does not create its own false urgency from instructions',()=>{
 const content=refundAnalysisQuestion(facts,{},'en');
 const result=assess({topic:'refund',language:'en',messages:[{role:'user',content}]});assert.equal(result.urgent,false);assert.ok(!content.includes('{"'));assert.ok(content.includes(facts.story));
});
