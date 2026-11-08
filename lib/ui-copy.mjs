export function fileMessage(message,language='en'){
 if(language!=='hi')return message;
 const exact={
 'Each file must be 10 MB or smaller.':'हर फ़ाइल 10 MB या उससे छोटी होनी चाहिए।','This file is empty.':'यह फ़ाइल खाली है।','Attach up to three files at a time.':'एक बार में अधिकतम तीन फ़ाइलें जोड़ें।',
 'Could not read this file.':'यह फ़ाइल नहीं पढ़ी जा सकी।','Could not render this page.':'इस पृष्ठ का चित्र नहीं बनाया जा सका।',
 'This quotation is no longer present in the current extracted text. Compare it with the original.':'यह उद्धरण वर्तमान निकाले गए पाठ में नहीं है। मूल रिकॉर्ड से मिलान करें।',
 'Only the first 18,000 characters were extracted.':'केवल पहले 18,000 अक्षर निकाले गए हैं।',
 'Main document text only. Formatting, embedded images, comments, headers and footers are not read.':'केवल मुख्य दस्तावेज़ का पाठ पढ़ा गया है। चित्र, टिप्पणियाँ, हेडर, फुटर और स्वरूप नहीं पढ़े गए।',
 'AI vision may misread names, dates or amounts. Check against the original.':'AI चित्र पढ़ते समय नाम, तारीख या राशि गलत पढ़ सकता है। मूल से जाँचें।',
 'Scanned page reading uses unverified AI vision. Check every name, amount and date against the page.':'स्कैन पृष्ठ की AI रीडिंग असत्यापित है। हर नाम, राशि और तारीख मूल पृष्ठ से जाँचें।',
 'This PDF is password protected. Please provide an unlocked copy.':'यह PDF पासवर्ड से सुरक्षित है। बिना पासवर्ड वाली प्रति दें।',
 'No readable text found. Try another format.':'पढ़ने योग्य पाठ नहीं मिला। दूसरा प्रारूप आज़माएँ।',
 'Supported formats: PDF, DOCX, TXT, MD, CSV, JPG, PNG and WebP.':'समर्थित प्रारूप: PDF, DOCX, TXT, MD, CSV, JPG, PNG और WebP।',
 'This is not a readable .docx document.':'यह पढ़ने योग्य DOCX दस्तावेज़ नहीं है।',
 'The Word document could not be parsed.':'Word दस्तावेज़ का पाठ नहीं पढ़ा जा सका।',
 'This Word file expands beyond the safe reading limit. Export a smaller PDF or text file.':'इस Word फ़ाइल का खुला आकार सुरक्षित सीमा से अधिक है। छोटी PDF या पाठ फ़ाइल दें।'};
 if(exact[message])return exact[message];
 let m;
 if((m=message.match(/^Only the first (\d+) of (\d+) pages were read/)))return `कुल ${m[2]} पृष्ठों में केवल पहले ${m[1]} पढ़े गए।`;
 if((m=message.match(/^Text extraction stopped on page (\d+)/)))return `18,000 अक्षरों की सीमा पर पृष्ठ ${m[1]} में पाठ निकालना रुक गया।`;
 if((m=message.match(/^Only page (\d+) will be sent/)))return `केवल पृष्ठ ${m[1]} भेजा जाएगा। बाकी पृष्ठ नहीं पढ़े गए हैं।`;
 if((m=message.match(/^Little or no text on page\(s\) ([\d, ]+)/)))return `पृष्ठ ${m[1]} में बहुत कम या कोई पाठ नहीं मिला। स्कैन के लिए चयनित पृष्ठ का चित्र इस्तेमाल करें।`;
 return 'पढ़ने की सीमा या समस्या (मूल विवरण): '+message;
}
export const staleWarning=language=>language==='hi'?'पुराना मसौदा: विवरण या रिकॉर्ड बदल गए हैं। संपादित पाठ तुलना के लिए रखा गया है। दोबारा जाँचें और नया मसौदा बनाएँ; तब तक कॉपी और डाउनलोड बंद हैं।':'Outdated draft: details or records changed. Your edited text is preserved for comparison. Review and regenerate before copying or downloading.';
export const supersededWarning=language=>language==='hi'?'पिछली समीक्षा पुराने विवरण या रिकॉर्ड पर आधारित है। निष्कर्ष और सुझाए तथ्य वर्तमान प्रमाण नहीं हैं। फिर से समीक्षा करें।':'Previous review is superseded because details or records changed. Its findings and suggested facts are not current evidence. Review again.';
export const limitsHi={refund:'उपभोक्ता पात्रता, उपाय, सही मंच और समय-सीमा की व्यक्तिगत जाँच जरूरी है। रिफंड की गारंटी नहीं है।',rental:'नियम राज्य और समझौते के अनुसार बदलते हैं। पूरे देश के लिए जमा सीमा, वापसी तारीख या उपभोक्ता मंच की पात्रता नहीं मानी गई है।',salary:'नौकरी का वर्गीकरण और क्षेत्राधिकार जरूरी हैं। पुराने पोर्टल नई व्यवस्था से पहले के हो सकते हैं; खास धाराएँ या समय-सीमा तय नहीं की जाती।',cyber:'ऐप पैसा रोक या रिपोर्ट दाखिल नहीं कर सकता। बैंक की जिम्मेदारी, समय-सीमा और उपाय व्यक्तिगत समीक्षा माँगते हैं।',family:'कानून का कवरेज और पारिवारिक अधिकार तथ्यों व लागू कानून पर निर्भर हैं। तलाक, अभिरक्षा और भरण-पोषण के लिए योग्य समीक्षा लें।',police:'अदालत का उत्तर, जमानत का अनुमान या कानूनी समय-सीमा की गणना नहीं दी जाती। लागू प्रक्रिया और अपवाद वकील से जँचवाएँ।',property:'केवल दस्तावेज़ का अर्थ और तथ्य व्यवस्थित करना। स्वामित्व, विरासत, स्टाम्प शुल्क और सीमा-अवधि इस सत्यापित दायरे में नहीं हैं।',other:'यह विषय विशेषज्ञ कार्यप्रवाह के बाहर है। ऐप तथ्य व्यवस्थित कर सकता है, अधिकार तय या अदालत का उत्तर नहीं लिख सकता।'};
export const stepsHi={
 refund:['ऑर्डर, भुगतान प्रमाण और अपना अनुरोध विक्रेता को लिखित में दें; प्रति रखें।','मामला न सुलझे तो मुकदमे से पहले सहायता के लिए राष्ट्रीय उपभोक्ता हेल्पलाइन देखें।','फिर भी समाधान न मिले तो उपयुक्त मंच और दाखिला प्रक्रिया योग्य सलाहकार से जँचवाएँ।'],
 rental:['समझौता, भुगतान, हस्तांतरण और कटौती का लिखित विवरण रखें।','मकान मालिक से कटौती का मदवार कारण और विवादित राशि वापसी का तथ्य आधारित अनुरोध करें।','लागू राज्य कानून और सही मंच स्थानीय वकील या विधिक सेवा प्राधिकरण से जाँचें।'],
 salary:['बकाया अवधि, राशि और काम के रिकॉर्ड रखें।','HR या नियोक्ता से लिखित में भुगतान का मदवार विवरण और जवाब माँगें।','सक्षम श्रम प्राधिकरण या वकील से जाँचें; कवरेज नौकरी, नियोक्ता, जगह और तारीख पर निर्भर है।'],
 cyber:['पैसे प्रभावित हों तो बैंक के सत्यापित माध्यम से तुरंत संपर्क करें और 1930 या आधिकारिक साइबर पोर्टल इस्तेमाल करें। खाते/प्रोफ़ाइल के दुरुपयोग में आधिकारिक प्लेटफ़ॉर्म रिकवरी और रिपोर्टिंग देखें।','संदेश और लेनदेन संदर्भ रखें। पासवर्ड/OTP न दें और रिकवरी एजेंट को पैसे न दें।','शिकायत की पावती रखें और संबंधित प्राधिकरण से आगे की प्रक्रिया पूछें। वापसी की गारंटी नहीं है।'],
 family:['तुरंत खतरा हो तो 112 पर संपर्क करें और संभव हो तो सुरक्षित जगह जाएँ। ऐप आपात सेवा से संपर्क नहीं कर सकता।','लागू संरक्षण और निवास उपाय स्थानीय वकील, संरक्षण अधिकारी या विधिक सेवा प्राधिकरण से पूछें।','रिकॉर्ड तभी रखें जब सुरक्षित हो। सबूत के लिए हिंसा करने वाले का सामना या जोखिम न लें।'],
 police:['गिरफ्तारी, सुनवाई या जवाब की तारीख हो तो योग्य वकील से तुरंत संपर्क करें। नोटिस अनदेखा न करें।','पूरा नोटिस और मिलने का रिकॉर्ड रखें; संदेह हो तो आधिकारिक माध्यम से प्रेषक जाँचें।','लागू प्रक्रिया, तारीख और विधिक सहायता वकील से जाँचें। केवल पुरानी धारा देखकर नोटिस को अमान्य न मानें।'],
 property:['समझौता, रिकॉर्ड और तारीखें व्यवस्थित करें; इन्हें स्वामित्व या जिम्मेदारी का निर्णायक प्रमाण न मानें।','स्थानीय वकील से लागू संपत्ति, अनुबंध और पंजीकरण नियम जँचवाएँ।','नोटिस या सुनवाई हो तो तुरंत सलाह लें। जबरन प्रवेश जैसे स्वयं के कदम न उठाएँ।'],
 other:['तथ्य व्यवस्थित करें और मूल रिकॉर्ड रखें।','नोटिस, सुनवाई या समय-सीमा हो तो योग्य वकील से तुरंत संपर्क करें।','स्थानीय विधिक सेवा प्राधिकरण से सहायता की पात्रता जाँचें।']};
const labels={'Your name':'आपका नाम','Other party / organisation':'दूसरा पक्ष / संस्था','City and state':'शहर और राज्य','Amount involved':'संबंधित राशि','Key dates':'प्रमुख तारीखें','What happened?':'क्या हुआ?','Evidence you actually have':'आपके पास उपलब्ध प्रमाण','What outcome do you want?':'आप क्या परिणाम चाहते हैं?','Prepare draft':'मसौदा तैयार करें','Review your draft':'मसौदा जाँचें','Local preparation':'स्थानीय तैयारी','Download preparation brief':'तैयारी विवरण डाउनलोड करें','Select if useful':'जरूरी हो तो चुनें','Cyber incident preparation':'साइबर घटना की तैयारी','Domestic-safety preparation':'घरेलू सुरक्षा की तैयारी','Notice review preparation':'नोटिस समीक्षा की तैयारी','Immediate danger':'तुरंत खतरा','Unsure about immediate safety':'तुरंत सुरक्षा के बारे में अनिश्चित','Prefer not to say':'नहीं बताना चाहता/चाहती','Safe at present':'अभी सुरक्षित','Financial fraud':'वित्तीय धोखाधड़ी','Account takeover':'खाते पर अनधिकृत कब्ज़ा','Impersonation':'नकली पहचान','Online harassment':'ऑनलाइन उत्पीड़न','Document type':'दस्तावेज़ का प्रकार','Incident type':'घटना का प्रकार','Current situation':'वर्तमान स्थिति','Unknown / needs verification':'अज्ञात / जाँच जरूरी','Police appearance notice':'पुलिस पेशी का नोटिस','Court summons / hearing notice':'अदालत का समन / सुनवाई नोटिस','Private legal notice':'निजी कानूनी नोटिस'};
export const uiText=(text,language)=>language==='hi'?(labels[text]||text):text;
export function responseNotice(text,language){
 if(language!=='hi')return text;
 if(/allowance|limit|usage|tracking|paused/i.test(text))return 'AI की सीमा पूरी है या उपयोग की जाँच उपलब्ध नहीं है। निर्देशित जानकारी और स्थानीय तैयारी उपलब्ध हैं।';
 return 'AI जवाब उपलब्ध नहीं है या सत्यापन में स्वीकार नहीं हुआ। निर्देशित जानकारी उपलब्ध है; दस्तावेज़ की AI व्याख्या की पुष्टि नहीं हुई है।';
}
