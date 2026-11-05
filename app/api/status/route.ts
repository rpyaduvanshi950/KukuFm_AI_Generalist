import {env} from 'cloudflare:workers';
import {DAILY_BUDGET_MICROS,DAILY_REQUEST_LIMIT} from '../../../lib/spending.mjs';
export async function GET(){
 let service='guided',remainingUsd=0;
 try{
  if(env.DB&&process.env.AI_API_KEY&&process.env.AI_BASE_URL==='https://api.openai.com/v1'){
   const row=await env.DB.prepare('SELECT reserved_micros,attempts FROM ai_budget WHERE day=?').bind(new Date().toISOString().slice(0,10)).first<{reserved_micros:number;attempts:number}>();
   remainingUsd=Math.max(0,(DAILY_BUDGET_MICROS-(row?.reserved_micros||0))/1000000);
   service=remainingUsd>0&&(row?.attempts||0)<DAILY_REQUEST_LIMIT?'available':'allowance-reached';
  }
 }catch{service='tracking-unavailable'}
 return Response.json({configured:service==='available',service,remainingUsd,dailyAllowanceUsd:DAILY_BUDGET_MICROS/1000000,resetsAt:'00:00 UTC'},{headers:{'Cache-Control':'no-store'}});
}
