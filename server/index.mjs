import express from 'express';
import multer from 'multer';
import {mkdirSync,existsSync,readFileSync,writeFileSync,renameSync,unlinkSync,statSync,openSync,readSync,closeSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {access} from './access.mjs';
import {nvrSetup,ffmpegPath,nvrUrl} from './nvr-setup.mjs';
const app=express(), root=resolve('data'), media=join(root,'media');mkdirSync(media,{recursive:true});
const dbFile=join(root,'matches.json');const db=existsSync(dbFile)?JSON.parse(readFileSync(dbFile,'utf8')):{matches:[],links:[]};
function save(){writeFileSync(dbFile+'.tmp',JSON.stringify(db,null,2));renameSync(dbFile+'.tmp',dbFile);}
for(const m of db.matches)if(m.status==='recording'){m.status='interrupted';}save();
const jobs=new Map();const key=process.env.OPERATOR_KEY||'';const host=process.env.HOST||(process.env.RENDER?'0.0.0.0':'127.0.0.1');
if(!['127.0.0.1','localhost','::1'].includes(host)&&!process.env.ACCESS_PASSWORD_HASH&&!process.env.ACCESS_PASSWORD)throw Error('Configure ACCESS_PASSWORD or ACCESS_PASSWORD_HASH before using a network bind address.');
function equal(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);}
app.disable('x-powered-by');app.use(express.json({limit:'128kb'}));
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','no-referrer');res.set('Cache-Control','no-store');if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.headers.host}`&&req.headers.origin!==process.env.PUBLIC_ORIGIN&&req.headers.origin!=='http://localhost:4200'){return res.status(403).json({error:'Origin not allowed'});}next();});
const guard=access(app);
// Public tester exposes only this explicit subset; the full API stays private.
app.use((req,res,next)=>{
 if(!req.path.startsWith('/test-api/'))return next();
 const route=req.path.slice('/test-api'.length);
 const allowed=(req.method==='GET'&&(/^\/nvr\/settings$|^\/matches$|^\/matches\/[a-f0-9-]+\/play$/.test(route)))||(req.method==='POST'&&(/^\/nvr\/(settings|test)$|^\/recordings\/start$|^\/recordings\/[a-f0-9-]+\/stop$/.test(route)));
 if(!allowed)return res.status(403).json({error:'This feature is not available in camera testing.'});
 req.testAccess=true;req.url='/api'+req.url.slice('/test-api'.length);next();
});
app.use('/api',(req,res,next)=>req.testAccess?next():guard(req,res,next));
nvrSetup(app,jobs);
app.get('/api/health',(req,res)=>res.json({ok:true,nvr:!!(process.env.NVR_HOST&&process.env.NVR_USER&&process.env.NVR_PASSWORD)}));
app.get('/api/matches',(req,res)=>res.json(db.matches.filter(m=>!req.testAccess||m.testOnly===true).map(({file,...m})=>m).reverse()));
function metadata(input){if(!input||typeof input!=='object')throw Error('Invalid match metadata');const court=Number(input.court);if(!Number.isInteger(court)||court<1||court>16)throw Error('Choose a channel from 1 to 16');return {title:String(input.title||'Untitled match').slice(0,100),court,duration:Math.max(0,Math.min(Number(input.duration)||0,86400)),score:String(input.score||'').slice(0,20),marks:(Array.isArray(input.marks)?input.marks:[]).slice(0,5000).filter(x=>Number.isFinite(x.time)&&x.time>=0).map(x=>({time:x.time,label:String(x.label||'Moment').slice(0,100)}))};}
const upload=multer({dest:media,limits:{fileSize:2*1024*1024*1024,files:1,fields:1},fileFilter:(req,file,cb)=>cb(null,['video/webm','video/mp4'].includes(file.mimetype))});
app.post('/api/matches',upload.single('video'),(req,res)=>{let file=req.file;try{if(!file)throw Error('A WebM or MP4 recording is required');const m=metadata(JSON.parse(req.body.metadata));const header=Buffer.alloc(12);const fd=openSync(file.path,'r');try{readSync(fd,header,0,12,0);}finally{closeSync(fd);}const webm=header.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));const mp4=header.toString('ascii',4,8)==='ftyp';if(!webm&&!mp4)throw Error('Invalid video file');const id=randomUUID(),name=id+(webm?'.webm':'.mp4');renameSync(file.path,join(media,name));db.matches.push({...m,id,file:name,source:webm?'browser-webm':'browser-mp4',created:new Date().toISOString(),status:'ready'});save();res.status(201).json({id});}catch(e){if(file&&existsSync(file.path))unlinkSync(file.path);res.status(400).json({error:e.message});}});
app.post('/api/recordings/start',async(req,res)=>{try{const m=metadata(req.body);if(!process.env.NVR_HOST||!process.env.NVR_USER||!process.env.NVR_PASSWORD)throw Error('Configure NVR credentials on the server first.');if(jobs.size)throw Error('Stop the current test recording first.');const id=randomUUID(),file=id+'.mp4';
 const child=spawn(ffmpegPath(),['-hide_banner','-loglevel','error','-rtsp_transport','tcp','-rw_timeout','15000000','-i',nvrUrl(m.court),'-map','0:v:0','-an','-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+frag_keyframe+empty_moov','-t','14400',join(media,file)],{stdio:['pipe','ignore','pipe'],windowsHide:true});
 child.stderr.on('data',()=>{});const record={...m,id,file,source:'nvr',testOnly:!!req.testAccess,created:new Date().toISOString(),status:'recording'};let failed=false;
 child.on('error',()=>{failed=true;record.status='failed';jobs.delete(id);save();});child.on('exit',code=>{jobs.delete(id);if(record.status==='recording'){record.duration=Math.floor((Date.now()-Date.parse(record.created))/1000);record.status=(code===0&&existsSync(join(media,file))&&statSync(join(media,file)).size>1000)?'ready':'failed';save();}});
 child.stdin.on('error',()=>{});db.matches.push(record);jobs.set(id,{child,court:m.court});save();await new Promise(r=>setTimeout(r,1200));if(failed||child.exitCode!==null)throw Error('Camera connection failed. Check FFmpeg installation, NVR credentials, channel and RTSP reachability.');res.status(201).json({id});
 }catch(e){res.status(400).json({error:e.message});}});
app.post('/api/recordings/:id/stop',async(req,res)=>{const m=db.matches.find(m=>m.id===req.params.id),j=jobs.get(req.params.id);if(!m||(req.testAccess&&!m.testOnly))return res.status(404).json({error:'Recording not found'});if(!j){if(m.status==='ready')return res.json({id:m.id});return res.status(409).json({error:'Recording is no longer running; check the match library.'});}try{const meta=metadata(req.body);Object.assign(m,{marks:meta.marks,score:meta.score,title:meta.title});await new Promise((done,reject)=>{const t=setTimeout(()=>reject(Error('Still finalizing. Retry shortly.')),20000);j.child.once('exit',()=>{clearTimeout(t);done();});j.child.stdin.write('q\n');});if(m.status!=='ready')throw Error('Recording failed; inspect NVR connectivity and disk space.');save();res.json({id:m.id});}catch(e){res.status(409).json({error:e.message});}});
function findReady(req,res){const m=db.matches.find(m=>m.id===req.params.id&&m.status==='ready'&&(!req.testAccess||m.testOnly===true));if(!m){res.status(404).json({error:'Saved recording not found'});return null;}return m;}
function link(m,days,kind){const token=randomBytes(32).toString('hex');db.links=db.links.filter(l=>l.expires>Date.now());db.links.push({token,id:m.id,kind,expires:Date.now()+days*86400000});save();return token;}
app.get('/api/matches/:id/play',(req,res)=>{const m=findReady(req,res);if(m)res.json({url:'/media/'+link(m,1/24,'play')});});
app.post('/api/matches/:id/share',(req,res)=>{const m=findReady(req,res);if(m){const token=link(m,14,'share');res.json({url:(process.env.PUBLIC_ORIGIN||'http://localhost:3000').replace(/\/$/,'')+'/watch/'+token,expiresInDays:14});}});
app.delete('/api/matches/:id/share',(req,res)=>{db.links=db.links.filter(l=>!(l.id===req.params.id&&l.kind==='share'));save();res.json({ok:true});});
function valid(token){const l=db.links.find(l=>l.token===token&&l.expires>Date.now());return l&&db.matches.find(m=>m.id===l.id&&m.status==='ready');}
app.get('/media/:token',(req,res)=>{const m=valid(req.params.token);if(!m)return res.status(404).send('This recording link has expired or was revoked.');res.sendFile(join(media,m.file));});
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
app.get('/watch/:token',(req,res)=>{const token=req.params.token;const m=valid(token);if(!m)return res.status(404).send('This link has expired or was revoked. Ask the match owner for a new link.');res.set('Content-Security-Policy',"default-src 'none'; media-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");res.send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(m.title)} | TournamentCam</title><style>body{margin:0;background:#102d25;color:#eef5e8;font:16px system-ui}main{max-width:960px;margin:auto;padding:40px 20px}small{color:#cbf481;letter-spacing:3px}h1{font-size:clamp(32px,7vw,64px)}video{width:100%;background:#000;border-radius:12px}a{display:inline-block;background:#cbf481;color:#163726;padding:16px 24px;border-radius:6px;text-decoration:none}p{line-height:1.7;color:#afc5b6}</style><main><small>TOURNAMENTCAM / MATCH RECAP</small><h1>Your game is ready.</h1><h2>${escape(m.title)}</h2><video controls playsinline src="/media/${token}"></video><p>Court ${m.court} · ${escape(m.created.slice(0,10))} · Final score ${escape(m.score)}</p><a href="/media/${token}" download="match${m.file.endsWith('.webm')?'.webm':'.mp4'}">Download your match ↓</a><p>This watch link expires 14 days after creation. Download to keep your own copy.</p></main></html>`);});
app.get('/',(req,res)=>res.redirect('/main-login'));
app.get('/main-login',(req,res)=>res.sendFile(resolve('server/main-login.html')));
app.get('/main-page',(req,res)=>res.redirect('/main-login'));
app.get('/nvr-test',(req,res)=>res.sendFile(resolve('server/tester.html')));
app.get('/nvr-manual',(req,res)=>res.type('text/plain').sendFile(resolve('docs/NVR-TEST-SETUP.md')));
app.get('/app',(req,res)=>guard(req,res,()=>res.sendFile(resolve('dist/tournament-cam/browser/index.html'))));
app.get('/index.html',(req,res)=>guard(req,res,()=>res.sendFile(resolve('dist/tournament-cam/browser/index.html'))));
const dist=resolve('dist/tournament-cam/browser');if(existsSync(dist)){app.use(express.static(dist,{index:false}));app.get('/{*path}',(req,res)=>res.redirect('/nvr-test'));}
app.use((err,req,res,next)=>res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'Recording exceeds the 2 GB upload limit. Download the local backup.':'Request failed. Check the uploaded file and available disk space.'}));
const server=app.listen(Number(process.env.PORT)||3000,host,()=>console.log(`TournamentCam server ready on ${host}:${process.env.PORT||3000}`));
function shutdown(){for(const j of jobs.values())j.child.stdin.write('q\n');server.close();setTimeout(()=>process.exit(0),5000).unref();}process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);

