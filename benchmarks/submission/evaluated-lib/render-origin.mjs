export function requestOriginAllowed(request,env=process.env){
 const supplied=request.headers.get('origin');if(!supplied)return true;
 try{return supplied===new URL(env.APP_ORIGIN||env.RENDER_EXTERNAL_URL||request.url).origin}catch{return false}
}
