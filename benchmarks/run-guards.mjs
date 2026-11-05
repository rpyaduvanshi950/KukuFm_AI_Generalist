import {validateModelOutput} from '../lib/assistant.mjs';import {writeFileSync} from 'node:fs';
const input={topic:'police',language:'en',messages:[{role:'user',content:'Please explain my police notice.'}]};
const base={question:'When was it received?',sourceIds:['bnss'],facts:[],documentFindings:[]};
const probes=[['unknown trailing section','Sections 38, 47 and 999 apply.'],['range hides unsupported numbers','Sections 38 through 48 apply.'],['unknown article','Article 999 guarantees bail.'],['wrong act','Section 38 of the Indian Penal Code applies.'],['fabricated filing deadline','You must file within 30 days.']];
const results=probes.map(([id,reply])=>{try{validateModelOutput({...base,reply},input,['bnss']);return {id,blocked:false}}catch(error){return {id,blocked:true,reason:error.message}}});
for(const [id,reply] of [['known list','BNSS sections 38, 47 and 48 describe safeguards.'],['known reference','Section 38 concerns advocate access, though not throughout interrogation.']]){try{validateModelOutput({...base,reply},input,['bnss']);results.push({id,allowed:true})}catch(error){results.push({id,allowed:false,reason:error.message})}}
writeFileSync('benchmarks/results/reference-guards.json',JSON.stringify(results,null,2));console.log(results);
