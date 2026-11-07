import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createDatabase} from '../lib/postgres.mjs';
import {migrateDatabase} from './migrate-render.mjs';
const port=process.env.PORT||'3000',mode=process.env.ACCESS_MODE||'protected';
if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw Error('PORT must be between 1 and 65535.');
if(!['protected','public'].includes(mode))throw Error('ACCESS_MODE must be protected or public.');
if(mode==='protected'&&(!process.env.APP_PASSWORD||process.env.APP_PASSWORD.length<16))throw Error('Set APP_PASSWORD to at least 16 characters, or explicitly choose ACCESS_MODE=public.');
if(process.env.AI_API_KEY&&(process.env.AI_BASE_URL!=='https://api.openai.com/v1'||!/^gpt-5\.4-mini(?:-2026-03-17)?$/.test(process.env.AI_MODEL||'')))throw Error('Set the supported AI_BASE_URL and AI_MODEL from .env.example; other model pricing is not configured.');
if(process.env.AI_API_KEY&&!process.env.DATABASE_URL)throw Error('DATABASE_URL is required before enabling paid AI.');
if(process.env.DATABASE_URL){let db;try{db=createDatabase(process.env.DATABASE_URL);await migrateDatabase(db)}catch{console.error('PostgreSQL migration failed. The server was not started.');process.exit(1)}finally{await db?.end()}}
let childFinished=false;
const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),'start','--hostname','0.0.0.0','--port',port],{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('error',()=>{childFinished=true;console.error('Could not start the Next.js server.');process.exitCode=1});
child.on('exit',(code,signal)=>{childFinished=true;process.exitCode=code??(signal?1:0)});

// A local self-check separates app readiness from Render routing/health settings.
// Only paths/statuses are logged; never credentials, bodies or connection URLs.
async function startupChecks(){
 const deadline=Date.now()+60000;let previous=null;
 while(Date.now()<deadline&&!childFinished){
  try{
   const response=await fetch('http://127.0.0.1:'+port+'/api/health',{signal:AbortSignal.timeout(2500),redirect:'manual'});
   const status=response.status;await response.body?.cancel();
   if(status!==previous){console.log(JSON.stringify({event:'startup_probe',path:'/api/health',status}));previous=status}
   if(status===200){
    const root=await fetch('http://127.0.0.1:'+port+'/',{signal:AbortSignal.timeout(2500),redirect:'manual'});
    console.log(JSON.stringify({event:'startup_probe',path:'/',status:root.status}));await root.body?.cancel();return;
   }
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 if(!childFinished)console.error(JSON.stringify({event:'startup_probe_timeout',path:'/api/health',lastStatus:previous}));
}
void startupChecks();
