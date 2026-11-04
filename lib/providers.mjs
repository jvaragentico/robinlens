import {identity, fixed, format, valuePosition, tradability} from './domain.mjs';
import {id} from 'ethers';
const API='https://api.robinhood.com/rhj';
const RPC=process.env.ROBINHOOD_RPC_URL||'https://rpc.mainnet.chain.robinhood.com';
/** @type {Map<string,{expires:number,data:any}>} */
const cache=new Map();
/** @param {string} url @param {RequestInit} [options] @param {number} [ttl] @returns {Promise<any>} */
export async function request(url,options={},ttl=0){const hit=cache.get(url);if(ttl&&hit&&hit.expires>Date.now())return hit.data;let last;for(let attempt=0;attempt<2;attempt++){try{const r=await fetch(url,{...options,signal:AbortSignal.timeout(8000),headers:{accept:'application/json','content-type':'application/json',...options.headers}});if(!r.ok)throw Error(`Upstream HTTP ${r.status}`);const data=await r.json();if(ttl){if(cache.size>200)cache.clear();cache.set(url,{data,expires:Date.now()+ttl});}return data;}catch(e){last=e;if(attempt===0)await new Promise(r=>setTimeout(r,200));}}throw last;}
/** @param {string} method @param {unknown[]} params */
async function rpc(method,params){const data=await request(RPC,{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});if(data.error||data.result===undefined)throw Error('RPC read failed');return data.result;}
/** @param {string} address @param {string} data @param {string} block */
async function call(address,data,block){return rpc('eth_call',[{to:address,data},block]);}
/** @param {string} address @param {number} cursor */
export async function portfolio(address,cursor=0){
 const now=Date.now(),at=new Date(now).toISOString();
 const registry=await request(`${API}/assets`,{},60000);
 if(!Array.isArray(registry.assets)||registry.next||registry.nextCursor)throw Error('Unsupported registry schema or pagination; refusing an incomplete registry');
 if(await rpc('eth_chainId',[])!=='0x1237')throw Error('RPC chain mismatch');
 const block=await rpc('eth_blockNumber',[]);
 const assets=registry.assets.flatMap((/** @type {any} */ a)=>(a.deployments||[]).filter((/** @type {any} */ d)=>d.chainId===4663).map((/** @type {any} */ d)=>({...a,...d,key:identity(d)})));
 const keys=new Set();for(const a of assets){if(keys.has(a.key))throw Error('Conflicting registry identity');keys.add(a.key);}
 const page=assets.slice(cursor,cursor+24);
 /** @type {any[]} */ const positions=[];
 /** @type {{key:string,reason:string}[]} */ const failures=[];
 for(let offset=0;offset<page.length;offset+=4){await Promise.all(page.slice(offset,offset+4).map(async(/** @type {any} */ a)=>{try{
  const selector=(/** @type {string} */ signature)=>id(signature).slice(0,10);
  const [rawHex,decHex,multHex,pauseHex]=await Promise.all([call(a.contractAddress,`0x70a08231${address.slice(2).toLowerCase().padStart(64,'0')}`,block),call(a.contractAddress,selector('decimals()'),block),call(a.contractAddress,selector('uiMultiplier()'),block),call(a.contractAddress,selector('oraclePaused()'),block)]);
  const raw=BigInt(rawHex).toString(),decimals=Number(BigInt(decHex));if(decimals!==18)throw Error('Unexpected issuer decimals');if(BigInt(raw)===0n)return;
  let ratio=null;try{const onchain=BigInt(multHex);if(onchain>0n&&onchain===fixed(a.currentMultiplier))ratio=format(onchain);}catch{}
  let price=null,quoteError=null,halted=null;
  try{const data=await request(`${API}/prices/${encodeURIComponent(a.tokenSymbol)}`,{},15000);const matches=(data.quotes||[]).filter((/** @type {any} */ q)=>(q.deployments||[]).some((/** @type {any} */ d)=>identity(d)===a.key));if(matches.length!==1)throw Error('Missing or conflicting quote identity');const q=matches[0];halted=q.isTradingHalt===true;if(q.currency!=='USD'||fixed(q.bid)<=0n||fixed(q.ask)<fixed(q.bid))throw Error('Invalid quote');price={value:format((fixed(q.bid)+fixed(q.ask))/2n),unit:/** @type {'share'} */('share'),currency:'USD',at:q.generatedAt,source:`${API}/prices/${a.tokenSymbol}`,halted};}catch{quoteError='Underlying quote unavailable or not verified';}
  if(price)price={...price,paused:BigInt(pauseHex)!==0n};
  positions.push({key:a.key,symbol:a.tokenSymbol,name:a.tokenName,contract:a.contractAddress,chainId:4663,raw,decimals,ratio,ratioAt:at,block,price,quoteError,...valuePosition(raw,decimals,ratio,price,now),pendingRatio:a.pendingMultiplier||null,pendingEffectiveAt:a.pendingMultiplierEffectiveTime||null,tradability:tradability(halted,a.status!=='ASSET_STATUS_ACTIVE',at)});
 }catch{failures.push({key:a.key,reason:'Balance or contract metadata read failed'});}}));}
 let actions=[],actionsAvailable=true;try{const data=await request(`${API}/corporate-actions`,{},3600000);if(!Array.isArray(data.corpActions))throw Error('Unsupported action schema');actions=data.corpActions.filter((/** @type {any} */ e)=>(e.deployments||[]).some((/** @type {any} */ d)=>positions.some(p=>p.key===identity(d))));}catch{actionsAvailable=false;}
 const next=cursor+24<assets.length?cursor+24:null;
 return {mode:'live',at,block,positions,failures,actions,actionsAvailable,next,scanned:Math.min(cursor+24,assets.length),registryCount:assets.length,complete:!next&&!failures.length,provider:process.env.ROBINHOOD_RPC_URL?'Dedicated RPC':'Public RPC (rate limited; not suitable for production SLA)',source:API};
}

