export function validEvent(event){
 if(!event||typeof event.description!=='string'||!event.description.trim()||event.description.length>700||typeof event.date!=='string'||typeof event.source!=='string'||event.source.length>180)return false;
 if(!event.date)return true;
 return /^\d{4}-\d{2}-\d{2}$/.test(event.date)&&Number.isFinite(Date.parse(event.date+'T00:00:00Z'))&&new Date(event.date+'T00:00:00Z').toISOString().slice(0,10)===event.date;
}
export function sortedEvents(events){return [...events].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'))}
export function lawyerBrief({facts,events=[],topic,evidenceChecked=[],attachments=[],analysis,sources=[]}){
 const lines=['NYAYA — CASE SUMMARY FOR REVIEW','Prepared from the user’s account; facts, authenticity and legal conclusions are unverified.','No message has been sent and no case has been filed.','',`Topic: ${topic}`,''];
 for(const [label,key] of [['Name','name'],['Other party','recipient'],['Location','location'],['Amount','amount'],['Dates as stated','dates'],['Account of events','story'],['Requested outcome','outcome'],['Available evidence as stated','evidence']])lines.push(`${label}: ${facts[key]?.trim()||'[Not supplied]'}`,'');
 lines.push('TIMELINE — USER ENTERED; NO DEADLINES CALCULATED');
 for(const e of sortedEvents(events.filter(validEvent)))lines.push(`${e.date||'[Date unknown]'} | ${e.description} | Source: ${e.source||'User account'}`);
 if(!events.length)lines.push('[No timeline events supplied]');
 lines.push('','EVIDENCE CHECKED BY USER',...evidenceChecked.map(x=>'- '+x));
 if(!evidenceChecked.length)lines.push('[None marked as gathered]');
 lines.push('','DOCUMENTS AVAILABLE IN THIS SESSION');
 for(const a of attachments){lines.push(`- ${a.name}: ${a.coverage||'Completeness not established.'}`);for(const w of a.warnings||[])lines.push('  Reading limit: '+w)}
 if(!attachments.length)lines.push('[No attachments in this session]');
 if(analysis?.documentAnswer){lines.push('','DOCUMENT INTERPRETATION — NEEDS REVIEW',`${analysis.documentAnswer.verdict}: ${analysis.documentAnswer.answer}`);for(const e of analysis.documentAnswer.evidence||[])lines.push(`Quote (${e.name}${e.locators?.map(l=>l.page?`, page ${l.page}`:`, line ${l.lineStart}`).join('')||''}): ${e.quote}`)}
 for(const issue of analysis?.documentIssues||[])lines.push('',`Potential ${issue.kind}: ${issue.summary}`);
 lines.push('','REFERENCE LINKS — APPLICABILITY NEEDS REVIEW');
 for(const s of sources.filter(s=>analysis?.sourceIds?.includes(s.id)))lines.push(`- ${s.title} | checked ${s.checked} | ${s.url}`);
 lines.push('','QUESTIONS FOR COUNSEL','Confirm jurisdiction, applicable law and forum; verify any notice/hearing dates and limitation; inspect original documents and missing pages; advise on realistic remedies.','This summary is not a lawyer-issued notice, pleading or legal opinion.');
 return lines.join('\n');
}
