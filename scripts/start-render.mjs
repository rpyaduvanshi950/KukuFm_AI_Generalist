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
const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),'start','--hostname','0.0.0.0','--port',port],{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('error',()=>{console.error('Could not start the Next.js server.');process.exitCode=1});
child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0)});
