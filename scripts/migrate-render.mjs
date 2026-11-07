import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createDatabase} from '../lib/postgres.mjs';
export async function migrateDatabase(db){
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(76429103)');
  await client.query('CREATE TABLE IF NOT EXISTS nyaya_schema_migrations(name TEXT PRIMARY KEY,sha256 TEXT NOT NULL)');
  const dir=new URL('../migrations/',import.meta.url);
  for(const name of readdirSync(dir).filter(x=>/^\d+.*\.sql$/.test(x)).sort()){
   const sql=readFileSync(new URL(name,dir),'utf8'),hash=createHash('sha256').update(sql).digest('hex');
   const {rows}=await client.query('SELECT sha256 FROM nyaya_schema_migrations WHERE name=$1',[name]);
   if(rows[0]){if(rows[0].sha256!==hash)throw Error('applied_migration_changed');continue}
   await client.query(sql);await client.query('INSERT INTO nyaya_schema_migrations(name,sha256) VALUES($1,$2)',[name,hash]);
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let db;try{db=createDatabase(process.env.DATABASE_URL);await migrateDatabase(db);console.log('PostgreSQL migrations are current.')}catch(e){console.error('PostgreSQL migration failed ('+(e.code||'configuration_or_schema')+').');process.exitCode=1}finally{await db?.end()}
}
