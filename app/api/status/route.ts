import {getDatabase} from '../../../lib/postgres.mjs';
import {readBudget} from '../../../lib/budget-postgres.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
import {DAILY_BUDGET_MICROS,DAILY_REQUEST_LIMIT} from '../../../lib/spending.mjs';
export async function GET(){
 let service='guided',remainingUsd=0;
 try{
  if(process.env.AI_API_KEY&&process.env.AI_BASE_URL==='https://api.openai.com/v1'){
   const db=getDatabase();if(!db)throw Error('tracking_unavailable');
   const row=await readBudget(db);
   remainingUsd=Math.max(0,(DAILY_BUDGET_MICROS-(row?.reserved_micros||0))/1000000);
   service=remainingUsd>0&&(row?.attempts||0)<DAILY_REQUEST_LIMIT?'available':'allowance-reached';
  }
 }catch{service='tracking-unavailable'}
 return Response.json({configured:service==='available',service,remainingUsd,dailyAllowanceUsd:DAILY_BUDGET_MICROS/1000000,resetsAt:'00:00 UTC'},{headers:{'Cache-Control':'no-store'}});
}
