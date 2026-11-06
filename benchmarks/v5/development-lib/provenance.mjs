// Derive locations from the supplied text, never from model-generated page numbers.
function indexed(text){
 let value='',offsets=[];
 for(let i=0;i<text.length;i++){
  let ch=text[i],at=i;
  if(ch==='\\'&&text[i+1]==='n'){ch='\n';i++}
  if(/\s/.test(ch)){if(value&&!value.endsWith(' ')){value+=' ';offsets.push(at)}}
  else{value+=ch;offsets.push(at)}
 }
 if(value.endsWith(' ')){value=value.slice(0,-1);offsets.pop()}
 return {value,offsets};
}
export function locateQuote(text,quote){
 const source=indexed(String(text)),needle=indexed(String(quote)).value;
 if(needle.length<2)return [];
 const locations=[];let from=0;
 while(locations.length<3){
  const at=source.value.indexOf(needle,from);if(at<0)break;
  const start=source.offsets[at],end=source.offsets[at+needle.length-1]+1;
  const before=text.slice(0,start),markers=[...before.matchAll(/\[Page (\d+)\]/g)];
  locations.push({start,end,page:markers.length?Number(markers.at(-1)[1]):null,lineStart:before.split('\n').length,lineEnd:text.slice(0,end).split('\n').length});
  from=at+needle.length;
 }
 return locations;
}
