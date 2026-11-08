import type {NextConfig} from 'next';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
let revision='local';try{revision=execFileSync('git',['rev-parse','--short=12','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{}
const source=createHash('sha256');
function include(directory:string){for(const entry of readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const path=join(directory,entry.name);if(entry.isDirectory())include(path);else if(/\.(?:mjs|tsx?|css)$/.test(entry.name))source.update(path).update(readFileSync(path))}}
for(const directory of ['app','lib','components'])include(directory);
const nextConfig:NextConfig={poweredByHeader:false,experimental:{cpus:2},env:{NEXT_PUBLIC_BUILD_ID:`${revision}-source-${source.digest('hex').slice(0,12)}`}};
export default nextConfig;
