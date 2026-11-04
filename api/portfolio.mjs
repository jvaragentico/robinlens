import {portfolio} from '../lib/providers.mjs';
const buckets=new Map();let active=0;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const url=new URL(req.url,'http://localhost'),address=url.searchParams.get('address')||'',chain=url.searchParams.get('chainId')||'4663',cursor=Number(url.searchParams.get('cursor')||0);
 if(!/^0x[0-9a-fA-F]{40}$/.test(address)||chain!=='4663'||!Number.isSafeInteger(cursor)||cursor<0||cursor>10000||cursor%24!==0)return res.status(400).json({error:'Enter a 20-byte EVM wallet address on Robinhood Chain (4663).'});
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];const now=Date.now();if(buckets.size>1000)for(const [key,b] of buckets)if(b.until<now)buckets.delete(key);const b=buckets.get(ip);if(active>=8||b&&b.until>now&&b.count>=120){res.setHeader('Retry-After','60');return res.status(429).json({error:'Request limit reached. Please retry in one minute.'});}buckets.set(ip,{count:b&&b.until>now?b.count+1:1,until:b&&b.until>now?b.until:now+60000});
 active++;try{return res.status(200).json(await portfolio(address,cursor));}catch{console.warn(JSON.stringify({event:'provider_failure',at:new Date().toISOString()}));return res.status(503).json({error:'Live portfolio provider unavailable. No balances or financial values have been inferred. Please retry later.'});}finally{active--;}
}
