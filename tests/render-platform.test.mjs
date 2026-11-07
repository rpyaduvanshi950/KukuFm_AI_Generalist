import test from 'node:test';
import assert from 'node:assert/strict';
import {requestOriginAllowed} from '../lib/render-origin.mjs';
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
