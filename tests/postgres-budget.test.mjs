import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDatabase} from '../lib/postgres.mjs';
import {reserveBudget,settleBudget,readBudget} from '../lib/budget-postgres.mjs';
import {migrateDatabase} from '../scripts/migrate-render.mjs';
if(!process.env.TEST_DATABASE_URL)throw Error('Set TEST_DATABASE_URL to an isolated test PostgreSQL database, or use npm run test:postgres:local.');
const schema='nyaya_test_'+randomUUID().replaceAll('-',''),url=new URL(process.env.TEST_DATABASE_URL);
let admin,db;const now=new Date('2026-11-07T12:00:00Z');
before(async()=>{
 admin=createDatabase(url.toString());await admin.query('CREATE SCHEMA '+schema);
 url.searchParams.set('options','-c search_path='+schema);db=createDatabase(url.toString());await migrateDatabase(db);
});
after(async()=>{await db?.end();if(admin){await admin.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');await admin.end()}});
beforeEach(async()=>await db.query('TRUNCATE ai_reservations,ai_rate_limit,ai_budget'));
test('migrations re-run and serialize safely without rewriting an applied schema',async()=>{
 await Promise.all([migrateDatabase(db),migrateDatabase(db)]);
 assert.equal((await db.query('SELECT * FROM nyaya_schema_migrations')).rows.length,1);
});
test('sixteen concurrent reservations cannot exceed the daily allowance',async()=>{
 const tickets=await Promise.all(Array.from({length:16},()=>reserveBudget(db,50000,now)));
 assert.equal(tickets.filter(Boolean).length,10);const day=await readBudget(db,now);
 assert.equal(day.reserved_micros,500000);assert.equal(day.attempts,10);
 assert.equal((await db.query('SELECT * FROM ai_reservations')).rows.length,10);
});
test('the shared hourly limiter cannot be bypassed with another caller or connection',async()=>{
 const tickets=await Promise.all(Array.from({length:50},()=>reserveBudget(db,1000,now)));
 assert.equal(tickets.filter(Boolean).length,40);
 assert.ok(await reserveBudget(db,1000,new Date('2026-11-07T13:00:00Z')));
});
test('daily attempt ceiling survives multiple hourly windows and resets on a new UTC day',async()=>{
 let count=0;for(let hour=0;hour<3;hour++)for(let i=0;i<40;i++)if(await reserveBudget(db,100,new Date(`2026-11-07T${String(hour+1).padStart(2,'0')}:00:00Z`)))count++;
 assert.equal(count,100);assert.equal(await reserveBudget(db,100,new Date('2026-11-07T20:00:00Z')),null);
 assert.ok(await reserveBudget(db,100,new Date('2026-11-08T00:00:00Z')));
});
test('settlement reconciles reported usage exactly once using the stored amount',async()=>{
 const t=await reserveBudget(db,50000,now);await settleBudget(db,{...t,micros:1},{prompt_tokens:100,completion_tokens:100});
 assert.equal((await readBudget(db,now)).reserved_micros,525);
 await settleBudget(db,t,{prompt_tokens:0,completion_tokens:0},true);
 const day=await readBudget(db,now);assert.equal(day.reserved_micros,525);
 assert.equal((await db.query('SELECT failures FROM ai_budget')).rows[0].failures,0);
});
test('unknown or failed usage retains its reservation and increments failure only once',async()=>{
 const t=await reserveBudget(db,50000,now);await settleBudget(db,t,null,true);await settleBudget(db,t,null,true);
 assert.equal((await readBudget(db,now)).reserved_micros,50000);
 assert.equal((await db.query('SELECT failures FROM ai_budget')).rows[0].failures,1);
});
test('reservations survive a process-equivalent pool restart without a refund',async()=>{
 await reserveBudget(db,50000,now);await db.end();db=createDatabase(url.toString());
 assert.equal((await readBudget(db,now)).reserved_micros,50000);assert.equal((await readBudget(db,now)).attempts,1);
});
test('missing tracking or invalid reservations cannot enable a paid request',async()=>{
 assert.equal(await reserveBudget(null,1000,now),null);
 for(const value of [0,-1,1.5,NaN,Infinity,500001])assert.equal(await reserveBudget(db,value,now),null);
 assert.equal((await db.query('SELECT * FROM ai_budget')).rows.length,0);
});
test('changed applied migration hashes are rejected rather than silently reapplied',async()=>{
 const hash=(await db.query('SELECT sha256 FROM nyaya_schema_migrations')).rows[0].sha256;
 await db.query('UPDATE nyaya_schema_migrations SET sha256=$1',['bad-hash']);
 await assert.rejects(()=>migrateDatabase(db),/applied_migration_changed/);
 await db.query('UPDATE nyaya_schema_migrations SET sha256=$1',[hash]);
});
