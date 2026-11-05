import {validateInput} from '../../../lib/legal.mjs';
import {respond} from '../../../lib/assistant.mjs';
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
 const result=await respond(input,{base:process.env.AI_BASE_URL,model:process.env.AI_MODEL,key:process.env.AI_API_KEY});
 return Response.json(result,{headers:{'Cache-Control':'no-store'}});
}
