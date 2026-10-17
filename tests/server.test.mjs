import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const operator='integration-test-operator-key-123';
test('operator auth, upload, byte-range replay, sharing, revocation and expiry',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'tournamentcam-test-'));const port=18347;
 const child=spawn(process.execPath,[resolve('server/index.mjs')],{cwd:directory,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',OPERATOR_KEY:operator,PUBLIC_ORIGIN:`http://127.0.0.1:${port}`},stdio:['ignore','pipe','pipe'],windowsHide:true});
 const base=`http://127.0.0.1:${port}`;let output='';child.stderr.on('data',x=>output+=x);
 try {
 await new Promise((done,reject)=>{const timeout=setTimeout(()=>reject(Error('Server did not start: '+output)),10000);child.stdout.on('data',()=>{clearTimeout(timeout);done();});child.on('error',reject);});
 const api=(url,options={})=>fetch(base+(url.startsWith('/api')?url:'/api'+url),{...options,headers:{'x-operator-key':operator,...options.headers}});
 assert.equal((await fetch(base+'/api/matches')).status,401);
 assert.equal((await api('/api/health')).status,200);
 assert.equal((await api('/recordings/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({court:17})})).status,400);
 assert.equal((await api('/matches',{method:'POST',headers:{Origin:'https://untrusted.invalid'}})).status,403);
 const f=new FormData();f.append('metadata',JSON.stringify({court:1,title:'Integration match',duration:12,marks:[{time:4,label:'Rally'}],score:'11–9'}));
 // Container-header fixture tests upload/range transport, not video decodability.
 const bytes=new Uint8Array(128);bytes.set([0x1a,0x45,0xdf,0xa3]);f.append('video',new Blob([bytes],{type:'video/webm'}),'fixture.webm');
 const upload=await api('/matches',{method:'POST',body:f});assert.equal(upload.status,201);const {id}=await upload.json();
 const list=await (await api('/matches')).json();assert.equal(list.length,1);assert.equal(list[0].status,'ready');assert.equal(list[0].file,undefined);
 const play=await (await api('/matches/'+id+'/play')).json();const range=await fetch(base+play.url,{headers:{Range:'bytes=0-3'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,4);
 const shared=await (await api('/matches/'+id+'/share',{method:'POST'})).json();assert.equal((await fetch(shared.url)).status,200);assert.match(await (await fetch(shared.url)).text(),/Integration match/);
 assert.equal((await api('/matches/'+id+'/share',{method:'DELETE'})).status,200);assert.equal((await fetch(shared.url)).status,404);
 assert.equal((await fetch(base+'/media/invalid')).status,404);
 assert.equal((await api('/matches/missing/play')).status,404);
 const expired=await (await api('/matches/'+id+'/share',{method:'POST'})).json();child.kill();await new Promise(r=>child.once('exit',r));
 const dbPath=join(directory,'data','matches.json');const db=JSON.parse(readFileSync(dbPath,'utf8'));db.links.forEach(l=>l.expires=Date.now()-1);writeFileSync(dbPath,JSON.stringify(db));
 const again=spawn(process.execPath,[resolve('server/index.mjs')],{cwd:directory,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',OPERATOR_KEY:operator},stdio:['ignore','pipe','pipe'],windowsHide:true});
 try{await new Promise((done,reject)=>{again.stdout.once('data',done);again.once('error',reject);});assert.equal((await fetch(expired.url)).status,404);assert.equal((await api('/matches')).status,200);}finally{again.kill();}
 }finally{child.kill();}
});

