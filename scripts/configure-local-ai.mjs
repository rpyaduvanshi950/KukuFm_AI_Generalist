import {writeFileSync} from 'node:fs';
import {execSync} from 'node:child_process';
if(process.stdin.isTTY)execSync('stty -echo',{stdio:'inherit'});
process.stdout.write('Enter local test credential on hidden stdin.\n');
let key='';for await(const chunk of process.stdin){key+=chunk;if(key.includes('\n'))break}
key=key.trim();if(!key||/[\r\n]/.test(key))throw new Error('Invalid credential');
writeFileSync('.dev.vars',`AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai\nAI_MODEL=gemini-3.5-flash-lite\nAI_API_KEY=${key}\n`,{mode:0o600});console.log('Local server configuration saved in ignored .dev.vars.');
