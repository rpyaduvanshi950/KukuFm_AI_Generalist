import {spawn} from 'node:child_process';
import {existsSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {createDatabase} from '../lib/postgres.mjs';
import {migrateDatabase} from '../scripts/migrate-render.mjs';
if(!process.env.TEST_DATABASE_URL)throw Error('Start with scripts/test-postgres-local.mjs --audit-preview');
const stop='/tmp/nyaya-audit-preview-stop';if(existsSync(stop))rmSync(stop);
const fixture=fileURLToPath(new URL('./audit-provider-fixture.mjs',import.meta.url));
const db=createDatabase(process.env.TEST_DATABASE_URL);try{await migrateDatabase(db)}finally{await db.end()}
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','5185'],{stdio:'inherit',env:{...process.env,NODE_OPTIONS:'--import='+fixture,PORT:'5185',NEXT_TELEMETRY_DISABLED:'1',DATABASE_URL:process.env.TEST_DATABASE_URL,AI_API_KEY:'synthetic-fixture-not-a-real-key',AI_BASE_URL:'https://api.openai.com/v1',AI_MODEL:'gpt-5.4-mini-2026-03-17',APP_ORIGIN:'http://127.0.0.1:5185'}});
const timer=setInterval(()=>{if(existsSync(stop)){clearInterval(timer);child.kill('SIGTERM')}},500);
const deadline=setTimeout(()=>child.kill('SIGTERM'),1800000);
try{await once(child,'exit')}finally{clearInterval(timer);clearTimeout(deadline);if(existsSync(stop))rmSync(stop)}
