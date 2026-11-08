// Test-process preload only. Production never imports this file.
// Every external URL is blocked. No real key is loaded and no AI provider is called.
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 const target=String(url),parsed=new URL(target);
 if(['127.0.0.1','localhost'].includes(parsed.hostname))return nativeFetch(url,options);
 if(target!=='https://api.openai.com/v1/chat/completions')throw Error('External network is disabled in the audit fixture process.');
 const body=JSON.parse(String(options.body)),parts=body.messages.at(-1).content;
 const context=JSON.parse(Array.isArray(parts)?parts[0].text:parts),doc=context.documents?.find(d=>d.kind==='text');
 const correction=doc?.text.includes('Correction: amount is INR 380.'),conflict=doc?.text.includes('Receipt A: INR 830.')&&doc?.text.includes('Receipt B: INR 380.')&&!correction;
 const raw={reply:'[MOCKED PROVIDER: NO AI CALL] Review the supplied test record. Facts are unverified.',question:'',sourceIds:[],facts:[],documentFindings:[],documentIssues:[],answerSupport:[],documentAnswer:null};
 if(conflict){
  const evidence=['Receipt A: INR 830.','Receipt B: INR 380.'].map(quote=>({attachmentId:doc.id,quote}));
  raw.reply='[MOCKED PROVIDER: NO AI CALL] The records conflict and do not establish one amount.';
  raw.facts=evidence.map((e,i)=>({field:'amount',value:i?'INR 380':'INR 830',sourceId:doc.id,quote:e.quote}));
  raw.documentAnswer={verdict:'unclear',answer:'The same payment has competing values.',evidence};raw.documentIssues=[{kind:'conflict',summary:'Two amounts for one payment; no controlling record identified.',evidence}];
 }else if(correction){
  const evidence=[{attachmentId:doc.id,quote:'Correction: amount is INR 380.'}];
  raw.reply='[MOCKED PROVIDER: NO AI CALL] The supplied record identifies a correction.';
  raw.facts=[{field:'amount',value:'INR 380',sourceId:doc.id,quote:evidence[0].quote}];raw.documentAnswer={verdict:'supported',answer:'The correction states INR 380.',evidence};
 }else if(doc){
  const quote=doc.text.replace(/\[Page \d+\]/g,'').trim().slice(0,80);
  raw.documentAnswer={verdict:'supported',answer:'This offline fixture quotes the supplied text; no legal interpretation is evaluated.',evidence:[{attachmentId:doc.id,quote}]};
 }
 return Response.json({choices:[{message:{content:JSON.stringify(raw)}}],usage:{prompt_tokens:100,completion_tokens:100,total_tokens:200}});
};
