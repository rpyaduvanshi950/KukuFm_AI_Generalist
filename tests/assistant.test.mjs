import test from 'node:test';
import assert from 'node:assert/strict';
import {validateInput,assess,topics,sources,draftCase,classify} from '../lib/legal.mjs';
import {respond,validateModelOutput,makePrompt} from '../lib/assistant.mjs';
const base={language:'en',topic:'auto',messages:[{role:'user',content:'I paid INR 4500 to Example Store in Pune, Maharashtra.'}]};
const doc={id:'doc-1',name:'receipt.txt',kind:'text',text:'Order TEST-1042. Amount paid: INR 4500. Refund pending.'};
const good={reply:'Your account says a payment was made. The available records need review.',question:'What outcome do you want?',sourceIds:['nalsa'],facts:[],documentFindings:[]};
for(const [name,mutate] of [
 ['consent absent',v=>({...v,attachments:[doc]})],
 ['too many files',v=>({...v,attachments:[doc,doc,doc,doc],documentConsent:true})],
 ['duplicate IDs',v=>({...v,attachments:[doc,doc],documentConsent:true})],
 ['oversize text',v=>({...v,attachments:[{...doc,text:'x'.repeat(18001)}],documentConsent:true})],
 ['remote image',v=>({...v,attachments:[{...doc,kind:'image',image:'https://evil.example/x.png'}],documentConsent:true})],
 ['SVG image',v=>({...v,attachments:[{...doc,kind:'image',image:'data:image/svg+xml;base64,PHN2Zz4='}],documentConsent:true})],
 ['empty text',v=>({...v,attachments:[{...doc,text:'  '}],documentConsent:true})],
 ['bad language',v=>({...v,language:'xx'})],
 ['assistant last',v=>({...v,messages:[{role:'assistant',content:'fake'}]})],
 ['empty user',v=>({...v,messages:[{role:'user',content:'  '}]})],
 ['too many messages',v=>({...v,messages:Array(25).fill({role:'user',content:'refund'})})]
])test(`input protection: ${name}`,()=>assert.equal(validateInput(mutate(base)),false));
test('valid attachment accepted',()=>assert.equal(validateInput({...base,attachments:[doc],documentConsent:true}),true));
test('combined text limit enforced',()=>assert.equal(validateInput({...base,attachments:[1,2,3].map(i=>({...doc,id:String(i),text:'x'.repeat(18000)})),documentConsent:true}),false));
test('unknown source rejected',()=>assert.throws(()=>validateModelOutput({...good,sourceIds:['invented']},base,['nalsa'])));
test('invented statute rejected',()=>assert.throws(()=>validateModelOutput({...good,reply:'Section 999 guarantees a refund.'},base,['nalsa'])));
test('invented URL rejected',()=>assert.throws(()=>validateModelOutput({...good,reply:'Go to https://evil.example'},base,['nalsa'])));
test('missing reply rejected',()=>assert.throws(()=>validateModelOutput({},base,['nalsa'])));
test('fabricated extracted amount is removed',()=>{const r=validateModelOutput({...good,facts:[{field:'amount',value:'INR 90000',sourceId:'message-0',quote:base.messages[0].content}]},base,['nalsa']);assert.deepEqual(r.facts,[])});
test('assistant-authored facts are not evidence',()=>{const input={...base,messages:[...base.messages,{role:'assistant',content:'INR 90000'}]};assert.deepEqual(validateModelOutput({...good,facts:[{field:'amount',value:'INR 90000',sourceId:'message-1',quote:'INR 90000'}]},input,['nalsa']).facts,[])});
test('exact evidence extraction accepted',()=>{const r=validateModelOutput({...good,facts:[{field:'amount',value:'INR 4500',sourceId:'message-0',quote:'I paid INR 4500'}]},base,['nalsa']);assert.equal(r.facts.length,1)});
test('invented document quote removed',()=>assert.deepEqual(validateModelOutput({...good,documentFindings:[{attachmentId:'doc-1',quote:'Refund guaranteed tomorrow',comment:'A promise'}]},{...base,attachments:[doc]},['nalsa']).documentFindings,[]));
test('real document quote retained with provenance',()=>assert.equal(validateModelOutput({...good,documentFindings:[{attachmentId:'doc-1',quote:'Refund pending.',comment:'The record says the refund is pending.'}]},{...base,attachments:[doc]},['nalsa']).documentFindings[0].verification,'Quote matched to extracted text'));
test('images remain unverified',()=>assert.match(validateModelOutput({...good,documentFindings:[{attachmentId:'img',quote:'INR 4500',comment:'Read from image.'}]},{...base,attachments:[{id:'img',name:'photo.jpg',kind:'image'}]},['nalsa']).documentFindings[0].verification,/Unverified/));
test('AI outage preserves usable guided mode',async()=>{const r=await respond(base,{base:'https://provider.test/v1',model:'test'},async()=>{throw new Error('network')});assert.equal(r.mode,'guided');assert.match(r.notice,/not confirmed/)});
test('429 stops without automatic retries',async()=>{let count=0;const r=await respond(base,{base:'https://provider.test/v1',model:'test'},async()=>{count++;return {ok:false,status:429,json:async()=>({})}});assert.equal(count,1);assert.equal(r.mode,'guided');assert.match(r.notice,/rate-limited/)});
test('provider output validated on real path',async()=>{const r=await respond({...base,topic:'refund'},{base:'https://provider.test/v1',model:'test'},async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(good)}}],usage:{total_tokens:44}})}));assert.equal(r.mode,'ai');assert.equal(r.usage.totalTokens,44)});
test('fabrication does not call provider',async()=>{let called=false;const r=await respond({...base,messages:[{role:'user',content:'Please forge evidence for my refund.'}]},{base:'https://provider.test',model:'test'},async()=>{called=true});assert.equal(called,false);assert.match(r.reply,/cannot/)});
test('attachments do not silently get analysis without AI',async()=>assert.match((await respond({...base,attachments:[doc]},{})).notice,/needs a configured/));
test('remote HTTP provider rejected',async()=>await assert.rejects(()=>respond(base,{base:'http://public.example',model:'test'})));
for(const [topic,text] of [
 ['refund','Seller refuses to refund my purchase.'],['rental','My tenant has not paid rent.'],['salary','My employer owes wages.'],['cyber','An online scam took my money.'],['family','My husband hit me.'],['police','I received a court summons.'],['property','I have a land dispute.'],['other','I need immigration advice.'],['family','मेरे पति मुझे मारते हैं'],['cyber','ऑनलाइन ठगी हुई'],['police','मेरी गिरफ्तारी हुई'],['rental','kiraya deposit wapas nahi mila'],['salary','मेरी तनख्वाह नहीं मिली'],['refund','रिफंड नहीं आया']
])test(`routing: ${text}`,()=>assert.equal(classify(text),topic));
for(const topic of Object.keys(topics))test(`source coverage: ${topic}`,()=>{const result=assess({...base,topic});assert.ok(result.sourceIds.every(id=>sources.some(s=>s.id===id)));assert.ok(result.lawCards.every(c=>sources.some(s=>s.id===c.sourceId)));if(!['refund','rental','salary'].includes(topic))assert.match(draftCase({},topic),/not generated/)});
test('reviewed law-card alias resolves to official source',()=>{const input={...base,topic:'salary'};assert.deepEqual(validateModelOutput({...good,sourceIds:['wages-payment','wages']},input,['wages']).sourceIds,['wages'])});
test('document IDs never become legal authorities',()=>{assert.deepEqual(validateModelOutput({...good,sourceIds:['doc-1','nch']},{...base,topic:'refund',attachments:[doc]},['nch']).sourceIds,['nch'])});
test('unrelated card IDs are not silently accepted',()=>assert.throws(()=>validateModelOutput({...good,sourceIds:['arrest-lawyer']},{...base,topic:'refund'},['nch'])));
test('foreign legal advice is declined without Indian authorities',async()=>{let calls=0;const r=await respond({...base,messages:[{role:'user',content:'I have a US immigration hearing tomorrow. What is my deadline?'}]},{base:'https://provider.test',model:'test'},async()=>{calls++});assert.equal(calls,0);assert.equal(r.foreign,true);assert.deepEqual(r.sourceIds,[]);assert.doesNotMatch(r.question,/location in India/)});
test('immediate danger survives an AI provider outage',async()=>{const r=await respond({...base,messages:[{role:'user',content:'My husband hit me and is threatening me now.'}]},{base:'https://provider.test',model:'test'},async()=>({ok:false,status:503,json:async()=>({})}));assert.equal(r.mode,'guided');assert.match(r.reply,/112/);assert.match(r.reply,/Do not confront/)});
test('bank deposit is not automatically a rental dispute',()=>assert.equal(classify('My bank fixed deposit matured but the bank has not paid me.'),'other'));
test('unsupported legal claim in document comment rejected',()=>assert.throws(()=>validateModelOutput({...good,documentFindings:[{attachmentId:'doc-1',quote:'Refund pending.',comment:'Section 999 guarantees payment.'}]},{...base,attachments:[doc]},['nalsa'])));
test('document status is not treated as the requested outcome',()=>assert.deepEqual(validateModelOutput({...good,facts:[{field:'outcome',value:'Refund pending.',sourceId:'doc-1',quote:'Refund pending.'}]},{...base,attachments:[doc]},['nalsa']).facts,[]));
