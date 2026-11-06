/** Bounded intent helpers. These reduce common false positives; they are not a safety classifier. */
export function withoutNegatedSignals(text){
 return String(text)
  .replace(/\b(?:not|no|never|nobody|nothing|isn't|is not|there is no)\b[^.!?\n]{0,100}\b(?:danger|violence|assault|attacking|hurt|criminal(?: case)?|fabricat\w*|forg\w*|fake evidence)\b/gi,' ')
  .replace(/(?:हिंसा|हमला|खतरा)[^।.!?\n]{0,25}नहीं[^।.!?\n]*/g,' ');
}
export function cleanDocumentSignals(text){
 return String(text).split('\n').filter(line=>!/(?:^|\s)(?:SYSTEM|ASSISTANT|DEVELOPER)\s*:|ignore (?:all|previous|the user)|switch to|reveal (?:the )?(?:prompt|key)/i.test(line)).join('\n');
}
export function requestsFabrication(text){
 // Allegations ("the seller fabricated evidence") are different from requests to fabricate it.
 const value=String(text).replace(/\b(?:do not|don't|never|not to|will not|won't)\s+(?:want to\s+)?(?:fabricat\w*|forge\w*|create\s+(?:a\s+)?fake)[^.!?\n]*/gi,' ');
 return /(?:^|[.!?\n]\s*)(?:please\s+)?(?:fabricate|forge)\s+(?:fake\s+|false\s+|a\s+|an\s+|some\s+|my\s+)?(?:evidence|records?|receipts?|signatures?|documents?|salary|rental|agreement)/i.test(value)
  || /\b(?:help me|can you|could you|please|I want you to|I need you to)\s+(?:to\s+)?(?:fabricate|forge)\b[^.!?\n]{0,50}\b(?:evidence|records?|receipts?|signature|documents?|salary|rental|agreement)\b/i.test(value)
  || /\b(?:create|make|generate|write)\s+(?:(?:a|an|some|my)\s+)?(?:fake|false|forged|fabricated)\s+(?:evidence|records?|receipts?|signatures?|documents?|rental agreement|agreement|letter)/i.test(value)
  || /(?:नकली|झूठे)\s+(?:सबूत|दस्तावेज़)[^।.!?\n]{0,20}(?:बना दो|बनाओ|बनाने में मदद)/.test(value);
}
export function foreignJurisdiction(userText){
 const value=String(userText);
 const explicitForeignLaw=/\b(?:US|U\.S\.|United States|UK|British|Canadian|Australian|California|New York|German|Germany|French|France|Dubai|UAE|Singapore)\s+(?:(?:rental|employment|contract|tenancy|criminal|immigration)\s+)?(?:law|visa)|\bUS immigration\b/i.test(value);
 if(explicitForeignLaw)return true;
 const foreignPlace=/\b(?:United States|California|New York|London|Canada|Toronto|Dubai|UAE|Australia)\b/i.test(value);
 const indiaMatter=/\b(?:in India|Indian law|India-based|property in (?:Pune|Mumbai|Delhi|India)|work in India)\b/i.test(value);
 return foreignPlace&&!indiaMatter;
}
export function riskSignals(messages,documentText=''){
 const userMessages=messages.filter(m=>m.role==='user').map(m=>m.content);
 const latest=userMessages.at(-1)||'',history=userMessages.join('\n');
 const explicitSafe=/\b(?:safe now|not in (?:immediate |current )?danger|no current danger|not something happening to me|general question)\b|अभी सुरक्षित/.test(latest.toLowerCase());
 const informational=/\b(?:what does|define|definition|meaning of)\b|का अर्थ|क्या मतलब/i.test(latest)&&(/general question|not (?:something )?happening to me/i.test(latest)||!/(?:happening to me|right now|attacking me|hit me)/i.test(withoutNegatedSignals(latest)));
 const safetyStatement=latest.match(/safe now|not in (?:immediate |current )?danger|no current danger|अभी सुरक्षित/gi);
 const safetyIndex=safetyStatement?latest.toLowerCase().lastIndexOf(safetyStatement.at(-1).toLowerCase()):-1;
 const active=withoutNegatedSignals(explicitSafe&&safetyIndex>=0?latest.slice(safetyIndex+safetyStatement.at(-1).length):history);
 const positive=/\b(?:violence|assault|immediate danger|kill|attacking|beating)\b|(?:hit|beat|hurting)\s+(?:me|my child)|threatening me(?:\s+(?:with\b[^.!?\n]{0,60}|right\s+))?\s*now|(?:threaten\w*|point\w*)[^.!?\n]{0,60}\b(?:knife|gun|weapon)\b|हिंसा|जान से|हमला/i.test(active);
 const danger=Boolean(positive&&!informational);
 const notices=cleanDocumentSignals(documentText);
 const urgent=danger||/\b(?:arrest(?:ed|ing)?|summons|hearing|evict(?:ing|ion)?|court notice|deadline|threat(?:en(?:ing|ed)?)?)\b|गिरफ्तार|धमकी|सुनवाई|नोटिस/i.test(withoutNegatedSignals(history))
  || /\b(?:court summons|court notice|hearing date|police notice)\b|सुनवाई.*तारीख|अदालत.*नोटिस/i.test(notices);
 return {danger,urgent};
}

/** Routing cues only: unknown financial involvement keeps the conditional urgent route available. */
export function cyberIncidentKind(text=''){
 const value=String(text);
 const nonfinancial=/account (?:takeover|hack)|(?:email|instagram|facebook|social media|profile).*hack|impersonat|fake (?:profile|account)|online harassment|sextortion|साइबर उत्पीड़न|फर्जी प्रोफाइल/i.test(value);
 const positive=value.replace(/\b(?:no|not|without)\s+(?:any\s+)?(?:money|funds|payment|transaction|financial loss)(?:\s+(?:was |has been )?(?:lost|taken|made|involved|affected))?/gi,' ').replace(/पैसे[^।.!?\n]{0,15}नहीं/g,' ');
 const financial=/\b(?:upi|bank|card|payment|transaction|transferred|paid|debit(?:ed)?|lost (?:money|funds)|stole (?:money|funds)|financial fraud)\b|₹|रुपये|भुगतान|लेनदेन/i.test(positive);
 if(financial)return 'financial';
 if(nonfinancial||/\b(?:no money|no (?:payment|transaction)|no financial loss|without (?:any )?payment)\b|पैसे[^।.!?\n]{0,15}नहीं/i.test(value))return 'nonfinancial';
 return 'unknown';
}

export function isPrivateNotice(text=''){
 return /private legal notice|lawyer[^.!?\n]{0,50}(?:notice|demand)|demand letter/i.test(text)&&!/also (?:received|have|got)[^.!?\n]{0,25}(?:police|court)|police (?:arrested|detained) me/i.test(text);
}
