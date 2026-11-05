import {validateInput} from '../../../lib/legal.mjs';
import {respond} from '../../../lib/assistant.mjs';
import {env} from 'cloudflare:workers';
import {requestReservation,reserve,settle} from '../../../lib/spending.mjs';
// Best-effort protection for the private prototype. A public release needs a durable quota store.
const buckets=new Map<string,{start:number;count:number}>();
export async function POST(req:Request){
 const origin=req.headers.get('origin');
 if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Request origin not allowed.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>10_000_000)return Response.json({error:'Request too large.'},{status:413});
 let input;
 try{const raw=await req.text();if(raw.length>10_000_000)return Response.json({error:'Request too large.'},{status:413});input=JSON.parse(raw)}catch{return Response.json({error:'Invalid request.'},{status:400})}
 if(!validateInput(input))return Response.json({error:'Check the message and attachments: up to 3 documents, 36,000 text characters combined, and document-sharing consent are required.'},{status:400});
 const now=Date.now(),identity=req.headers.get('oai-authenticated-user-id')||req.headers.get('cf-connecting-ip')||'local';
 for(const [key,value] of buckets)if(now-value.start>3600000)buckets.delete(key);
 const bucket=buckets.get(identity)||{start:now,count:0};
 if(bucket.count>=40)return Response.json({error:'The hourly request budget is reached. Please return later or use the case workspace.'},{status:429,headers:{'Retry-After':'3600'}});
 if(buckets.size>500&&!buckets.has(identity))return Response.json({error:'The service is busy. Please try later.'},{status:503});
 bucket.count++;buckets.set(identity,bucket);
 const requestId=crypto.randomUUID(),started=Date.now();
 const config={base:process.env.AI_BASE_URL,model:process.env.AI_MODEL,key:process.env.AI_API_KEY,transport:process.env.AI_TRANSPORT};
 let paused='';
 const guardedFetch:typeof fetch=async(url,options)=>{
  if(url!=='https://api.openai.com/v1/chat/completions')throw Error('unpriced_provider');
  let ticket;
  try{ticket=await reserve(env.DB,requestReservation(JSON.parse(String(options?.body))))}catch{paused='AI is paused because usage tracking is unavailable or this request exceeds the supported input size. Guided information remains available.';throw Error('budget_tracking')}
  if(!ticket){paused='The daily AI allowance is reached or usage tracking is unavailable. Guided information remains available; no paid request was sent.';throw Error('budget')}
  let usage:{prompt_tokens:number;completion_tokens:number}|null=null,failed=true;
  try{
   // Workerd supports manual/follow; never forward credentials across a redirect.
   const response=await fetch(url,{...options,redirect:'manual'});
   try{usage=((await response.clone().json()) as {usage?:{prompt_tokens:number;completion_tokens:number}}).usage||null}catch{}
   failed=!response.ok;return response;
  }finally{
   try{await settle(env.DB,ticket,usage,failed)}catch{console.error(JSON.stringify({event:'usage_settlement_failed',requestId}))}
  }
 };
 const result=await respond(input,config,guardedFetch);
 // Aggregate diagnostics only. Never log messages, documents, user IDs, keys or output text.
 console.log(JSON.stringify({event:'legal_request',requestId,mode:result.mode,status:('providerStatus' in result?result.providerStatus:200),failure:paused?'local_allowance':('failureCode' in result?result.failureCode:null),latencyMs:Date.now()-started}));
 return Response.json({...result,...(paused?{notice:paused}:{}),requestId},{headers:{'Cache-Control':'no-store'}});
}
