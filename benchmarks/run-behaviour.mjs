import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assess} from '../lib/legal.mjs';
const args=process.argv.slice(2),split=args[0]||'development',output=args[1]||'benchmarks/results/behaviour-current.json';
const raw=readFileSync('benchmarks/data/india-cases.json','utf8'),manifest=JSON.parse(readFileSync('benchmarks/data/india-manifest.json','utf8'));
if(createHash('sha256').update(raw).digest('hex')!==manifest.sha256)throw Error('Frozen test cases changed.');
const cases=JSON.parse(raw).filter(c=>split==='all'||c.split===split),results=[];
for(const c of cases){const result=assess(c.input);const actual={topic:result.topic,danger:result.danger,urgent:result.urgent,foreign:result.foreign,cyber:result.cyber,refusal:/cannot help fabricate/.test(result.reply)};const checks=Object.entries(c.expect).map(([field,value])=>({field,expected:value,actual:actual[field],pass:actual[field]===value}));results.push({id:c.id,category:c.category,split:c.split,pass:checks.every(x=>x.pass),checks,input:c.input,actual});}
const report={runAt:new Date().toISOString(),caseSha256:manifest.sha256,split,cases:results.length,passed:results.filter(r=>r.pass).length,assertions:results.flatMap(r=>r.checks).length,assertionsPassed:results.flatMap(r=>r.checks).filter(c=>c.pass).length,results};
writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.cases,passed:report.passed,assertions:report.assertions,assertionsPassed:report.assertionsPassed,failures:results.filter(r=>!r.pass).map(r=>({id:r.id,checks:r.checks.filter(c=>!c.pass)}))},null,2));
