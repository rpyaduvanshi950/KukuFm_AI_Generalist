import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';
const [engine='current',suite='paired',file=`benchmarks/results/${engine}-${suite}.json`]=process.argv.slice(2);
if(!['baseline','current'].includes(engine)||!['paired','holdout','public'].includes(suite))throw Error('Invalid benchmark selection');
const {respond}=await import(engine==='baseline'?'./baseline/assistant.mjs':'../lib/assistant.mjs');
const env={...process.env};if(existsSync('.dev.vars'))for(const line of readFileSync('.dev.vars','utf8').split('\n')){const at=line.indexOf('=');if(at>0&&!line.startsWith('#'))env[line.slice(0,at)]=env[line.slice(0,at)]||line.slice(at+1).trim()}
if(!env.AI_API_KEY||!env.AI_MODEL||!env.AI_BASE_URL)throw Error('Configure private server AI settings first.');
const raw=readFileSync('benchmarks/data/live-cases.json','utf8'),manifest=JSON.parse(readFileSync('benchmarks/data/live-manifest.json','utf8'));if(createHash('sha256').update(raw).digest('hex')!==manifest.sha256)throw Error('Frozen live cases changed');
const publicManifest=suite==='public'?JSON.parse(readFileSync('benchmarks/data/public-manifest.json','utf8')):null;
let cases=suite==='public'?JSON.parse(readFileSync('benchmarks/data/legalbench-sample.json','utf8')).map(c=>({id:`legalbench-row-${c.source_row}`,topic:'property',text:'Based only on the attached clause, does it provide that the Receiving Party shall not disclose the fact that the Agreement was agreed or negotiated? Distinguish what is supported from what is not stated. This is a document-reading question, not an opinion on enforceability.',document:c.text,expectedLabel:c.answer})):JSON.parse(raw).filter(c=>c.split===suite);
if(suite==='public'&&process.env.BENCHMARK_PUBLIC_LIMIT==='6')cases=[...cases.filter(c=>c.expectedLabel==='Yes').slice(0,3),...cases.filter(c=>c.expectedLabel==='No').slice(0,3)];
const transport=process.env.BENCHMARK_TRANSPORT||'openai-compatible';
const ledgerPath='benchmarks/results/usage-ledger.json',ledger=existsSync(ledgerPath)?JSON.parse(readFileSync(ledgerPath,'utf8')):{budget:36,attempts:0,requests:[]};
const output={runAt:new Date().toISOString(),engine,suite,transport,caseIds:cases.map(c=>c.id),model:env.AI_MODEL,inputManifestSha256:manifest.sha256,publicManifest,cases:[]};
for(const c of cases){
 if(ledger.attempts>=ledger.budget){output.stopped='Global request budget reached';break}
 const attachments=c.document?[{id:'doc-1',name:'benchmark-document.txt',kind:'text',text:c.document}]:[];
 const input={topic:c.topic,language:c.language||'en',messages:c.messages||[{role:'user',content:c.text}],attachments,documentConsent:true};
 const debug=[];let attempts=0;
 const config={base:env.AI_BASE_URL,model:env.AI_MODEL,key:env.AI_API_KEY,transport,onDebug:event=>debug.push(event)};
 const fetcher=async(...args)=>{if(ledger.attempts>=ledger.budget)throw Error('budget');ledger.attempts++;attempts++;ledger.requests.push({engine,suite,id:c.id,at:new Date().toISOString()});writeFileSync(ledgerPath,JSON.stringify(ledger,null,2));return fetch(...args)};
 const started=performance.now();const response=await respond(input,config,fetcher);const latencyMs=Math.round(performance.now()-started);
 const prose=response.reply+' '+response.question;
 const checks=[];
 if(suite!=='public'){
  for(const group of c.required||[])checks.push({kind:'required-content',alternatives:group,pass:group.some(pattern=>new RegExp(pattern,'i').test(prose))});
  for(const phrase of c.forbidden||[])checks.push({kind:'forbidden-content',phrase,pass:!prose.toLowerCase().includes(phrase.toLowerCase())});
  if('expectDanger'in c)checks.push({kind:'danger-route',pass:response.danger===c.expectDanger,expected:c.expectDanger,actual:response.danger});
  if('expectForeign'in c)checks.push({kind:'foreign-route',pass:response.foreign===c.expectForeign,expected:c.expectForeign,actual:response.foreign});
 }
 const verdict=response.documentAnswer?.verdict;const predictedLabel=verdict==='supported'?'Yes':['contradicted','not_found'].includes(verdict)?'No':null;
 const record={id:c.id,input,output:response,latencyMs,attempts,debug,checks,automatedContentPass:checks.every(c=>c.pass),...(suite==='public'?{expectedLabel:c.expectedLabel,predictedLabel,correct:predictedLabel===c.expectedLabel}:{})};output.cases.push(record);writeFileSync(file,JSON.stringify(output,null,2));
 console.log(JSON.stringify({id:c.id,mode:response.mode,status:response.providerStatus,failureCode:response.failureCode,automatedContentPass:record.automatedContentPass,...(suite==='public'?{expected:c.expectedLabel,predicted:predictedLabel}:{}),tokens:debug.find(e=>e.usage)?.usage?.total_tokens,latencyMs}));
 if(response.providerStatus===429||response.providerStatus===401||response.providerStatus===403){output.stopped='Provider limit/authentication error; no retries or key rotation';writeFileSync(file,JSON.stringify(output,null,2));break}
}
console.log(JSON.stringify({completed:output.cases.length,globalRequestAttempts:ledger.attempts,budget:ledger.budget}));
