import {locateQuote} from './provenance.mjs';
/** Text matching establishes provenance only, not that a citation entails a legal conclusion. */
export function checkedAnswerSupport(entries,reply,input,cards,sources){
 if(!Array.isArray(entries))return [];
 const checked=[];
 const words=text=>new Set(text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]);
 const stop=new Set(['the','and','for','that','this','with','from','your','have','will','should','only','not','you','are','can','has','its','was']);
 const related=(a,b)=>[...words(a)].filter(w=>!stop.has(w)&&words(b).has(w)).length>=2;
 const instruction=text=>/^(?:please |help (?:me |organise|organize)|ignore |system:|tell me |what should|how (?:can|do)|मदद|कृपया)/i.test(text.trim());
 for(const entry of entries.slice(0,4)){
  if(!entry||typeof entry.statement!=='string'||entry.statement.length<8||entry.statement.length>900||!reply.includes(entry.statement)||typeof entry.quote!=='string'||entry.quote.length<8||entry.quote.length>700)continue;
  if(instruction(entry.quote)||entry.quote.trim().split(/\s+/).length<4||!related(entry.statement,entry.quote))continue;
  const card=cards.find(c=>c.id===entry.sourceId),source=sources.find(s=>s.id===entry.sourceId);
  if(card||source){
   const ref=card?sources.find(s=>s.id===card.sourceId):source;
   if(!ref||![card?.text,card?.hi,source?.scope].filter(Boolean).some(text=>locateQuote(text,entry.quote).length))continue;
   checked.push({statement:entry.statement,sourceId:entry.sourceId,quote:entry.quote,kind:'legal_reference',name:ref.title,url:ref.url,checked:ref.checked,jurisdiction:card?.jurisdiction||'India-focused reference; individual applicability requires review',supportStatus:'related_not_verified',verification:'Related passage: support not verified. Quotation matched to an app summary, not original statutory wording. Legal applicability and meaning need qualified review.'});
  }else{
   const doc=(input.attachments||[]).find(a=>a.id===entry.sourceId&&a.kind==='text');
   const index=/^message-\d+$/.test(entry.sourceId||'')?Number(entry.sourceId.slice(8)):-1;
   const message=input.messages[index];
   const text=doc?.text||(message?.role==='user'?message.content:null);
   if(!doc&&!/you (?:say|said|report|describe)|your account|आपके (?:अनुसार|विवरण)|आपने/i.test(entry.statement))continue;
   if(!text||!locateQuote(text,entry.quote).length)continue;
   checked.push({statement:entry.statement,sourceId:entry.sourceId,quote:entry.quote,kind:doc?'document':'user_account',name:doc?.name||'Your message',locators:locateQuote(text,entry.quote),supportStatus:'related_not_verified',verification:doc?'Related passage: support not verified. Quote matched; authenticity and interpretation are unverified.':'User assertion only, not support for a recommendation. Your account is not independently verified.'});
  }
  if(checked.length===2)break;
 }
 return checked;
}
