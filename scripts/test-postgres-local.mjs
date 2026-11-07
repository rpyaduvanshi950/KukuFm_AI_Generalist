import {mkdtempSync,mkdirSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const bin=process.env.POSTGRES_BIN||'/usr/lib/postgresql/16/bin';
if(!existsSync(join(bin,'initdb')))throw Error('Set POSTGRES_BIN, or run test:postgres against TEST_DATABASE_URL.');
const root=mkdtempSync(join(tmpdir(),'nyaya-render-pg-')),data=join(root,'data'),socket=join(root,'socket');mkdirSync(socket,{mode:0o700});
const run=(name,args)=>{const r=spawnSync(join(bin,name),args,{encoding:'utf8'});if(r.status!==0)throw Error(name+' failed: '+(r.stderr||r.stdout));};
let started=false;
try{
 run('initdb',['-D',data,'-U','postgres','-A','trust','--no-locale']);
 run('pg_ctl',['-D',data,'-l',join(root,'postgres.log'),'-o',`-h '' -k ${socket}`,'-w','start']);started=true;
 const url=new URL('postgresql://postgres@localhost/postgres');url.searchParams.set('host',socket);
 const result=spawnSync(process.execPath,process.argv.includes('--http')?['tests/render-http-smoke.mjs']:['tests/postgres-budget.test.mjs'],{stdio:'inherit',env:{...process.env,TEST_DATABASE_URL:url.toString()}});process.exitCode=result.status??1;
}finally{if(started)run('pg_ctl',['-D',data,'-m','fast','-w','stop']);rmSync(root,{recursive:true,force:true})}
