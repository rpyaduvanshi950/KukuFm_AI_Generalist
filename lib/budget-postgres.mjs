import {randomUUID} from 'node:crypto';
import {DAILY_BUDGET_MICROS,DAILY_REQUEST_LIMIT,reportedCost} from './spending.mjs';
export {DAILY_BUDGET_MICROS,DAILY_REQUEST_LIMIT,requestReservation} from './spending.mjs';
export const HOURLY_REQUEST_LIMIT=40;
export async function reserveBudget(db,micros,now=new Date()){
 if(!db||!Number.isSafeInteger(micros)||micros<=0||micros>DAILY_BUDGET_MICROS)return null;
 const day=now.toISOString().slice(0,10),window=now.toISOString().slice(0,13),id=randomUUID();
 // All concurrent callers contend on the same hour/day keys. No read-then-reserve race.
 const result=await db.query(`WITH rate AS (
  INSERT INTO ai_rate_limit AS r(hour_key,attempts) VALUES($4,1)
  ON CONFLICT(hour_key) DO UPDATE SET attempts=r.attempts+1 WHERE r.attempts<$7 RETURNING hour_key
 ), budget AS (
  INSERT INTO ai_budget AS b(day,reserved_micros,attempts,failures)
  SELECT $1,$2,1,0 FROM rate
  ON CONFLICT(day) DO UPDATE SET reserved_micros=b.reserved_micros+EXCLUDED.reserved_micros,attempts=b.attempts+1
  WHERE b.reserved_micros+EXCLUDED.reserved_micros<=$5 AND b.attempts<$6 RETURNING day
 )
 INSERT INTO ai_reservations(id,day,micros) SELECT $3,day,$2 FROM budget RETURNING id,day,micros`,
 [day,micros,id,window,DAILY_BUDGET_MICROS,DAILY_REQUEST_LIMIT,HOURLY_REQUEST_LIMIT]);
 return result.rows[0]||null;
}
export async function settleBudget(db,ticket,usage,failed=false){
 if(!db||!ticket?.id)return;
 const actual=reportedCost(usage);
 // Use the stored reservation, not client-supplied amounts. Settle each ticket once.
 await db.query(`WITH done AS (
  UPDATE ai_reservations SET settled=TRUE WHERE id=$1 AND settled=FALSE RETURNING day,micros
 ) UPDATE ai_budget AS b SET reserved_micros=GREATEST(0,b.reserved_micros+CASE WHEN $2::integer IS NULL THEN 0 ELSE $2-done.micros END),
 failures=b.failures+$3 FROM done WHERE b.day=done.day`,[ticket.id,actual,failed?1:0]);
}
export async function readBudget(db,now=new Date()){
 if(!db)return null;
 const {rows}=await db.query('SELECT reserved_micros,attempts FROM ai_budget WHERE day=$1',[now.toISOString().slice(0,10)]);
 return rows[0]||{reserved_micros:0,attempts:0};
}
