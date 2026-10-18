import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {scryptSync} from 'node:crypto';
const operator='integration-test-operator-key-123';
process.env.ACCESS_PASSWORD_HASH='test-salt:'+scryptSync(operator,'test-salt',64).toString('hex');
test('operator auth, upload, byte-range replay, sharing, revocation and expiry',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'tournamentcam-test-'));const port=18347;
 const child=spawn(process.execPath,[resolve('server/index.mjs')],{cwd:directory,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',OPERATOR_KEY:operator,PUBLIC_ORIGIN:`http://127.0.0.1:${port}`},stdio:['ignore','pipe','pipe'],windowsHide:true});
 const base=`http://127.0.0.1:${port}`;let output='';child.stderr.on('data',x=>output+=x);
 try {
 await new Promise((done,reject)=>{const timeout=setTimeout(()=>reject(Error('Server did not start: '+output)),10000);child.stdout.on('data',()=>{clearTimeout(timeout);done();});child.on('error',reject);});
 let cookie='';
 const login=async()=>{const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:operator})});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly/);};
 const api=(url,options={})=>fetch(base+(url.startsWith('/api')?url:'/api'+url),{...options,headers:{Cookie:cookie,...options.headers}});
 assert.equal((await fetch(base+'/api/matches')).status,401);
 assert.equal((await fetch(base+'/test-api/nvr/settings')).status,200);
 assert.equal((await fetch(base+'/test-api/matches')).status,200);
 assert.equal((await fetch(base+'/test-api/matches',{method:'POST'})).status,403);
 assert.equal((await fetch(base+'/app')).status,401);
 assert.equal((await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'wrong'})})).status,401);
 await login();
 assert.equal((await api('/api/health')).status,200);
 assert.equal((await api('/nvr/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:'rtsp://bad',port:554,username:'test',password:'secret',subtype:0})})).status,400);
 assert.equal((await api('/nvr/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:'192.168.1.108',port:554,username:'test',password:'secret',subtype:0})})).status,200);
 const settings=await (await api('/nvr/settings')).json();assert.equal(settings.hasPassword,true);assert.equal(settings.password,undefined);
 assert.equal((await api('/nvr/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({channel:17})})).status,400);
 assert.equal((await api('/recordings/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({court:17})})).status,400);
 assert.equal((await api('/matches',{method:'POST',headers:{Origin:'https://untrusted.invalid'}})).status,403);
 const f=new FormData();f.append('metadata',JSON.stringify({court:1,title:'Integration match',duration:12,marks:[{time:4,label:'Rally'}],score:'11–9'}));
 // Container-header fixture tests upload/range transport, not video decodability.
 const bytes=new Uint8Array(128);bytes.set([0x1a,0x45,0xdf,0xa3]);f.append('video',new Blob([bytes],{type:'video/webm'}),'fixture.webm');
 const upload=await api('/matches',{method:'POST',body:f});assert.equal(upload.status,201);const {id}=await upload.json();
 const list=await (await api('/matches')).json();assert.equal(list.length,1);assert.equal(list[0].status,'ready');assert.equal(list[0].file,undefined);
 assert.deepEqual(await (await fetch(base+'/test-api/matches')).json(),[]);
 assert.equal((await fetch(base+'/test-api/matches/'+id+'/play')).status,404);
 assert.equal((await fetch(base+'/test-api/matches/'+id+'/share',{method:'POST'})).status,403);
 assert.equal((await fetch(base+'/test-api/recordings/'+id+'/stop',{method:'POST'})).status,404);
 const play=await (await api('/matches/'+id+'/play')).json();const range=await fetch(base+play.url,{headers:{Range:'bytes=0-3'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,4);
 const shared=await (await api('/matches/'+id+'/share',{method:'POST'})).json();assert.equal((await fetch(shared.url)).status,200);assert.match(await (await fetch(shared.url)).text(),/Integration match/);
 assert.equal((await api('/matches/'+id+'/share',{method:'DELETE'})).status,200);assert.equal((await fetch(shared.url)).status,404);
 assert.equal((await fetch(base+'/media/invalid')).status,404);
 assert.equal((await api('/matches/missing/play')).status,404);
 const expired=await (await api('/matches/'+id+'/share',{method:'POST'})).json();child.kill();await new Promise(r=>child.once('exit',r));
 const dbPath=join(directory,'data','matches.json');const db=JSON.parse(readFileSync(dbPath,'utf8'));db.links.forEach(l=>l.expires=Date.now()-1);writeFileSync(dbPath,JSON.stringify(db));
 const again=spawn(process.execPath,[resolve('server/index.mjs')],{cwd:directory,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',OPERATOR_KEY:operator},stdio:['ignore','pipe','pipe'],windowsHide:true});
 try{await new Promise((done,reject)=>{again.stdout.once('data',done);again.once('error',reject);});assert.equal((await fetch(expired.url)).status,404);assert.equal((await api('/matches')).status,401);await login();assert.equal((await api('/matches')).status,200);await fetch(base+'/auth/logout',{method:'POST',headers:{Cookie:cookie}});assert.equal((await api('/matches')).status,401);}finally{again.kill();}
 }finally{child.kill();}
});

