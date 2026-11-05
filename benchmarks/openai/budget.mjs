export const MODEL='gpt-5.4-mini-2026-03-17';
export const MAX_REQUESTS=48;
export const MAX_USD=0.50;
export const RATES={input:0.75,output:4.50}; // USD / million tokens, checked 2026-11-06.
export function reserveCost(body){
 // Text-only: UTF-8 bytes exceed normal BPE token counts. Include generous
 // serialization/framing margin; this is a local cost guard, not a billing limit.
 const inputBound=Buffer.byteLength(JSON.stringify(body),'utf8')*2+4096;
 return (inputBound*RATES.input+body.max_completion_tokens*RATES.output)/1e6;
}
export function usageCost(usage){
 if(!Number.isFinite(usage?.prompt_tokens)||!Number.isFinite(usage?.completion_tokens))return null;
 // Ignore cache discounts conservatively. Failed/unknown usage retains reservation.
 return (usage.prompt_tokens*RATES.input+usage.completion_tokens*RATES.output)/1e6;
}
export function canReserve(ledger,amount){
 return ledger.attempts<MAX_REQUESTS&&Number.isFinite(amount)&&amount>0&&ledger.accountedUsd+amount<=MAX_USD;
}
