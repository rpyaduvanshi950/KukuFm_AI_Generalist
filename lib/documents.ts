import { unzipSync, strFromU8 } from 'fflate';

export type Attachment = {
  id: string; name: string; kind: 'text' | 'image'; text: string;
  image?: string; pages?: number; warnings: string[]; size: number;
};
export const DOCUMENT_LIMITS={files:3,bytes:10*1024*1024,characters:18000,pages:20,imagePixels:1800};

function limitText(text:string){
 const cleaned=text.replace(/\u0000/g,'').trim();
 return {text:cleaned.slice(0,DOCUMENT_LIMITS.characters),truncated:cleaned.length>DOCUMENT_LIMITS.characters};
}
export function readDocx(buffer:ArrayBuffer){
 let expanded=0;
 const files=unzipSync(new Uint8Array(buffer),{filter(file){
  expanded+=file.originalSize;
  if(expanded>25*1024*1024||file.originalSize>10*1024*1024)throw new Error('This Word file expands beyond the safe reading limit. Export a smaller PDF or text file.');
  return file.name==='word/document.xml';
 }});
 if(!files['word/document.xml'])throw new Error('This is not a readable .docx document.');
 const xml=strFromU8(files['word/document.xml']);
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('Unsupported XML declarations in this document.');
 const parsed=new DOMParser().parseFromString(xml,'application/xml');
 if(parsed.getElementsByTagName('parsererror').length)throw new Error('The Word document could not be parsed.');
 const paragraphs=Array.from(parsed.getElementsByTagNameNS('*','p'));
 return paragraphs.map(p=>Array.from(p.getElementsByTagNameNS('*','t')).map(t=>t.textContent||'').join('')).join('\n');
}
async function imageToData(file:File){
 const image=await createImageBitmap(file);
 try{
 if(image.width*image.height>40_000_000)throw new Error('Image resolution is too large. Please resize it first.');
 const scale=Math.min(1,DOCUMENT_LIMITS.imagePixels/Math.max(image.width,image.height));
 const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image processing is not supported in this browser.');
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const data=canvas.toDataURL('image/jpeg',0.88);
 if(data.length>3_000_000)throw new Error('Image is too detailed to send. Please crop it to the relevant section.');
 return data;
 }finally{image.close()}
}
export async function readAttachment(file:File):Promise<Attachment>{
 if(file.size>DOCUMENT_LIMITS.bytes)throw new Error('Each file must be 10 MB or smaller.');
 if(file.size===0)throw new Error('This file is empty.');
 const ext=file.name.split('.').pop()?.toLowerCase();
 const base:Attachment={id:crypto.randomUUID(),name:file.name.slice(0,180),kind:'text',text:'',warnings:[],size:file.size};
 if(['png','jpg','jpeg','webp'].includes(ext||'')){
  base.kind='image';base.image=await imageToData(file);base.warnings.push('AI vision may misread names, dates or amounts. Check against the original.');return base;
 }
 if(['txt','md','csv'].includes(ext||'')){
  const {text,truncated}=limitText(await file.text());base.text=text;if(truncated)base.warnings.push('Only the first 18,000 characters were extracted.');
 }else if(ext==='docx'){
  const {text,truncated}=limitText(readDocx(await file.arrayBuffer()));base.text=text;
  base.warnings.push('Main document text only. Formatting, embedded images, comments, headers and footers are not read.');
  if(truncated)base.warnings.push('Only the first 18,000 characters were extracted.');
 }else if(ext==='pdf'){
  const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true});
  const timeout=setTimeout(()=>task.destroy(),25000);
  try{
   const pdf=await task.promise;base.pages=pdf.numPages;
   if(pdf.numPages>DOCUMENT_LIMITS.pages)base.warnings.push(`Only the first ${DOCUMENT_LIMITS.pages} of ${pdf.numPages} pages were read.`);
   let text='';const blank:number[]=[];
   for(let i=1;i<=Math.min(pdf.numPages,DOCUMENT_LIMITS.pages);i++){
    const page=await pdf.getPage(i);const content=await page.getTextContent();
    const pageText=content.items.map(item=>'str' in item?item.str+('hasEOL' in item&&item.hasEOL?'\n':' '):'').join('').trim();
    if(pageText.length<15)blank.push(i);
    text+=`\n[Page ${i}]\n${pageText}\n`;page.cleanup();
    if(text.length>DOCUMENT_LIMITS.characters){base.warnings.push(`Text extraction stopped on page ${i} at the 18,000-character limit.`);break;}
   }
   base.text=limitText(text).text;
   if(blank.length)base.warnings.push(`Little or no text on page(s) ${blank.join(', ')}. Scans are not read as text: attach a clear image of the relevant page for AI vision.`);
   if(base.text.replace(/\[Page \d+\]/g,'').trim().length<15)throw new Error('This PDF appears scanned or has no readable text. Attach a JPG/PNG of the relevant page instead.');
  }catch(e){if(e instanceof Error&&/password/i.test(e.message))throw new Error('This PDF is password protected. Please provide an unlocked copy.');throw e}finally{clearTimeout(timeout);await task.destroy()}
 }else throw new Error('Supported formats: PDF, DOCX, TXT, MD, CSV, JPG, PNG and WebP.');
 if(!base.text.trim())throw new Error('No readable text found. Try another format.');
 return base;
}
