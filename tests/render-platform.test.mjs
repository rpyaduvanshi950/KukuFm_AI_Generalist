import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewerLanding} from '../lib/reviewer-page.mjs';
import {accessResponse} from '../lib/render-access.mjs';
import {requestOriginAllowed} from '../lib/render-origin.mjs';
const env={ACCESS_MODE:'protected',APP_PASSWORD:'synthetic-test-password-only'};
const auth=password=>new Headers({authorization:'Basic '+Buffer.from('reviewer:'+password).toString('base64')});
test('Render defaults fail closed when reviewer access is not configured',()=>{
 assert.equal(accessResponse(new Headers(),{}).status,503);
 assert.equal(accessResponse(new Headers(),{APP_PASSWORD:'short'}).status,503);
 assert.equal(accessResponse(new Headers(),{...env,ACCESS_MODE:'typo'}).status,503);
});
test('shared reviewer password gates access and is checked independently of username',()=>{
 assert.equal(accessResponse(new Headers(),env).status,401);
 assert.match(accessResponse(new Headers(),env).headers.get('WWW-Authenticate'),/^Basic/);
 assert.equal(accessResponse(auth('wrong-password'),env).status,401);
 assert.equal(accessResponse(auth(env.APP_PASSWORD),env),null);
 assert.equal(accessResponse(auth(env.APP_PASSWORD+':extra'),env).status,401);
});
test('malformed/oversized auth and forged Sites/Cloudflare headers cannot authenticate',()=>{
 for(const headers of [new Headers({authorization:'Bearer forged'}),new Headers({authorization:'Basic '+ 'A'.repeat(5000)}),new Headers({'oai-authenticated-user-id':'owner','cf-connecting-ip':'127.0.0.1'})])assert.equal(accessResponse(headers,env).status,401);
});
test('public mode requires an explicit operator choice',()=>assert.equal(accessResponse(new Headers(),{ACCESS_MODE:'public'}),null));
test('Render external HTTPS origin works behind the internal HTTP server',()=>{
 const req=origin=>new Request('http://localhost:3000/api/chat',{method:'POST',headers:{origin}});
 const env={RENDER_EXTERNAL_URL:'https://nyaya-example.onrender.com'};
 assert.equal(requestOriginAllowed(req(env.RENDER_EXTERNAL_URL),env),true);
 assert.equal(requestOriginAllowed(req('https://attacker.example'),env),false);
 assert.equal(requestOriginAllowed(req('https://nyaya-example.onrender.com.attacker.example'),env),false);
});
test('custom domain overrides Render default and malformed config fails closed',()=>{
 const req=new Request('http://localhost:3000/api/chat',{headers:{origin:'https://law.example'}});
 assert.equal(requestOriginAllowed(req,{APP_ORIGIN:'https://law.example',RENDER_EXTERNAL_URL:'https://old.onrender.com'}),true);
 assert.equal(requestOriginAllowed(req,{APP_ORIGIN:'not a url'}),false);
 assert.equal(requestOriginAllowed(new Request('http://localhost:5173/api/chat',{headers:{origin:'http://localhost:5173'}}),{}),true);
});

test('public reviewer landing contains no workspace and does not cache access state',async()=>{
 const page=reviewerLanding();assert.equal(page.status,200);assert.match(page.headers.get('cache-control'),/no-store/);assert.match(page.headers.get('Content-Security-Policy'),/default-src 'none'/);
 const html=await page.text();assert.match(html,/href="\/reviewer-login"/);assert.doesNotMatch(html,/Your workspace|AI_API_KEY|APP_PASSWORD/);
});
