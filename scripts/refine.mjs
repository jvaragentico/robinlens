import fs from 'node:fs';
let s=fs.readFileSync('public/app.js','utf8');
s=s.replace('let scanComplete=false;','let scanComplete=false;let scannedAddress=null;');
s=s.replace("scanComplete=false;for(const m","scanComplete=false;scannedAddress=null;$('#scan').textContent='Verified by chain + contract';for(const m");
s=s.replace("if(reset)setMode('live');const version=epoch;","if(!reset&&scannedAddress!==address.toLowerCase()){notice('The address changed. Start a new portfolio scan before continuing.');return;}if(reset){setMode('live');scannedAddress=address.toLowerCase();}const version=epoch;");
s=s.replace("scanComplete?'$0.00':'—'","scanComplete?(failures.length?'Unavailable':'$0.00'):'—'");
s += "\nsetInterval(()=>{if(mode!=='live')return;let changed=false;for(const p of positions){if(p.price&&p.freshness==='fresh'&&Date.now()-Date.parse(p.price.at)>120000){p.freshness='stale';p.value=null;changed=true;}}if(changed)render();},15000);\n";
fs.writeFileSync('public/app.js',s);
s=fs.readFileSync('public/style.css','utf8').replace('top:-70px;','top:0;transform:translateY(-200%);').replace('.skip:focus{top:10px}', '.skip:focus{top:10px;transform:translateY(0)}');fs.writeFileSync('public/style.css',s);
