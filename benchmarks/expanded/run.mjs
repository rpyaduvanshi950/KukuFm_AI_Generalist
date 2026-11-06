import {readFileSync,writeFileSync,existsSync,readdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {reserveCost,usageCost,MODEL} from '../openai/budget.mjs';
process.chdir(fileURLToPath(new URL('../..',import.meta.url)));
const [engine='current',split='development']=process.argv.slice(2);
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)||'';
if(tag&&!/^[a-z0-9-]{1,30}$/.test(tag))throw Error('Invalid run tag');
if(engine!=='current'||split!=='development')throw Error('Select current development for this targeted regression.');
const hash=x=>createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(readFileSync('benchmarks/expanded/manifest.json','utf8'));
const raw=readFileSync(`benchmarks/expanded/${split}.json`,'utf8');
if(hash(raw)!==manifest[split].sha256)throw Error('Frozen cases changed');
const cases=JSON.parse(raw);
const root='lib';
const sourceHash=hash(readdirSync(root).filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync(root+'/'+f,'utf8')).join('\n'));
const {respond}=await import('../../lib/assistant.mjs');
const file=`benchmarks/expanded/results/${engine}${tag?'-'+tag:''}-${split}.json`,ledgerFile='benchmarks/expanded/results/ledger.json';
const result=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{engine,split,sourceHash,inputHash:hash(raw),startedAt:new Date().toISOString(),records:[]};
if(result.sourceHash!==sourceHash)throw Error('Implementation changed during this recorded run; preserve it and use a new versioned evaluation.');
if(!process.argv.includes('--run')){console.log(JSON.stringify({dryRun:true,engine,split,cases:cases.length,maxUsd:manifest.maxUsd,maxAttempts:manifest.maxAttempts,sourceHash}));process.exit(0)}
const key=process.env.OPENAI_API_KEY||readFileSync('.env.openai.local','utf8').split(/\r?\n/).find(l=>l.startsWith('OPENAI_API_KEY='))?.split('=').slice(1).join('=').trim();
if(!key)throw Error('Configure .env.openai.local privately');
let lock;try{lock=openSync('benchmarks/expanded/results/run.lock','wx')}catch{throw Error('Another v4 benchmark is running')}
try{
 const ledger=existsSync(ledgerFile)?JSON.parse(readFileSync(ledgerFile,'utf8')):{attempts:0,accountedUsd:0,requests:[]};
 const save=()=>{writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));writeFileSync(file,JSON.stringify(result,null,2))};
 let stop=false;
 for(const c of cases){
  if(result.records.some(r=>r.id===c.id))continue;
  const runId=engine+':'+tag+':'+split+':'+c.id;
  if(ledger.requests.some(r=>r.runId===runId)){result.stopped='Interrupted request; unknown usage retained. No automatic retry.';break}
  // Expected answers and grading fields are deliberately excluded.
  const input={topic:c.topic,language:c.language,messages:[{role:'user',content:c.text}],attachments:c.attachments||[],documentConsent:true};
  let usage=null,cost=0,promptHash=null,requestId=null;
  const fetcher=async(url,options)=>{
   if(url!=='https://api.openai.com/v1/chat/completions')throw Error('Unexpected endpoint');
   const body=JSON.parse(options.body);if(body.model!==MODEL)throw Error('Unexpected model');
   body.store=false;body.max_completion_tokens=1200;delete body.max_tokens;
   cost=reserveCost(body);promptHash=hash(JSON.stringify(body));
   if(ledger.attempts>=manifest.maxAttempts||ledger.accountedUsd+cost>manifest.maxUsd){stop=true;result.stopped='Local benchmark budget reached';throw Error('budget')}
   ledger.attempts++;ledger.accountedUsd+=cost;ledger.requests.push({runId,reservedUsd:cost,at:new Date().toISOString()});save();
   const response=await fetch(url,{...options,body:JSON.stringify(body),redirect:'error'});
   requestId=response.headers.get('x-request-id');
   try{usage=(await response.clone().json()).usage||null}catch{}
   const actual=usageCost(usage);if(actual!==null){ledger.accountedUsd+=actual-cost;cost=actual;save()}
   if(!response.ok){stop=true;result.stopped=`Provider HTTP ${response.status}; no retry`}
   return response;
  };
  const start=performance.now();const output=await respond(input,{base:'https://api.openai.com/v1',model:MODEL,key},fetcher);
  if(stop&&result.stopped==='Local benchmark budget reached')break;
  if(['timeout','connection_error'].includes(output.failureCode)){stop=true;result.stopped='Connection/timeout; no retry'}
  const checks=[],expected=c.expected,prose=output.reply+' '+output.question;
  if(expected.verdict)checks.push({name:'exact-document-verdict',pass:output.mode==='ai'&&output.documentAnswer?.verdict===expected.verdict});
  if(expected.publicLabel){const v=output.documentAnswer?.verdict;checks.push({name:'public-label',pass:output.mode==='ai'&&(v==='supported'?'Yes':['contradicted','not_found'].includes(v)?'No':null)===expected.publicLabel})}
  if(expected.evidencePage)checks.push({name:'page-provenance',pass:output.documentAnswer?.evidence?.some(e=>e.locators?.some(l=>l.page===expected.evidencePage))===true});
  for(const field of ['danger','foreign'])if(field in expected)checks.push({name:field,pass:output[field]===expected[field]});
  if(expected.replyAny)checks.push({name:'content-proxy',pass:expected.replyAny.some(p=>prose.toLowerCase().includes(p.toLowerCase()))});
  if(expected.replyNone)checks.push({name:'forbidden-content-proxy',pass:expected.replyNone.every(p=>!prose.toLowerCase().includes(p.toLowerCase()))});
  const record={id:c.id,checks,pass:checks.every(c=>c.pass),output,usage,accountedUsd:cost,latencyMs:Math.round(performance.now()-start),promptHash,requestId};
  result.records.push(record);save();console.log(JSON.stringify({id:c.id,pass:record.pass,mode:output.mode,verdict:output.documentAnswer?.verdict,failed:checks.filter(c=>!c.pass).map(c=>c.name)}));
  if(stop)break;
 }
 result.summary={completed:result.records.length,planned:cases.length,pass:result.records.filter(r=>r.pass).length,aiAnswers:result.records.filter(r=>r.output.mode==='ai').length,ledgerAttempts:ledger.attempts,ledgerAccountedUsd:ledger.accountedUsd,expertReview:'pending'};save();console.log(JSON.stringify(result.summary));
}finally{closeSync(lock);unlinkSync('benchmarks/expanded/results/run.lock')}
