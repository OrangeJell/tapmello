import { copyFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { refreshAssets } from '../../screw-sort-game/scripts/refresh-assets.mjs';
import { releaseFiles } from '../../screw-sort-game/scripts/release-files.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameRoot = path.resolve(siteRoot, '..', 'screw-sort-game');
const publishRoot = path.join(siteRoot, 'dist', 'play', 'screw-sort');
const assetsRoot = path.join(siteRoot, 'dist', 'assets');

await refreshAssets();
await rm(publishRoot, { recursive: true, force: true });
for (const relativePath of releaseFiles) {
  const outputPath = path.join(publishRoot, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await copyFile(path.join(gameRoot, relativePath), outputPath);
}
await mkdir(assetsRoot, { recursive: true });
await copyFile(path.join(gameRoot, 'js', 'analytics.js'), path.join(assetsRoot, 'analytics.js'));
await copyFile(path.join(gameRoot, 'js', 'return-visit.js'), path.join(assetsRoot, 'return-visit.js'));
await copyFile(path.join(gameRoot, 'return-visit.css'), path.join(assetsRoot, 'return-visit.css'));
console.log(`Synced ${releaseFiles.length} local game files to ${publishRoot}`);
