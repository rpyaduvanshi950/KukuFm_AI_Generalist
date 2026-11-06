import {draftCase} from './legal.mjs';
export const refundQuestions=[
 ['recipient','Who sold the item or service?','विक्रेता या सेवा देने वाले का नाम क्या है?'],
 ['amount','How much did you pay?','आपने कितना भुगतान किया?'],
 ['dates','Which payment or cancellation dates do you know?','भुगतान या रद्द करने की कौन-सी तारीखें पता हैं?'],
 ['location','Which city and state are involved?','मामला किस शहर और राज्य का है?'],
 ['outcome','What resolution are you asking for?','आप क्या समाधान चाहते हैं?'],
];
export const refundDetailFields=[['order','Order reference, if known','ऑर्डर का संदर्भ, यदि पता हो'],['purchase','Item or service','वस्तु या सेवा'],['sellerReply','Seller’s response, in their words where possible','विक्रेता का जवाब, संभव हो तो उन्हीं के शब्दों में'],['contact','How you contacted the seller, if at all','विक्रेता से कैसे संपर्क किया, यदि किया हो']];
export function missingRefundFacts(facts={}){return refundQuestions.filter(([key])=>!String(facts[key]||'').trim())}
export function refundRequest(facts,details={},language='en'){
 const extra=refundDetailFields.filter(([key])=>String(details[key]||'').trim()).map(([key,en,hi])=>(language==='hi'?hi:en)+': '+String(details[key]).trim());
 return draftCase({...facts,story:[facts.story||'',...extra].filter(Boolean).join('\n')},'refund',language);
}
export function refundPreparationSummary(facts={},details={}){
 return ['REFUND PREPARATION: USER ACCOUNT, NOT VERIFIED',...refundDetailFields.map(([key,label])=>label+': '+(String(details[key]||'').trim()||'[Not supplied]')),'Missing or deliberately unknown details: '+(missingRefundFacts(facts).map(([,label])=>label).join('; ')||'No standard intake field is blank. This does not establish completeness.'),'No refund entitlement, legal deadline or filing has been established.'].join('\n');
}
export function refundAnalysisQuestion(facts={},details={},language='en'){
 const data=Object.fromEntries(Object.entries({...facts,...details}).filter(([,value])=>String(value||'').trim()));
 return (language==='hi'?'मेरे रिफंड मामले के लिए उपलब्ध रिकॉर्ड और मेरे विवरण को अलग-अलग रखें। केवल दिए गए प्रमाण के आधार पर अगला व्यावहारिक कदम बताएँ। जरूरी तथ्य न हो तो सिर्फ एक प्रश्न पूछें। कोई कानूनी समय-सीमा या रिफंड की गारंटी न दें।':'For this refund issue, distinguish my account from the supplied records. Explain the immediate practical next step using only supported information. Ask one essential missing-fact question if needed. Do not invent a legal deadline or guarantee a refund.')+'\n'+JSON.stringify(data);
}
