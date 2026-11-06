import test from 'node:test';
import assert from 'node:assert/strict';
import {assess,classify,draftCase} from '../lib/legal.mjs';
import {cyberIncidentKind} from '../lib/triage.mjs';
import {cardsFor,retrieveKnowledge} from '../lib/knowledge.mjs';
import {validateModelOutput} from '../lib/assistant.mjs';
import {workflowBrief,workflowChecklist,documentTasks} from '../lib/workflows.mjs';
const input=text=>({topic:'auto',language:'en',messages:[{role:'user',content:text}]});
for(const [text,kind] of [
 ['Someone hacked my Instagram account. No money was lost.','nonfinancial'],
 ['A fake profile is impersonating me.','nonfinancial'],
 ['My account was hacked and INR 5000 was transferred through UPI.','financial'],
 ['I lost money to a scam.','financial'],
 ['I received a phishing link, but made no payment.','nonfinancial'],
 ['I think this is a scam.','unknown'],
])test(`cyber routing: ${text}`,()=>assert.equal(cyberIncidentKind(text),kind));
test('nonfinancial incident guidance is not bank-only and financial incident remains urgent',()=>{
 const account=assess(input('Someone hacked my Instagram account. No money was lost.'));
 assert.equal(account.topic,'cyber');assert.equal(account.financialCyber,false);assert.match(account.reply,/platform.*official/i);
 const money=assess(input('I lost money in a UPI scam.'));assert.equal(money.financialCyber,true);assert.match(money.reply,/1930/);
});
test('economic and emotional concerns route to family without asserting immediate physical danger',()=>{
 for(const text of ['My husband controls my money. I am safe now.','I need help with emotional abuse by my partner. I am safe now.']){
  const result=assess(input(text));assert.equal(result.topic,'family');assert.equal(result.danger,false);
 }
 assert.equal(assess(input('My partner is threatening me with a knife right now.')).danger,true);
});
test('private notices remain distinct from police safeguards',()=>{
 const text='I received a private legal notice from a lawyer with a demand letter.';
 assert.equal(classify(text),'police');assert.equal(cardsFor('police',text).length,0);
 assert.deepEqual(retrieveKnowledge('police',text+' Does that mean I have a police summons?'),[]);
 assert.match(assess(input(text+' Does that mean I have a police summons?')).reply,/private.*police appearance/i);
 const police=cardsFor('police','Police appearance notice under BNSS');assert.ok(police.some(c=>c.id==='police-appearance'));
 assert.ok(!cardsFor('refund','My refund is delayed').some(c=>c.id==='police-appearance'));
});
test('preparation exports preserve unknowns, exact user dates and local-only boundaries',()=>{
 const brief=workflowBrief('police',{kind:'Private legal notice',statedDate:'Within seven days as stated; receipt date uncertain'});
 assert.match(brief,/NOT SENT OR FILED/);assert.match(brief,/receipt date uncertain/);assert.match(brief,/Issuer exactly as stated: \[Not supplied\]/);assert.match(brief,/not calculated legal deadlines/);
 assert.match(workflowBrief('family',{concern:'Economic control'}),/DEVICE SAFETY/);
 assert.match(workflowChecklist('cyber',{kind:'Account takeover'})[0],/platform/);
 assert.match(workflowChecklist('cyber',{kind:'Financial fraud'})[0],/1930/);
 assert.equal(workflowBrief('unsupported',{}),'');
});
test('document tasks and drafts preserve the boundary between reading and legal action',()=>{
 assert.equal(documentTasks.length,4);assert.match(documentTasks[2][1],/Do not calculate a legal deadline/);
 for(const topic of ['cyber','family','police'])assert.match(draftCase({story:'My account'},topic),/Formal replies are not generated/);
});

test('subsection and FAQ numbers do not authorise unrelated statutory sections',()=>{
 const output={reply:'Section 3 applies.',question:'',sourceIds:[],facts:[],documentFindings:[]};
 assert.throws(()=>validateModelOutput(output,{...input('I received a police appearance notice.'),topic:'police'},['bnss','nalsa']),/unsupported_section/);
 assert.throws(()=>validateModelOutput({...output,reply:'Section 46 applies.'},{...input('Domestic safety information'),topic:'family'},['dv-act','nalsa']),/unsupported_section/);
});
