import {activity} from '../lib/activity.mjs';
let cached=null,expires=0,pending=null;
export default async function activityHandler(req,res){res.setHeader('Cache-Control','public, max-age=10, s-maxage=10');if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}try{if(!cached||Date.now()>expires){pending??=activity();try{cached=await pending;expires=Date.now()+10000;}finally{pending=null;}}return res.status(200).json(cached);}catch{return res.status(503).json({error:'Explorer feed unavailable. No activity has been simulated.'});}}
