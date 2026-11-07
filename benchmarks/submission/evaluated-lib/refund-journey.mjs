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
 const hi=language==='hi';
 const labels=[['story','Your account','आपका विवरण'],['recipient','Seller','विक्रेता'],['amount','Amount as stated','बताई गई राशि'],['location','Location','स्थान'],['dates','Dates as stated','बताई गई तारीखें'],['outcome','Requested resolution','चाहा गया समाधान'],['evidence','Records you say you have','आपके बताए उपलब्ध रिकॉर्ड'],...refundDetailFields];
 const data={...facts,...details};
 const lines=labels.filter(([key])=>String(data[key]||'').trim()).map(([key,en,hn])=>(hi?hn:en)+': '+String(data[key]).trim());
 return (hi?'मेरे रिफंड विवरण और उपलब्ध रिकॉर्ड की समीक्षा करें। मेरे विवरण और दस्तावेज़ के पाठ को अलग रखें। अगला व्यावहारिक कदम बताएँ और कोई जरूरी विवरण न हो तो एक सवाल पूछें।':'Please review my refund account and available records. Distinguish my account from the document text. Explain the immediate practical next step and ask one essential missing-fact question if needed.')+'\n\n'+lines.join('\n');
}

export function refundSuggestions(facts={}){
 if(String(facts.amount||'').trim())return [];
 const story=String(facts.story||'');
 const matches=[...story.matchAll(/\bpaid\s+((?:INR|Rs\.?)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?)|(?:paid|भुगतान)\s*(₹\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi)];
 if(matches.length!==1)return [];
 const match=matches[0];return [{field:'amount',value:match[1]||match[2],quote:match[0]}];
}
