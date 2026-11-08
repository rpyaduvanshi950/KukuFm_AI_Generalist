import {validEvent} from './case-brief.mjs';
const fields=['name','recipient','location','dates','amount','story','evidence','outcome'];
export function savedCase(raw,allowedTopics){
 const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid_saved_case');
 const facts=Object.fromEntries(fields.map(k=>[k,typeof value.facts?.[k]==='string'?value.facts[k].slice(0,10000):'']));
 return {facts,checked:Array.isArray(value.checked)?value.checked.filter(x=>typeof x==='string').slice(0,30):[],events:Array.isArray(value.events)?value.events.filter(validEvent).slice(0,50):[],topic:allowedTopics.includes(value.topic)?value.topic:'auto'};
}
