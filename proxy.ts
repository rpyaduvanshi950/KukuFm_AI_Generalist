import {NextResponse,type NextRequest} from 'next/server';
import {accessResponse} from './lib/render-access.mjs';
export function proxy(request:NextRequest){
 const denied=accessResponse(request.headers);if(denied)return denied;
 const response=NextResponse.next();
 if(process.env.ACCESS_MODE!=='public'){response.headers.set('Cache-Control','private, no-store');response.headers.set('Vary','Authorization')}
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.mjs|api/health$).*)']};
