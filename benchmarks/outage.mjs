import {readFileSync,writeFileSync} from 'node:fs';
const cases=JSON.parse(readFileSync('benchmarks/data/live-cases.json','utf8'));
const outputs=[];
for(const engine of ['baseline','current']){
 const {respond}=await import(engine==='baseline'?'./baseline/assistant.mjs':'../lib/assistant.mjs');
 const results=[];
 for(const c of cases){const input={topic:c.topic,language:c.language||'en',messages:c.messages||[{role:'user',content:c.text}],attachments:c.document?[{id:'doc-1',name:'synthetic.txt',kind:'text',text:c.document}]:[],documentConsent:true};let fetchCalls=0;const response=await respond(input,{base:'https://unavailable.test/v1',model:'unavailable-test'},async()=>{fetchCalls++;return {ok:false,status:503,json:async()=>({})}});const prose=response.reply+' '+response.question;const checks=[];for(const group of c.required||[])checks.push(group.some(pattern=>new RegExp(pattern,'i').test(prose)));for(const phrase of c.forbidden||[])checks.push(!prose.toLowerCase().includes(phrase.toLowerCase()));if('expectDanger'in c)checks.push(response.danger===c.expectDanger);if('expectForeign'in c)checks.push(response.foreign===c.expectForeign);results.push({id:c.id,split:c.split,pass:checks.every(Boolean),output:response,fetchCalls});}
 outputs.push({engine,kind:'Forced HTTP 503 simulation, no network calls',pairedPassed:results.filter(r=>r.split==='paired'&&r.pass).length,pairedTotal:8,holdoutRegressionPassed:results.filter(r=>r.split==='holdout'&&r.pass).length,holdoutRegressionTotal:4,results});
}
writeFileSync('benchmarks/results/forced-outage.json',JSON.stringify(outputs,null,2));console.log(outputs.map(({engine,pairedPassed,pairedTotal,holdoutRegressionPassed,holdoutRegressionTotal})=>({engine,pairedPassed,pairedTotal,holdoutRegressionPassed,holdoutRegressionTotal})));
