/** Strict reference checks against the retrieved pack, not a proof of legal correctness. */
export function assertGroundedProse(prose,cards,allowedSources){
 const sectionSet=new Set(cards.flatMap(card=>card.section.match(/\d+/g)||[]));
 const reference=/(?:sections?|धारा(?:एँ|ओं)?)\s+(\d+(?:\s*(?:,|and|और|to|through|[-–])\s*\d+)*)/gi;
 for(const match of prose.matchAll(reference)){
  const numbers=match[1].match(/\d+/g)||[];
  if(numbers.some(number=>!sectionSet.has(number)))throw Error('unsupported_section');
  if(/\b(?:to|through)\b|[-–]/i.test(match[1])&&numbers.length===2){
   const start=Number(numbers[0]),end=Number(numbers[1]);
   if(end<start||end-start>20)throw Error('unsupported_section');
   for(let n=start;n<=end;n++)if(!sectionSet.has(String(n)))throw Error('unsupported_section');
  }
 }
 if(/\bArticle\s+\d+|अनुच्छेद\s*\d+/i.test(prose))throw Error('unsupported_authority');
 const authorities=[
  [/\b(?:Consumer Protection Act|CPA\s*2019)\b/i,'consumer-act'],
  [/\b(?:Code on Wages|Wage Code)\b/i,'wages'],
  [/\b(?:Domestic Violence Act|Protection of Women from Domestic Violence)\b/i,'dv-act'],
  [/\b(?:BNSS|Bharatiya Nagarik Suraksha Sanhita)\b/i,'bnss'],
  [/\b(?:Model Tenancy Act)\b/i,'tenancy-model']
 ];
 for(const [pattern,id] of authorities)if(pattern.test(prose)&&!allowedSources.includes(id))throw Error('unsupported_authority');
 if(/\b(?:IPC|CrPC|Indian Penal Code|Code of Criminal Procedure|Bharatiya Nyaya Sanhita|Constitution of India)\b/i.test(prose))throw Error('unsupported_authority');
 if(/\b(?:must|shall|required to)\s+(?:file|appeal|respond|submit)\b[^.!?]{0,65}\b(?:within|by|before)\s+\d+/i.test(prose))throw Error('unsupported_deadline');
}
