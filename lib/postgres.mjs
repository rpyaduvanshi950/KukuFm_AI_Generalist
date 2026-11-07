import pg from 'pg';
let pool;
export function createDatabase(connectionString){
 if(!connectionString)throw Error('database_not_configured');
 const db=new pg.Pool({connectionString,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000,statement_timeout:5000});
 db.on('error',()=>console.error(JSON.stringify({event:'database_pool_error'})));
 return db;
}
export function getDatabase(){
 if(!process.env.DATABASE_URL)return null;
 return pool||(pool=createDatabase(process.env.DATABASE_URL));
}
