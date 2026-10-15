/* SPDX-License-Identifier: AGPL-3.0-only */
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../portal/source-link.js'),'utf8');
async function run(config,{fail=false}={}) {
 const nodes=Object.fromEntries(['source-status','source-action','source-link','source-ref'].map(id=>[id,{hidden:id==='source-action',textContent:'A CONFIRMAR',href:''}]));
 const context={document:{getElementById:id=>nodes[id]},URL,AbortController,setTimeout,clearTimeout,fetch:()=>fail?Promise.reject(new Error('offline')):Promise.resolve({ok:true,json:()=>Promise.resolve(config)})};
 vm.runInNewContext(code,context);await new Promise(resolve=>setImmediate(resolve));return nodes;
}
(async()=>{
 let n=await run({repositoryUrl:null,repositoryRef:null});assert.equal(n['source-action'].hidden,true);
 n=await run({repositoryUrl:'https://example.invalid/source',repositoryRef:'a'.repeat(40),correspondingSourceReviewed:true,reconstructionVerified:true,userAccessVerified:true});assert.equal(n['source-status'].hidden,true);assert.equal(n['source-link'].href,'https://example.invalid/source/tree/'+'a'.repeat(40));assert.equal(n['source-action'].hidden,false);
 n=await run({repositoryUrl:'https://example.invalid/source',repositoryRef:'a'.repeat(40),correspondingSourceReviewed:true,reconstructionVerified:false,userAccessVerified:false});assert.equal(n['source-action'].hidden,false);
 n=await run({repositoryUrl:'https://example.invalid/source',repositoryRef:'a'.repeat(40),correspondingSourceReviewed:false});assert.equal(n['source-action'].hidden,true);assert.match(n['source-status'].textContent,/aguarda revisão/);
 n=await run({repositoryUrl:'javascript:void(0)',repositoryRef:'a'.repeat(40)});assert.equal(n['source-action'].hidden,true);
 const url=new URL('https://example.invalid/source');url.username='usuario-de-teste';url.password='valor-ficticio';
 n=await run({repositoryUrl:url.href,repositoryRef:'a'.repeat(40)});assert.equal(n['source-action'].hidden,true);
 n=await run({repositoryUrl:'https://example.invalid/source',repositoryRef:'main'});assert.equal(n['source-action'].hidden,true);
 n=await run({}, {fail:true});assert.equal(n['source-action'].hidden,true);assert.match(n['source-status'].textContent,/Não foi possível/);
 console.log('PASS: 8 cenários do link de código; oferta independente da validação completa da reconstrução.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
