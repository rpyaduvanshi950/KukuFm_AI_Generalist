import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {createDatabase} from '../lib/postgres.mjs';
if(!process.env.TEST_DATABASE_URL)throw Error('Use npm run test:http to create an isolated database.');
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
const password='synthetic-local-test-password',headers={authorization:'Basic '+Buffer.from('reviewer:'+password).toString('base64')};
const env={...process.env,PORT:String(port),ACCESS_MODE:'protected',APP_PASSWORD:password,DATABASE_URL:process.env.TEST_DATABASE_URL,AI_API_KEY:'',AI_BASE_URL:'https://api.openai.com/v1',AI_MODEL:'gpt-5.4-mini-2026-03-17',RENDER_EXTERNAL_URL:'https://render-test.example',NEXT_TELEMETRY_DISABLED:'1'};
const child=spawn(process.execPath,['scripts/start-render.mjs'],{env,stdio:['ignore','pipe','pipe']});let logs='';
for(const stream of [child.stdout,child.stderr])stream.on('data',d=>{logs=(logs+d).slice(-20000)});
const base='http://127.0.0.1:'+port;
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break}}catch{}if(child.exitCode!==null)throw Error('Production server exited: '+logs);await new Promise(r=>setTimeout(r,100))}
 assert.equal(ready,true,'production server must become healthy');
 assert.equal((await fetch(base+'/api/health',{headers:{host:'render-test.example'}})).status,200);
 assert.equal((await fetch(base+'/',{headers:{host:'render-test.example'}})).status,200);
 const landing=await fetch(base+'/');assert.equal(landing.status,200);const landingHtml=await landing.text();assert.match(landingHtml,/href="\/reviewer-login"/);assert.doesNotMatch(landingHtml,/Your workspace|AI_API_KEY/);
 assert.equal((await fetch(base+'/',{method:'HEAD'})).status,200);
 assert.equal((await fetch(base+'/reviewer-login')).status,401);
 const login=await fetch(base+'/reviewer-login',{headers,redirect:'manual'});assert.equal(login.status,303);assert.equal(login.headers.get('location'),'/');
 assert.equal((await fetch(base+'/benchmarks')).status,401);
 assert.equal((await fetch(base+'/api/status')).status,401);
 assert.equal((await fetch(base+'/api/status',{headers:{'oai-authenticated-user-id':'owner','cf-connecting-ip':'127.0.0.1'}})).status,401);
 const page=await fetch(base+'/',{headers});assert.equal(page.status,200);assert.match(page.headers.get('cache-control'),/private/);assert.match(await page.text(),/nyaya/i);
 const benchmark=await fetch(base+'/benchmarks',{headers});assert.equal(benchmark.status,200);assert.match(await benchmark.text(),/Test cases and recorded results/);
 assert.equal((await fetch(base+'/pdf.worker.min.mjs')).status,200);
 const status=await (await fetch(base+'/api/status',{headers})).json();assert.equal(status.configured,false);assert.equal(status.service,'guided');
 const input={topic:'refund',language:'en',messages:[{role:'user',content:'Synthetic test: my online order refund is delayed.'}]};
 const post=(origin,body)=>fetch(base+'/api/chat',{method:'POST',headers:{...headers,'Content-Type':'application/json',origin},body:JSON.stringify(body)});
 assert.equal((await post('https://attacker.example',input)).status,403);
 assert.equal((await post(env.RENDER_EXTERNAL_URL,{})).status,400);
 const response=await post(env.RENDER_EXTERNAL_URL,input);assert.equal(response.status,200);const output=await response.json();assert.equal(output.mode,'guided');assert.equal(output.topic,'refund');
 const db=createDatabase(process.env.TEST_DATABASE_URL);
 try{assert.equal((await db.query('SELECT count(*)::integer AS n FROM ai_reservations')).rows[0].n,0);assert.equal((await db.query('SELECT count(*)::integer AS n FROM nyaya_schema_migrations')).rows[0].n,1)}finally{await db.end()}
 for(let i=0;i<40&&!logs.includes('\"path\":\"/\",\"status\":200');i++)await new Promise(r=>setTimeout(r,100));
 assert.match(logs,/\"event\":\"startup_probe\",\"path\":\"\/api\/health\",\"status\":200/);
 assert.match(logs,/\"event\":\"startup_probe\",\"path\":\"\/\",\"status\":200/);
 console.log('Production HTTP checks passed: protected pages/API, public health, assets, guided chat, Render HTTPS origin, persisted schema, and zero paid reservations without a key.');
}finally{
 if(child.exitCode===null){child.kill('SIGTERM');await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,5000))]);if(child.exitCode===null)child.kill('SIGKILL')}
}
