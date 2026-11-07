export const DAILY_BUDGET_MICROS=500000; // $0.50 across the entire deployment, UTC day.
export const DAILY_REQUEST_LIMIT=100;
export function requestReservation(body){
 if(!/^gpt-5\.4-mini(?:-2026-03-17)?$/.test(body.model)||body.max_completion_tokens!==1200)throw Error('unpriced_model');
 let images=0;
 const copy=structuredClone(body);
 for(const m of copy.messages||[])if(Array.isArray(m.content))for(const p of m.content)if(p.type==='image_url'){images++;p.image_url={url:'[image]'}}
 const bytes=new TextEncoder().encode(JSON.stringify(copy)).length;
 if(bytes>100000)throw Error('context_too_large');
 // Conservative text byte bound plus framing. Image reserve exceeds the maximum
 // published high-detail patch sizing for this model (rounded up generously).
 const inputBound=bytes*2+4096+images*16000;
 return Math.ceil(inputBound*0.75+1200*4.5); // micro-dollars
}
export function reportedCost(usage){
 if(!Number.isFinite(usage?.prompt_tokens)||!Number.isFinite(usage?.completion_tokens)||usage.prompt_tokens<0||usage.completion_tokens<0)return null;
 return Math.ceil(usage.prompt_tokens*0.75+usage.completion_tokens*4.5);
}
export async function reserve(db,micros,day=new Date().toISOString().slice(0,10)){
 if(!db||!Number.isSafeInteger(micros)||micros<=0||micros>DAILY_BUDGET_MICROS)return null;
 // One conditional UPSERT is the concurrency boundary. Never read then reserve.
 const row=await db.prepare(`INSERT INTO ai_budget(day,reserved_micros,attempts,failures) VALUES(?,?,1,0)
 ON CONFLICT(day) DO UPDATE SET reserved_micros=reserved_micros+excluded.reserved_micros, attempts=attempts+1
 WHERE reserved_micros+excluded.reserved_micros<=? AND attempts<? RETURNING day`).bind(day,micros,DAILY_BUDGET_MICROS,DAILY_REQUEST_LIMIT).first();
 return row?{day,micros}:null;
}
export async function settle(db,ticket,usage,failed=false){
 const cost=reportedCost(usage);
 // Unknown usage retains the entire reservation, including provider failures.
 const delta=cost===null?0:cost-ticket.micros;
 await db.prepare('UPDATE ai_budget SET reserved_micros=MAX(0,reserved_micros+?),failures=failures+? WHERE day=?').bind(delta,failed?1:0,ticket.day).run();
}
