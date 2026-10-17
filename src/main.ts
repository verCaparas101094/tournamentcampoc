import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { initialScore, rally } from './scoring.mjs';

interface Match { id:string; title:string; court:number; created:string; duration:number; source:string; status:string; marks:{time:number;label:string}[]; score:string; }
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./app.html'})
class App {
 preview?:ElementRef<HTMLVideoElement>;
 @ViewChild('preview') set previewElement(value:ElementRef<HTMLVideoElement>|undefined){this.preview=value;if(value&&this.stream){value.nativeElement.srcObject=this.stream;void value.nativeElement.play().catch(()=>{});}}
 @ViewChild('player') player?:ElementRef<HTMLVideoElement>;
 page='Record'; tabs=['Record','Match library','Camera setup','Guide']; title='Evening doubles'; court=1; source='browser'; doubles=true; target=11;
 teams=['Home team','Away team']; score:any=initialScore(); history:any[]=[]; matches=signal<Match[]>([]); active=signal(false); busy=signal(false); elapsed=signal(0); message=signal(''); connected=signal(false); configured=signal(false); guide=false;
 selected=signal<Match|null>(null); playback=signal(''); search=''; filter='all'; marks:{time:number;label:string}[]=[]; key=sessionStorage.getItem('operator-key')||''; shareUrl=signal('');
 stream?:MediaStream; recorder?:MediaRecorder; chunks:Blob[]=[]; timer:any; started=0; nvrId=''; pending?:Blob; pendingMetadata:any;
 constructor(){this.refresh(); window.addEventListener('beforeunload',e=>{if(this.active()||this.pending){e.preventDefault();e.returnValue='';}});}
 headers(){return {'x-operator-key':this.key};}
 async api(path:string,options:RequestInit={}){const r=await fetch('/api'+path,{...options,headers:{...this.headers(),...options.headers}}); if(!r.ok){let e:any;try{e=await r.json();}catch{}throw Error(e?.error||`Server request failed (${r.status})`);} return r.json();}
 async refresh(){try{const h=await this.api('/health');this.connected.set(true);this.configured.set(h.nvr);this.matches.set(await this.api('/matches'));}catch(e){this.connected.set(false);}}
 saveKey(){sessionStorage.setItem('operator-key',this.key);this.refresh();this.message.set('Operator key saved for this browser session.');}
 async camera(){try{this.stream?.getTracks().forEach(t=>t.stop());this.stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1920},height:{ideal:1080}},audio:false});if(this.preview){this.preview.nativeElement.srcObject=this.stream;await this.preview.nativeElement.play();}this.message.set('Camera ready. Check all four court corners before recording.');}catch(e){this.error(e);}}
 async start(){this.busy.set(true);try{if(this.pending)throw Error('Save or download the pending recording first.');this.marks=[];this.elapsed.set(0);
 if(this.source==='browser'){if(!this.stream)await this.camera();if(!this.stream)throw Error('Camera permission is required.'); const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(x=>MediaRecorder.isTypeSupported(x));this.chunks=[];this.recorder=new MediaRecorder(this.stream,mime?{mimeType:mime}:undefined);this.recorder.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data);};this.recorder.onerror=()=>this.message.set('Camera recording error. Stop recording to recover available footage.');this.recorder.start(1000);
 }else{const r=await this.api('/recordings/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(this.metadata())});this.nvrId=r.id;}
 this.started=Date.now();this.active.set(true);this.timer=setInterval(()=>this.elapsed.set(Math.floor((Date.now()-this.started)/1000)),500);this.message.set('Recording started. Keep this tab open for browser recordings.');}catch(e){this.error(e);}finally{this.busy.set(false);}}
 async stop(){this.busy.set(true);try{if(this.source==='browser'){if(this.recorder!.state!=='inactive')await new Promise<void>(resolve=>{this.recorder!.onstop=()=>resolve();this.recorder!.stop();});this.pending=new Blob(this.chunks,{type:this.recorder!.mimeType});this.pendingMetadata=structuredClone(this.metadata());this.active.set(false);clearInterval(this.timer);await this.savePending();}else{await this.api('/recordings/'+this.nvrId+'/stop',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(this.metadata())});this.active.set(false);clearInterval(this.timer);this.message.set('Match saved. Open the library to replay.');await this.refresh();}}catch(e){this.error(e);}finally{this.busy.set(false);}}
 metadata(){return {title:this.title.trim()||'Untitled match',court:this.court,source:this.source,duration:this.elapsed(),marks:this.marks,score:this.score.points.join('–')};}
 async savePending(){if(!this.pending)return;try{const f=new FormData();f.append('metadata',JSON.stringify(this.pendingMetadata));f.append('video',this.pending,this.pending.type.includes('mp4')?'match.mp4':'match.webm');await this.api('/matches',{method:'POST',body:f});this.pending=undefined;this.chunks=[];this.message.set('Match saved. Ready to replay and share.');await this.refresh();}catch(e){this.message.set('Upload failed. Your recording is still in this tab. Retry saving or download it before leaving.');}}
 async stopSaved(m:Match){try{await this.api('/recordings/'+m.id+'/stop',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(m)});if(m.id===this.nvrId){this.active.set(false);clearInterval(this.timer);}await this.refresh();this.message.set('NVR recording finalized.');}catch(e){this.error(e);}}
 downloadPending(){if(this.pending)this.downloadBlob(this.pending,'match.'+(this.pending.type.includes('mp4')?'mp4':'webm'));}
 downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 point(team:number){this.history.push(structuredClone(this.score));this.score=rally(this.score,team,this.target,this.doubles);if(this.active())this.mark('Score '+this.score.points.join('–'));}
 undo(){if(this.history.length)this.score=this.history.pop();}
 reset(){this.score=initialScore(this.doubles);this.history=[];}
 mark(label='Great rally'){this.marks.push({time:this.elapsed(),label});this.message.set('Moment marked at '+this.time(this.elapsed()));}
 time(n:number){return `${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;}
 filtered(){return this.matches().filter(m=>(this.filter==='all'||String(m.court)===this.filter)&&m.title.toLowerCase().includes(this.search.toLowerCase()));}
 async watch(m:Match){try{this.shareUrl.set('');const r=await this.api('/matches/'+m.id+'/play');this.selected.set(m);this.playback.set(r.url);}catch(e){this.error(e);}}
 seek(time:number){if(this.player)this.player.nativeElement.currentTime=time;}
 async download(m:Match){try{const r=await this.api('/matches/'+m.id+'/play');const response=await fetch(r.url);if(!response.ok)throw Error('Download failed');this.downloadBlob(await response.blob(),m.title+(m.source==='browser-webm'?'.webm':'.mp4'));}catch(e){this.error(e);}}
 async share(m:Match){try{const r=await this.api('/matches/'+m.id+'/share',{method:'POST'});this.shareUrl.set(r.url);this.message.set('Share link created. It expires in 14 days; anyone with the link can watch.');}catch(e){this.error(e);}}
 async copy(){try{await navigator.clipboard.writeText(this.shareUrl());this.message.set('Link copied.');}catch{this.message.set('Select and copy the displayed link.');}}
 async revoke(m:Match){try{await this.api('/matches/'+m.id+'/share',{method:'DELETE'});this.shareUrl.set('');this.message.set('All shared links for this match revoked.');}catch(e){this.error(e);}}
 error(e:unknown){this.message.set(e instanceof Error?e.message:String(e));}
}
bootstrapApplication(App,{providers:[provideServiceWorker('ngsw-worker.js',{enabled:location.port!=='4200',registrationStrategy:'registerWhenStable:30000'})]}).catch(console.error);
