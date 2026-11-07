import {createHash,timingSafeEqual} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest();
export function accessResponse(headers,env=process.env){
 const mode=env.ACCESS_MODE||'protected';
 if(mode==='public')return null;
 if(mode!=='protected'||!env.APP_PASSWORD||env.APP_PASSWORD.length<16)return new Response('Reviewer access is not configured.',{status:503,headers:{'Cache-Control':'no-store'}});
 const auth=headers.get('authorization')||'';
 let password='';
 if(auth.length<=4096&&/^Basic [A-Za-z0-9+/]+=*$/i.test(auth)){
  const decoded=Buffer.from(auth.slice(6),'base64').toString('utf8'),colon=decoded.indexOf(':');
  if(colon>0)password=decoded.slice(colon+1);
 }
 if(!password||!timingSafeEqual(digest(password),digest(env.APP_PASSWORD)))return new Response('Reviewer access required.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Nyaya reviewer demo", charset="UTF-8"','Cache-Control':'no-store','Vary':'Authorization'}});
 return null;
}
