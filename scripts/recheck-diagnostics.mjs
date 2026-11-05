import {readFileSync,writeFileSync} from 'node:fs';
import {validateModelOutput,makePrompt} from '../lib/assistant.mjs';
const data=JSON.parse(readFileSync('outputs/diagnostic-live-results.json','utf8'));
const checks=data.cases.map(c=>{const raw=c.debug.find(d=>d.raw)?.raw;const {result,context}=makePrompt(c.input);try{const validated=validateModelOutput(raw,c.input,[...result.sourceIds,...context.reviewedLawCards.map(k=>k.sourceId)]);return {id:c.id,pass:true,validated}}catch(e){return {id:c.id,pass:false,reason:e.message}}});
writeFileSync('outputs/diagnostic-recheck.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks.map(({id,pass,reason})=>({id,pass,reason})),null,2));
