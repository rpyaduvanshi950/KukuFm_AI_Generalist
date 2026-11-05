import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {locateQuote} from '../lib/provenance.mjs';
import {validEvent,lawyerBrief} from '../lib/case-brief.mjs';
import {reserve,settle,requestReservation} from '../lib/spending.mjs';
import {assess,validateInput} from '../lib/legal.mjs';
import {cardsFor} from '../lib/knowledge.mjs';
import {validateModelOutput} from '../lib/assistant.mjs';
import {documentReadingPrompt} from '../lib/document-prompt.mjs';
const input={topic:'auto',language:'en',messages:[{role:'user',content:'I have a question.'}]};
test('focused reading keeps enforceability and urgent questions in the legal workflow',()=>{
 const doc={id:'doc',name:'example.txt',kind:'text',text:'The window is closed.'};
 const v={...input,attachments:[doc],messages:[{role:'user',content:'Is the window open?'}]};
 assert.ok(documentReadingPrompt(v,{danger:false,urgent:false}));
 assert.equal(documentReadingPrompt({...v,messages:[{role:'user',content:'Is this legally enforceable?'}]},{danger:false,urgent:false}),null);
 assert.equal(documentReadingPrompt(v,{danger:true,urgent:true}),null);
});
test('evidence location comes from source text, including whitespace and duplicate occurrences',()=>{
 const text='[Page 1]\nOther text.\n[Page 2]\nPaid   INR 700.\nPaid INR 700.';
 const locations=locateQuote(text,'Paid INR 700.');
 assert.equal(locations.length,2);assert.equal(locations[0].page,2);
 assert.equal(text.slice(locations[0].start,locations[0].end),'Paid   INR 700.');
 assert.deepEqual(locateQuote(text,'Paid INR 900.'),[]);
});
test('safety and foreign-law patterns work without misclassifying historical safety',()=>{
 assert.equal(assess({...input,messages:[{role:'user',content:'My partner is threatening me with a knife right now.'}]}).danger,true);
 assert.equal(assess({...input,messages:[{role:'user',content:'My partner hit me years ago. I am safe now.'}]}).danger,false);
 assert.equal(assess({...input,messages:[{role:'user',content:'I live in India but my case is under California rental law.'}]}).foreign,true);
 assert.equal(assess({...input,messages:[{role:'user',content:'Is NCH a consumer court?'}]}).topic,'refund');
});
test('Maharashtra guidance stays out of other-state and unspecified rental packs',()=>{
 assert.ok(cardsFor('rental','My property is in Maharashtra.').some(c=>c.id==='mh-registration'));
 assert.ok(!cardsFor('rental','My home is in Kerala. Does a Maharashtra rule apply?').some(c=>c.id==='mh-registration'));
 assert.ok(!cardsFor('rental','Where is my deposit?').some(c=>c.id==='mh-registration'));
});
test('conflict flags need two real passages and invented page numbers are ignored',()=>{
 const context={...input,topic:'property',attachments:[{id:'doc',name:'test.txt',kind:'text',text:'[Page 2]\nRenewal is automatic. Renewal requires consent.'}]};
 const base={reply:'The wording needs review.',question:'',sourceIds:[],facts:[],documentFindings:[],documentAnswer:null};
 const issue={kind:'conflict',summary:'These terms may conflict.',evidence:[{attachmentId:'doc',quote:'Renewal is automatic.',page:999},{attachmentId:'doc',quote:'Renewal requires consent.'}]};
 const result=validateModelOutput({...base,documentIssues:[issue]},context,[]);
 assert.equal(result.documentIssues.length,1);assert.equal(result.documentIssues[0].evidence[0].locators[0].page,2);
 assert.equal(validateModelOutput({...base,documentIssues:[{...issue,evidence:[issue.evidence[0],{attachmentId:'doc',quote:'Invented provision'}]}]},context,[]).documentIssues.length,0);
});
test('timeline validates real dates and exports user-entered events with reading limits',()=>{
 assert.equal(validEvent({date:'2026-02-30',description:'Paid',source:'Receipt'}),false);
 const event={date:'2026-02-28',description:'Paid',source:'Receipt'};assert.equal(validEvent(event),true);
 const brief=lawyerBrief({facts:{story:'User account'},topic:'Refund',events:[event],attachments:[{name:'scan.pdf',coverage:'Only page 2 supplied.',warnings:['Vision unverified']}]});
 assert.match(brief,/2026-02-28 \| Paid/);assert.match(brief,/Only page 2 supplied/);assert.match(brief,/unverified/);
});
test('image page and coverage metadata are bounded',()=>{
 const v={...input,documentConsent:true,attachments:[{id:'x',name:'scan.pdf',kind:'image',image:'data:image/jpeg;base64,AAAA',page:2,pages:4,coverage:'Only page 2 supplied.'}]};
 assert.equal(validateInput(v),true);assert.equal(validateInput({...v,attachments:[{...v.attachments[0],page:99}]}),false);
});
test('persistent budget uses atomic SQLite reservations under concurrent requests',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'nyaya-budget-')),file=join(dir,'usage.db');
 const query=(sql,params=[])=>new Promise((resolve,reject)=>{
  const code='import sqlite3,json,sys\np=json.load(sys.stdin)\nc=sqlite3.connect(p["file"],timeout=20)\nc.row_factory=sqlite3.Row\nr=c.execute(p["sql"],p["params"])\nrows=[dict(x) for x in r.fetchall()] if r.description else []\nc.commit()\nprint(json.dumps(rows))';
  const p=spawn('python3',['-c',code]);let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('close',status=>status?reject(Error(err)):resolve(JSON.parse(out)));p.stdin.end(JSON.stringify({file,sql,params}));
 });
 const db={prepare(sql){return {bind(...params){return {async first(){return (await query(sql,params))[0]||null},async run(){await query(sql,params)}}}}}};
 try{
  await query('CREATE TABLE ai_budget(day TEXT PRIMARY KEY,reserved_micros INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,failures INTEGER NOT NULL DEFAULT 0)');
  const tickets=await Promise.all(Array.from({length:16},()=>reserve(db,50000,'2026-11-06')));
  assert.equal(tickets.filter(Boolean).length,10);
  assert.equal((await query('SELECT * FROM ai_budget'))[0].reserved_micros,500000);
  await settle(db,tickets.find(Boolean),{prompt_tokens:100,completion_tokens:100},true);
  assert.ok(await reserve(db,40000,'2026-11-06'));
  const row=(await query('SELECT * FROM ai_budget'))[0];assert.equal(row.failures,1);assert.ok(row.reserved_micros<=500000);
  await settle(db,tickets.find(Boolean),null,true);
  assert.equal((await query('SELECT * FROM ai_budget'))[0].reserved_micros,row.reserved_micros);
  await query('UPDATE ai_budget SET attempts=100,reserved_micros=0');
  assert.equal(await reserve(db,100,'2026-11-06'),null);
  assert.equal(await reserve(null,10),null);
  assert.throws(()=>requestReservation({model:'unknown',max_completion_tokens:1200}),/unpriced_model/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
