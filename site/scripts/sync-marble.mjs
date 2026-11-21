import {readFile, writeFile, mkdir, rm, copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(site,'../marble-sort-game'),target=path.join(site,'dist/play/marble-sort');
// Explicit release list keeps tests, reference solutions tooling and development files out.
const files=['assets/clay-toys.webp','assets/fox-avatar-128.png','styles.css','vendor/matter.min.js','vendor/MATTER-LICENSE.txt',...['app','engine','physics','view','house-art','toys','commuters','levels','shift-patterns','i18n','locale-copy','scenes','platform','audio','music','feedback'].map(name=>`js/${name}.js`)];
await rm(target,{recursive:true,force:true});
for(const file of files){
 await mkdir(path.dirname(path.join(target,file)),{recursive:true});
 if(file.endsWith('.js')) await writeFile(path.join(target,file),(await readFile(path.join(source,file),'utf8')).replace(/[\u4e00-\u9fff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')));
 else await copyFile(path.join(source,file),path.join(target,file));
}
const hash=async file=>createHash('sha256').update(await readFile(path.join(target,file))).digest('hex').slice(0,12);
const imports={};
for(const file of files.filter(file=>file.startsWith('js/'))) imports['./'+file]='./'+file+'?v='+await hash(file);
let html=await readFile(path.join(source,'index.html'),'utf8');
html=html.replace('<meta charset="utf-8">','<meta charset="utf-8">\n  <meta name="robots" content="noindex, follow">');
html=html.replace('<script type="module" src="js/app.js"></script>',`<script type="importmap">${JSON.stringify({imports})}</script>\n  <script type="module" src="./js/app.js?v=${await hash('js/app.js')}"></script>`);
html=html.replace('href="styles.css"',`href="styles.css?v=${await hash('styles.css')}"`).replace('src="vendor/matter.min.js"',`src="vendor/matter.min.js?v=${await hash('vendor/matter.min.js')}"`);
await writeFile(path.join(target,'index.html'),html);
console.log(`Synced ${files.length+1} Marble Sort release files.`);
