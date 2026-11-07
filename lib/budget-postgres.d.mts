export const DAILY_BUDGET_MICROS:number;
export const DAILY_REQUEST_LIMIT:number;
export const HOURLY_REQUEST_LIMIT:number;
export function requestReservation(body:any):number;
export function reserveBudget(db:any,micros:number,now?:Date):Promise<{id:string;day:string;micros:number}|null>;
export function settleBudget(db:any,ticket:any,usage:any,failed?:boolean):Promise<void>;
export function readBudget(db:any,now?:Date):Promise<{reserved_micros:number;attempts:number}|null>;
