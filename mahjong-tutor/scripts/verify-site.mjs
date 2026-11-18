import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const baseline=JSON.parse(await readFile(path.join(root,'mahjong-tutor/docs/site-baseline.json'),'utf8'));
const current={};
async function visit(relative){
  for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})){
    const file=path.join(relative,entry.name);
    if(entry.isDirectory())await visit(file);
    else current[file]=createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
  }
}
await visit('site');
const changed=Object.keys(baseline).filter(file=>current[file]!==baseline[file]);
const added=Object.keys(current).filter(file=>!(file in baseline));
console.log(JSON.stringify({baselineFiles:Object.keys(baseline).length,currentFiles:Object.keys(current).length,changedOrRemoved:changed,added},null,2));
if(changed.length||added.length)process.exitCode=1;
