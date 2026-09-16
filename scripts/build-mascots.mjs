// Format/size optimization only; no artwork generation, masking or retouching.
// Run from apps/web: node scripts/build-mascots.mjs
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const registry = await readFile(new URL('src/lib/mascot.ts', root), 'utf8');
const names = [...registry.split('] as const;')[0].matchAll(/'([a-z-]+)'/g)].map(match => match[1]);
assert.equal(names.length, 15, 'Expected all 15 sheet variants');
await mkdir(new URL('public/mascot/variants/', root), { recursive: true });
let totalBytes = 0;
for (const name of names) {
  const input = fileURLToPath(new URL(`assets/mascot/originals/${name}.png`, root));
  const output = fileURLToPath(new URL(`public/mascot/variants/${name}.webp`, root));
  const metadata = await sharp(input).metadata();
  assert(metadata.hasAlpha, `${name}: source must have alpha`);
  assert.equal(metadata.width, metadata.height, `${name}: source must be square`);
  const info = await sharp(input).resize(768, 768, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(output);
  const { data, info: pixels } = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let clear = 0;
  let solid = 0;
  for (let i = 3; i < data.length; i += pixels.channels) {
    if (data[i] === 0) clear++;
    // Generated masters use near-opaque alpha (typically 252–254) in the body.
    if (data[i] >= 245) solid++;
  }
  assert(clear > pixels.width * pixels.height * 0.1, `${name}: missing transparent background`);
  assert(solid > pixels.width * pixels.height * 0.1, `${name}: missing solid artwork`);
  assert.equal(info.width, 768);
  assert.equal(info.height, 768);
  totalBytes += info.size;
  console.log(`${name}: 768×768, ${(info.size / 1024).toFixed(1)} KiB, alpha verified`);
}
console.log(`Total: ${(totalBytes / 1024).toFixed(1)} KiB for ${names.length} variants`);
