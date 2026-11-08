import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
if(!process.env.TEST_DATABASE_URL)throw Error('Use the isolated PostgreSQL test wrapper.');
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
const base='http://127.0.0.1:'+port;
const child=spawn(process.execPath,['scripts/start-render.mjs'],{stdio:['ignore','pipe','pipe'],env:{...process.env,NODE_OPTIONS:'--import='+fileURLToPath(new URL('./audit-provider-fixture.mjs',import.meta.url)),NEXT_TELEMETRY_DISABLED:'1',DATABASE_URL:process.env.TEST_DATABASE_URL,PORT:String(port),APP_ORIGIN:base,AI_API_KEY:'synthetic-fixture-not-a-real-key',AI_BASE_URL:'https://api.openai.com/v1',AI_MODEL:'gpt-5.4-mini-2026-03-17'}});
let logs='';for(const stream of [child.stdout,child.stderr])stream.on('data',d=>{logs=(logs+d).slice(-12000)});
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(ready,'server must start');
 const status=await(await fetch(base+'/api/status')).json();assert.equal(status.configured,true);assert.deepEqual(Object.keys(status.build).sort(),['id','prompt','sourcePack']);assert.match(status.build.id,/source-/);
 const send=async name=>{
  const text=readFileSync('tests/fixtures/audit/'+name+'.txt','utf8');
  const input={topic:'property',language:'en',messages:[{role:'user',content:'Do these records establish one payment amount?'}],attachments:[{id:'doc',name:name+'.txt',kind:'text',text}],documentConsent:true};
  const response=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',origin:base},body:JSON.stringify(input)});assert.equal(response.status,200);return response.json();
 };
 const conflict=await send('conflict');assert.equal(conflict.mode,'ai');assert.match(conflict.reply,/MOCKED PROVIDER/);assert.equal(conflict.documentAnswer.verdict,'unclear');assert.equal(conflict.facts.length,2);assert.ok(conflict.facts.every(f=>f.adoption==='resolution_required'&&f.status==='unresolved'));
 const correction=await send('correction');assert.equal(correction.documentAnswer.verdict,'supported');assert.equal(correction.facts.length,1);assert.equal(correction.facts[0].status,'supported_correction');assert.equal(correction.facts[0].adoption,'resolution_required');
 console.log('Audit production HTTP checks passed: public build identity, mocked conflict alternatives, and explicit correction requiring confirmation. No external provider request or real key used.');
}finally{child.kill('SIGTERM');await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,3000))]);if(child.exitCode===null)child.kill('SIGKILL')}
