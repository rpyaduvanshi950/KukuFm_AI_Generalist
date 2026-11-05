import test from 'node:test';
import assert from 'node:assert/strict';
import {makePrompt} from '../../lib/assistant.mjs';
import {prepareRequest} from './candidate.mjs';
import {MAX_REQUESTS,MAX_USD,reserveCost,usageCost,canReserve} from './budget.mjs';
test('candidate preserves legal rules and uses bounded GPT parameters',()=>{
 const {system,context}=makePrompt({topic:'refund',language:'en',messages:[{role:'user',content:'The seller has not refunded me.'}]});
 const original={temperature:0.1,max_tokens:1800,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(context)}]};
 const request=prepareRequest(original,'candidate');
 assert.ok(request.messages[0].content.startsWith(system));
 assert.equal(request.max_completion_tokens,1200);assert.equal(request.reasoning_effort,'none');assert.equal(request.store,false);
 assert.equal(request.temperature,undefined);assert.equal(request.max_tokens,undefined);
 assert.equal(original.max_tokens,1800);assert.deepEqual(request.messages[1],original.messages[1]);
});
test('request and cost ceilings block before sending',()=>{
 const amount=reserveCost({messages:[{content:'hello'}],max_completion_tokens:1200});
 assert.ok(amount>usageCost({prompt_tokens:100,completion_tokens:1200}));
 assert.equal(canReserve({attempts:0,accountedUsd:0},amount),true);
 assert.equal(canReserve({attempts:MAX_REQUESTS,accountedUsd:0},amount),false);
 assert.equal(canReserve({attempts:0,accountedUsd:MAX_USD-amount/2},amount),false);
 assert.equal(canReserve({attempts:0,accountedUsd:0},NaN),false);
 assert.equal(usageCost(null),null);
});
