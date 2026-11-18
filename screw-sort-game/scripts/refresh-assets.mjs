import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { releaseFiles } from './release-files.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function refreshAssets() {
  const files=releaseFiles.filter(name=>name.startsWith('js/')).sort();
  const paths=['styles.css',...files];
  const versions=new Map(await Promise.all(paths.map(async name=>[
    name,createHash('sha256').update(await readFile(path.join(root,name))).digest('hex').slice(0,12),
  ])));
  const url=name=>`./${name}?v=${versions.get(name)}`;
  const imports=Object.fromEntries(files.map(name=>[`./${name}`,url(name)]));
  const map=`  <script type="importmap" id="game-importmap">${JSON.stringify({imports})}</script>\n`;
  const index=path.join(root,'index.html');
  let html=await readFile(index,'utf8');
  html=html.replace(/\s*<script type="importmap" id="game-importmap">[\s\S]*?<\/script>\s*/,'\n');
  html=html.replace(/href="\.\/styles\.css(?:\?[^\"]*)?"/,`href="${url('styles.css')}"`);
  html=html.replace(/src="\.\/js\/analytics\.js(?:\?[^\"]*)?"/,`src="${url('js/analytics.js')}"`);
  html=html.replace(/\s*<script type="module" src="\.\/js\/app\.js(?:\?[^\"]*)?"><\/script>/,`\n${map}  <script type="module" src="${url('js/app.js')}"></script>`);
  await writeFile(index,html);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await refreshAssets();
