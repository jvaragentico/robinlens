import {request} from './providers.mjs';
/** Read-only block explorer feed. It never requests or submits transactions. */
export async function activity(){
 const endpoint=process.env.ROBINHOOD_RPC_URL||'https://rpc.mainnet.chain.robinhood.com';
 const read=async(/** @type {string} */method,/** @type {unknown[]} */params)=>{const response=await request(endpoint,{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});if(response.error||response.result===undefined)throw Error('Explorer read unavailable');return response.result;};
 if(await read('eth_chainId',[])!=='0x1237')throw Error('Unexpected chain');
 const head=BigInt(await read('eth_blockNumber',[]));
 const blocks=await Promise.all(Array.from({length:4},(_,i)=>read('eth_getBlockByNumber',['0x'+(head-BigInt(i)).toString(16),false])));
 if(blocks.some(block=>!block?.hash||!Array.isArray(block.transactions)))throw Error('Incomplete block feed');
 return {source:'Robinhood Chain JSON-RPC',chainId:4663,observedAt:new Date().toISOString(),blocks:blocks.map(block=>({number:BigInt(block.number).toString(),hash:block.hash,at:new Date(Number(BigInt(block.timestamp))*1000).toISOString(),transactionCount:block.transactions.length}))};
}
