import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function access(app) {
 // Allow a private hosting environment secret, converted to a salted hash at boot.
 if(!process.env.ACCESS_PASSWORD_HASH&&process.env.ACCESS_PASSWORD){const salt=randomBytes(16).toString('hex');process.env.ACCESS_PASSWORD_HASH=salt+':'+scryptSync(process.env.ACCESS_PASSWORD,salt,64).toString('hex');delete process.env.ACCESS_PASSWORD;}
 const sessions=new Map(), attempts=new Map();
 const configured=!!process.env.ACCESS_PASSWORD_HASH;
 const session=req=>{const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tc_session='))?.slice(11);return token&&sessions.get(token)>Date.now();};
 const guard=(req,res,next)=>{if(!configured)return res.status(503).json({error:'Server access password has not been configured.'});if(!session(req))return res.status(401).json({error:'Sign in with the access password.'});next();};
 app.post('/auth/login',(req,res)=>{const ip=req.socket.remoteAddress;const a=attempts.get(ip)||{count:0,until:Date.now()+600000};if(a.until<Date.now()){a.count=0;a.until=Date.now()+600000;}if(a.count>=10)return res.status(429).json({error:'Too many attempts. Try again in 10 minutes.'});a.count++;attempts.set(ip,a);let valid=false;try{const [salt,hash]=process.env.ACCESS_PASSWORD_HASH.split(':');const actual=scryptSync(String(req.body.password||''),salt,64);const expected=Buffer.from(hash,'hex');valid=expected.length===actual.length&&timingSafeEqual(actual,expected);}catch{}if(!valid)return res.status(401).json({error:'Incorrect access password.'});attempts.delete(ip);const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600000);for(const [k,v]of sessions)if(v<Date.now())sessions.delete(k);res.setHeader('Set-Cookie',`tc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);res.json({ok:true});});
 app.post('/auth/logout',(req,res)=>{const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tc_session='))?.slice(11);sessions.delete(token);res.setHeader('Set-Cookie','tc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');res.json({ok:true});});
 app.get('/auth/status',(req,res)=>res.json({authenticated:!!session(req)}));
 return guard;
}
