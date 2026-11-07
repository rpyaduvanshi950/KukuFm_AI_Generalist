// Revalidate retained provider text with the patched engine; never makes a network call.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {respond} from '../../lib/assistant.mjs';
process.chdir(fileURLToPath(new URL('../..',import.meta.url)));
const dir='benchmarks/submission',original=JSON.parse(readFileSync(dir+'/results.json','utf8')),cases=JSON.parse(readFileSync(dir+'/cases.json','utf8'));
const records=[];
for(const c of cases){
 const prior=original.records.find(r=>r.id===c.id);
 if(!prior?.rawOutput)continue;
 const output=await respond(c.input,{base:'https://api.openai.com/v1',model:'gpt-5.4-mini-2026-03-17',key:'offline-placeholder'},async()=>Response.json({choices:[{message:{content:prior.rawOutput}}],usage:prior.usage}));
 const e=c.expected,prose=[output.reply,output.question,output.documentAnswer?.answer].filter(Boolean).join(' ');
 const checks=[{name:'AI-shaped response accepted',pass:output.mode==='ai'},{name:'topic',pass:output.topic===e.topic}];
 if(e.verdict)checks.push({name:'document verdict',pass:output.documentAnswer?.verdict===e.verdict});
 if(e.replyAny)checks.push({name:'required-content proxy',pass:e.replyAny.some(t=>prose.toLowerCase().includes(t.toLowerCase()))});
 if(e.replyNone)checks.push({name:'forbidden-content proxy',pass:e.replyNone.every(t=>!prose.toLowerCase().includes(t.toLowerCase()))});
 if(e.forbiddenFacts)checks.push({name:'unknown facts preserved',pass:!(output.facts||[]).some(f=>e.forbiddenFacts.includes(f.field))});
 records.push({id:c.id,checks,pass:checks.every(x=>x.pass),output});
}
const result={kind:'Offline replay of retained model responses; no new generations, not a fresh accuracy score',networkRequests:0,sourceHash:createHash('sha256').update(readdirSync('lib').filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync('lib/'+f,'utf8')).join('\n')).digest('hex'),originalInputHash:original.inputHash,passed:records.filter(r=>r.pass).length,total:records.length,records};
writeFileSync(dir+'/replay.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:result.passed,total:result.total,networkRequests:0}));
