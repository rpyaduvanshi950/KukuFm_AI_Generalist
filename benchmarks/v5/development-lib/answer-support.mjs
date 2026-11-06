import {locateQuote} from './provenance.mjs';
/** Text matching establishes provenance only, not that a citation entails a legal conclusion. */
export function checkedAnswerSupport(entries,reply,input,cards,sources){
 if(!Array.isArray(entries))return [];
 const checked=[];
 for(const entry of entries.slice(0,4)){
  if(!entry||typeof entry.statement!=='string'||entry.statement.length<8||entry.statement.length>900||!reply.includes(entry.statement)||typeof entry.quote!=='string'||entry.quote.length<8||entry.quote.length>700)continue;
  const card=cards.find(c=>c.id===entry.sourceId),source=sources.find(s=>s.id===entry.sourceId);
  if(card||source){
   const ref=card?sources.find(s=>s.id===card.sourceId):source;
   if(!ref||![card?.text,card?.hi,source?.scope].filter(Boolean).some(text=>locateQuote(text,entry.quote).length))continue;
   checked.push({statement:entry.statement,sourceId:entry.sourceId,quote:entry.quote,kind:'legal_reference',name:ref.title,url:ref.url,checked:ref.checked,jurisdiction:card?.jurisdiction||'India-focused reference; individual applicability requires review',verification:'Reference quotation matched. Its application and the legal conclusion still need review.'});
  }else{
   const doc=(input.attachments||[]).find(a=>a.id===entry.sourceId&&a.kind==='text');
   const index=/^message-\d+$/.test(entry.sourceId||'')?Number(entry.sourceId.slice(8)):-1;
   const message=input.messages[index];
   const text=doc?.text||(message?.role==='user'?message.content:null);
   if(!text||!locateQuote(text,entry.quote).length)continue;
   checked.push({statement:entry.statement,sourceId:entry.sourceId,quote:entry.quote,kind:doc?'document':'user_account',name:doc?.name||'Your message',locators:locateQuote(text,entry.quote),verification:doc?'Quote matched to the supplied extract. Authenticity and interpretation are unverified.':'Quote matched to your message. Your account is not independently verified.'});
  }
  if(checked.length===2)break;
 }
 return checked;
}
