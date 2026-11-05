/** Optional Gemini REST transport. No retries, model changes or key rotation. */
export function geminiNativeFetcher(innerFetch=fetch){
 return async (url,options)=>{
  if(new URL(url).hostname!=='generativelanguage.googleapis.com')throw Error('Native Gemini transport requires the official Gemini endpoint.');
  const body=JSON.parse(options.body),authorization=new Headers(options.headers).get('Authorization')||'';
  const key=authorization.replace(/^Bearer\s+/i,'');
  const system=body.messages.filter(m=>m.role==='system').map(m=>m.content).join('\n');
  const parts=[];
  for(const message of body.messages.filter(m=>m.role!=='system')){
   const content=typeof message.content==='string'?[{type:'text',text:message.content}]:message.content;
   for(const item of content){
    if(item.type==='text')parts.push({text:item.text});
    else if(item.type==='image_url'){
     const match=item.image_url.url.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/);
     if(!match)throw Error('Unsupported image payload');
     parts.push({inlineData:{mimeType:match[1],data:match[2]}});
    }
   }
  }
  const response=await innerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(body.model)}:generateContent`,{
   method:'POST',signal:options.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',maxOutputTokens:body.max_tokens,temperature:body.temperature}})
  });
  const data=await response.json();
  if(!response.ok)return {ok:false,status:response.status,json:async()=>({error:{code:data.error?.code,status:data.error?.status}})};
  return {ok:true,status:200,json:async()=>({choices:[{message:{content:(data.candidates?.[0]?.content?.parts||[]).filter(p=>p.text&&!p.thought).map(p=>p.text).join('')}}],usage:{prompt_tokens:data.usageMetadata?.promptTokenCount||0,completion_tokens:data.usageMetadata?.candidatesTokenCount||0,total_tokens:data.usageMetadata?.totalTokenCount||0}})};
 };
}
