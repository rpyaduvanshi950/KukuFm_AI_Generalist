import {readFileSync,writeFileSync,existsSync,readdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {respond} from '../../lib/assistant.mjs';
import {locateQuote} from '../../lib/provenance.mjs';
import {MODEL,reserveCost,usageCost} from '../openai/budget.mjs';
process.chdir(fileURLToPath(new URL('../..',import.meta.url)));
const dir='benchmarks/submission',file=dir+'/results.json',live=process.argv.includes('--run');
const hash=text=>createHash('sha256').update(text).digest('hex');
const raw=readFileSync(dir+'/cases.json','utf8'),cases=JSON.parse(raw);
const result={date:'2026-11-07',kind:'Post-exposure and new authored regression, not holdout or legal expert validation',inputHash:hash(raw),sourceHash:hash(readdirSync('lib').filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync('lib/'+f,'utf8')).join('\n')),maxRequests:10,maxUsd:0.10,attempts:0,accountedUsd:0,records:[]};
if(!live){console.log(JSON.stringify({...result,planned:cases.length,dryRun:true}));process.exit(0)}
if(existsSync(file))throw Error('Results already exist. Preserve them; use a new version for another run.');
const key=process.env.OPENAI_API_KEY||(existsSync('.env.openai.local')?readFileSync('.env.openai.local','utf8').split(/\r?\n/).find(l=>l.startsWith('OPENAI_API_KEY='))?.slice(15).trim():'');
if(!key)throw Error('Set OPENAI_API_KEY privately; do not put it in source or arguments.');
const lock=openSync(dir+'/run.lock','wx');
const save=()=>writeFileSync(file,JSON.stringify(result,null,2)+'\n');
try{
 save();
 for(const c of cases){
  let rawOutput=null,usage=null,validationError=null,stop=false,promptHash=null,reservedUsd=0;
  const fetcher=async(url,options)=>{
   const body=JSON.parse(options.body);
   if(url!=='https://api.openai.com/v1/chat/completions'||body.model!==MODEL||body.max_completion_tokens!==1200||body.store!==false)throw Error('Unexpected request');
   reservedUsd=reserveCost(body);
   if(result.attempts>=result.maxRequests||result.accountedUsd+reservedUsd>result.maxUsd){stop=true;result.stopped='Local cap reached';throw Error('budget')}
   result.attempts++;result.accountedUsd+=reservedUsd;promptHash=hash(JSON.stringify(body));save();
   let response;
   try{response=await fetch(url,{...options,redirect:'error'})}catch{stop=true;result.stopped='Connection failed; reservation retained, no retry';throw Error('connection')}
   const data=await response.clone().json();usage=data.usage||null;rawOutput=data.choices?.[0]?.message?.content||null;
   const actual=usageCost(usage);if(actual!==null)result.accountedUsd+=actual-reservedUsd;
   if(!response.ok){stop=true;result.stopped='Provider HTTP '+response.status+'; no retry'}save();return response;
  };
  const start=performance.now();
  const output=await respond(c.input,{base:'https://api.openai.com/v1',model:MODEL,key,onDebug:d=>{if(d.validationError)validationError=d.validationError}},fetcher);
  const e=c.expected,checks=[{name:'AI coverage',pass:output.mode==='ai'},{name:'topic',pass:output.topic===e.topic}];
  const prose=[output.reply,output.question,output.documentAnswer?.answer].filter(Boolean).join(' ');
  if(e.verdict)checks.push({name:'document verdict',pass:output.documentAnswer?.verdict===e.verdict});
  if(e.replyAny)checks.push({name:'required-content proxy',pass:e.replyAny.some(t=>prose.toLowerCase().includes(t.toLowerCase()))});
  if(e.replyNone)checks.push({name:'forbidden-content proxy',pass:e.replyNone.every(t=>!prose.toLowerCase().includes(t.toLowerCase()))});
  if(e.forbiddenFacts)checks.push({name:'unknown facts preserved',pass:!(output.facts||[]).some(f=>e.forbiddenFacts.includes(f.field))});
  const evidence=output.documentAnswer?.evidence||[];
  if(['supported','contradicted','unclear'].includes(e.verdict))checks.push({name:'literal evidence',pass:evidence.length>0&&evidence.every(item=>{const doc=c.input.attachments?.find(a=>a.id===item.attachmentId);return doc&&locateQuote(doc.text,item.quote).length>0})});
  result.records.push({id:c.id,origin:c.origin,checks,pass:checks.every(x=>x.pass),output,rawOutput,usage,validationError,promptHash,latencyMs:Math.round(performance.now()-start)});save();
  console.log(JSON.stringify({id:c.id,pass:result.records.at(-1).pass,mode:output.mode}));
  if(stop)break;
 }
 result.finishedAt=new Date().toISOString();result.passed=result.records.filter(r=>r.pass).length;save();
 console.log(JSON.stringify({completed:result.records.length,passed:result.passed,attempts:result.attempts,accountedUsd:result.accountedUsd,stopped:result.stopped||null}));
}finally{closeSync(lock);unlinkSync(dir+'/run.lock')}
