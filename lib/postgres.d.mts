export type Database={query:(sql:string,params?:unknown[])=>Promise<{rows:any[];rowCount:number|null}>;connect:()=>Promise<any>;end:()=>Promise<void>};
export function createDatabase(connectionString:string):Database;
export function getDatabase():Database|null;
