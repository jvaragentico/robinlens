import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});for(const file of ['index.html','app.js','style.css','future.css','future.js'])await copyFile(`public/${file}`,`dist/${file}`);console.log('Static assets built; API runs as a Node function.');
