import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(site,'../mahjong-tutor'),target=path.join(site,'dist/play/mahjong');
const files=['styles.css','assets/icon.svg','assets/outfit.woff2','assets/OFL.txt',...['app','articles','catalog','curriculum','hi','i18n','locale-copy','lessons','rules','storage','tiles','tutorial'].map(x=>`js/${x}.js`)];
await rm(target,{recursive:true,force:true});
for(const file of files){await mkdir(path.dirname(path.join(target,file)),{recursive:true});
 if(file.endsWith('.js')){
  // Tile glyphs stay intact. Legacy authoring arguments are unused; escape their literals in the release.
  const code=(await readFile(path.join(source,file),'utf8')).replace(/[\u4e00-\u9fff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
  await writeFile(path.join(target,file),code);
 }else await copyFile(path.join(source,file),path.join(target,file));
}
let html=await readFile(path.join(source,'index.html'),'utf8');
html=html.replace('<div id="app"></div>','<div id="app"><main id="main" tabindex="-1"><p>Loading Mahjong…</p></main></div>');
html=html.replace('<meta charset="utf-8">','<meta charset="utf-8">\n  <meta name="robots" content="noindex, follow">');
const hash=async file=>createHash('sha256').update(await readFile(path.join(target,file))).digest('hex').slice(0,12);
const imports={};for(const file of files.filter(x=>x.endsWith('.js')))imports['./'+file]='./'+file+'?v='+await hash(file);
html=html.replace('<script type="module" src="js/app.js"></script>',`<script type="importmap">${JSON.stringify({imports})}</script>\n  <script type="module" src="./js/app.js?v=${await hash('js/app.js')}"></script>`).replace('href="styles.css"',`href="styles.css?v=${await hash('styles.css')}"`);
await writeFile(path.join(target,'index.html'),html);
console.log(`Synced ${files.length+1} Mahjong release files.`);
