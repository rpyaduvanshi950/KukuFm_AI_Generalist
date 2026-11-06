import {readFileSync,writeFileSync,existsSync} from 'node:fs';
process.chdir(new URL('../..',import.meta.url).pathname);
const cases=JSON.parse(readFileSync('benchmarks/v5/cases.json','utf8')),manifest=JSON.parse(readFileSync('benchmarks/v5/manifest.json','utf8'));
const runs=['development','final'].filter(s=>existsSync('benchmarks/v5/results/'+s+'.json')).map(s=>JSON.parse(readFileSync('benchmarks/v5/results/'+s+'.json','utf8')));
const rows=runs.flatMap(run=>run.records.map(r=>({...r,split:run.split})));
const quantile=(xs,p)=>xs.length?[...xs].sort((a,b)=>a-b)[Math.max(0,Math.ceil(xs.length*p)-1)]:null;
const metrics=[];
for(const split of ['development','final','all'])for(const arm of manifest.arms){
 const records=rows.filter(r=>r.arm===arm&&(split==='all'||r.split===split)),documents=records.filter(r=>cases.find(c=>c.id===r.id).expected.verdict);
 const evidence=records.flatMap(r=>r.checks.filter(c=>c.name==='literal-evidence'));
 metrics.push({split,arm,planned:cases.filter(c=>split==='all'||c.split===split).length,completed:records.length,passed:records.filter(r=>r.pass).length,aiAnswers:records.filter(r=>r.output.mode==='ai').length,docCorrect:documents.filter(r=>r.checks.find(c=>c.name==='document-verdict')?.pass).length,docTotal:documents.length,evidenceMatched:evidence.filter(c=>c.pass).length,evidenceChecks:evidence.length,referencePolicyCompliant:records.filter(r=>r.referencePolicyCompliant).length,sentenceSupportResponses:records.filter(r=>r.output.answerSupport?.length).length,medianMs:quantile(records.map(r=>r.latencyMs),.5),p95Ms:quantile(records.map(r=>r.latencyMs),.95),accountedUsd:records.reduce((s,r)=>s+r.accountedUsd,0)});
}
const ledger=existsSync('benchmarks/v5/results/ledger.json')?JSON.parse(readFileSync('benchmarks/v5/results/ledger.json','utf8')):{attempts:0,accountedUsd:0};
const summary={snapshotNote:'The first final results are preserved from the evaluated engine. Three subsequent deterministic routing fixes and a refund-review integration change were verified separately offline. Development and final also used different engine snapshots; the combined score is not a single-release holdout result. The table is not a fresh evaluation of the later release.',date:'2026-11-07',status:rows.length===150?'complete':'partial',caseCount:cases.length,authoring:manifest.authoring,review:'Independent legal review pending. All scores below are implementer-authored mechanical proxies, not legal accuracy.',metrics,paidRequests:ledger.attempts,accountedUsd:ledger.accountedUsd,sourceHashes:runs.map(r=>({split:r.split,sourceHash:r.sourceHash,runnerHash:r.runnerHash,inputHash:r.inputHash})),failures:rows.filter(r=>!r.pass).map(r=>({id:r.id,split:r.split,arm:r.arm,mode:r.output.mode,failed:r.checks.filter(c=>!c.pass).map(c=>c.name)}))};
writeFileSync('benchmarks/v5/summary.json',JSON.stringify(summary,null,2)+'\n');
writeFileSync('benchmarks/v5/browser-data.json',JSON.stringify({summary,cases,rows},null,2)+'\n');
console.log(JSON.stringify({status:summary.status,records:rows.length,paidRequests:ledger.attempts,accountedUsd:ledger.accountedUsd,metrics},null,2));
