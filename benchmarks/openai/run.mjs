import {readFileSync,writeFileSync,existsSync,mkdirSync,openSync,closeSync,unlinkSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {respond} from '../../lib/assistant.mjs';
import {prepareRequest,candidateVersion} from './candidate.mjs';
import {MODEL,MAX_REQUESTS,MAX_USD,RATES,reserveCost,usageCost,canReserve} from './budget.mjs';

process.chdir(fileURLToPath(new URL('../..',import.meta.url)));
const hash=value=>createHash('sha256').update(value).digest('hex');
const customRaw=readFileSync('benchmarks/data/live-cases.json','utf8');
const manifest=JSON.parse(readFileSync('benchmarks/data/live-manifest.json','utf8'));
if(hash(customRaw)!==manifest.sha256)throw Error('Frozen custom inputs changed');
const custom=JSON.parse(customRaw);
const publicRaw=readFileSync('benchmarks/data/legalbench-sample.json','utf8');
const publicCases=JSON.parse(publicRaw).map(c=>({id:`legalbench-row-${c.source_row}`,split:'public',topic:'property',text:'Based only on the attached clause, does it provide that the Receiving Party shall not disclose the fact that the Agreement was agreed or negotiated? Distinguish what is supported from what is not stated. This is a document-reading question, not an opinion on enforceability.',document:c.text,expectedLabel:c.answer}));
const cases=[...custom,...publicCases];
const sources=[...readdirSync('lib').filter(f=>f.endsWith('.mjs')).map(f=>'lib/'+f),'benchmarks/openai/candidate.mjs','benchmarks/openai/budget.mjs','benchmarks/openai/run.mjs'];
const sourceHash=hash(sources.sort().map(p=>p+'\n'+readFileSync(p,'utf8')).join('\n'));
const plan={model:MODEL,maxRequests:MAX_REQUESTS,maxUsd:MAX_USD,rates:RATES,candidateVersion,sourceHash,customInputHash:hash(customRaw),publicInputHash:hash(publicRaw),logicalCases:cases.length,variants:['original','candidate'],disclosure:'Same current application and inputs for both variants. Public sample and custom holdout have been inspected in prior work; neither is a new blind test. Keyword checks are proxies, not lawyer grading. No retries, no external tools, text-only synthetic/public inputs.'};
const planHash=hash(JSON.stringify(plan));
const dir='benchmarks/results/openai-mini';
mkdirSync(dir,{recursive:true});
writeFileSync(dir+'/plan.json',JSON.stringify({...plan,planHash},null,2));
if(!process.argv.includes('--run')){
 console.log(JSON.stringify({status:'dry-run; no API requests',...plan},null,2));
 process.exit(0);
}
let key=process.env.OPENAI_API_KEY||'';
if(!key&&existsSync('.env.openai.local')){
 const line=readFileSync('.env.openai.local','utf8').split(/\r?\n/).find(s=>s.startsWith('OPENAI_API_KEY='));
 key=(line?.slice('OPENAI_API_KEY='.length)||'').trim().replace(/^(["'])(.*)\1$/,'$2');
}
if(!key||/paste|your.key|example/i.test(key)){
 console.log('No OpenAI key configured. Paste it after OPENAI_API_KEY= in .env.openai.local. No API requests made.');
 process.exitCode=2;
}else{
 const lockPath=dir+'/run.lock';
 let lock;
 try{lock=openSync(lockPath,'wx')}catch{throw Error('A benchmark run is already locked. Do not run concurrently.');}
 try{
  const resultPath=dir+'/results.json';
  const result=existsSync(resultPath)?JSON.parse(readFileSync(resultPath,'utf8')):{planHash,plan,startedAt:new Date().toISOString(),attempts:0,accountedUsd:0,records:[],reservations:[]};
  if(result.planHash!==planHash)throw Error('Code or frozen inputs changed since this run. Preserve results and use a separately versioned run directory.');
  const save=()=>writeFileSync(resultPath,JSON.stringify(result,null,2));
  let stop=false;
  for(let index=0;index<cases.length&&!stop;index++){
   const c=cases[index];
   // Alternate order to reduce a systematic time/order advantage.
   for(const variant of index%2?['candidate','original']:['original','candidate']){
    const runId=c.id+':'+variant;
    if(result.records.some(r=>r.runId===runId))continue;
    if(result.reservations.some(r=>r.runId===runId)){
     result.stopped='An interrupted request has unknown outcome. Inspect it; automatic retry is disabled.';stop=true;break;
    }
    const input={topic:c.topic,language:c.language||'en',messages:c.messages||[{role:'user',content:c.text}],attachments:c.document?[{id:'doc-1',name:'benchmark-document.txt',kind:'text',text:c.document}]:[],documentConsent:true};
    let charge=0,usage=null,requestId=null,promptHash=null,providerFailure=false;
    const debug=[];
    const fetcher=async(url,options)=>{
     if(url!=='https://api.openai.com/v1/chat/completions')throw Error('Unexpected endpoint');
     const body=prepareRequest(JSON.parse(options.body),variant);
     promptHash=hash(JSON.stringify(body));
     charge=reserveCost(body);
     if(!canReserve(result,charge)){result.stopped='Request or conservative cost limit reached';stop=true;throw Error('Local budget reached');}
     result.attempts++;result.accountedUsd+=charge;
     result.reservations.push({runId,reservedUsd:charge,at:new Date().toISOString()});save();
     const response=await fetch(url,{...options,body:JSON.stringify(body),redirect:'error'});
     requestId=response.headers.get('x-request-id');
     try{usage=(await response.clone().json()).usage||null}catch{}
     const actual=usageCost(usage);
     if(actual!==null){result.accountedUsd+=actual-charge;charge=actual;save();}
     if(!response.ok){providerFailure=true;stop=true;result.stopped=`Provider returned HTTP ${response.status}; no retry`;}
     return response;
    };
    const start=performance.now();
    const output=await respond(input,{base:'https://api.openai.com/v1',model:MODEL,key,onDebug:e=>debug.push(e)},fetcher);
    if(stop&&result.stopped==='Request or conservative cost limit reached')break;
    if(output.failureCode==='connection_error'||output.failureCode==='timeout'){stop=true;result.stopped='Connection failure or timeout; no automatic retry. Unknown usage retains its reserved cost.';}
    const prose=output.reply+' '+output.question;
    const checks=[];
    if(c.split!=='public'){
     for(const group of c.required||[])checks.push({kind:'required',pass:group.some(p=>new RegExp(p,'i').test(prose))});
     for(const phrase of c.forbidden||[])checks.push({kind:'forbidden',pass:!prose.toLowerCase().includes(phrase.toLowerCase())});
     for(const [expect,field] of [['expectDanger','danger'],['expectForeign','foreign']])if(expect in c)checks.push({kind:field,pass:output[field]===c[expect]});
    }
    const verdict=output.documentAnswer?.verdict;
    const predictedLabel=verdict==='supported'?'Yes':['contradicted','not_found'].includes(verdict)?'No':null;
    const record={runId,id:c.id,split:c.split,variant,mode:output.mode,output,latencyMs:Math.round(performance.now()-start),usage,accountedUsd:charge,requestId,promptHash,checks,debug,...(c.split==='public'?{expectedLabel:c.expectedLabel,predictedLabel,correct:predictedLabel===c.expectedLabel}:{automatedContentPass:checks.every(c=>c.pass)})};
    result.records.push(record);save();
    console.log(JSON.stringify({id:c.id,variant,mode:output.mode,status:output.providerStatus,failureCode:output.failureCode,costUsd:charge,...(c.split==='public'?{correct:record.correct}:{contentPass:record.automatedContentPass})}));
    if(providerFailure||stop)break;
   }
  }
  result.updatedAt=new Date().toISOString();
  result.summary=Object.fromEntries(['original','candidate'].map(variant=>{
   const rows=result.records.filter(r=>r.variant===variant),pub=rows.filter(r=>r.split==='public'),local=rows.filter(r=>r.split!=='public');
   return [variant,{completed:rows.length,planned:cases.length,aiAnswers:rows.filter(r=>r.mode==='ai').length,publicCorrect:pub.filter(r=>r.correct).length,publicCompleted:pub.length,publicPlanned:publicCases.length,publicAbstentions:pub.filter(r=>r.predictedLabel===null).length,customProxyPass:local.filter(r=>r.automatedContentPass).length,customCompleted:local.length,customPlanned:custom.length,averageLatencyMs:rows.length?Math.round(rows.reduce((n,r)=>n+r.latencyMs,0)/rows.length):null}];
  }));
  save();console.log(JSON.stringify({summary:result.summary,requests:result.attempts,accountedUsd:result.accountedUsd,stopped:result.stopped||null},null,2));
 }finally{closeSync(lock);unlinkSync(lockPath)}
}
