/**
 * Crops a source photo into a circular, gold-ringed headshot matching the
 * brand's monogram-badge treatment — for a commissioner byline in an email
 * or template.
 *
 *   node scripts/build-headshot.js <input> <output> [size]
 *
 * e.g.
 *   node scripts/build-headshot.js local/henry-headshot-original.jpeg \
 *        assets/commissioner/henry-headshot.jpg 320
 *
 * Exports at 2x the intended display size by default (size defaults to 320,
 * meant to be shown at ~160px) so it stays crisp on retina screens without
 * ballooning file size — a full-res 1024px headshot is overkill for a small
 * email byline photo.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const GOLD = '#C8A04B';

async function run() {
  const [, , input, output, sizeArg] = process.argv;
  if (!input || !output) {
    console.error('usage: node scripts/build-headshot.js <input> <output> [size]');
    process.exit(1);
  }
  const size = parseInt(sizeArg, 10) || 320;
  const ring = Math.round(size * 0.035); // proportional to the monogram badge's ring weight

  const src = sharp(input).rotate(); // auto-orient from EXIF before anything else
  const meta = await src.metadata();
  const edge = Math.min(meta.width, meta.height);

  // Center-crop to square, then resize to the target export size.
  const squared = await src
    .extract({
      left: Math.round((meta.width - edge) / 2),
      top: Math.round((meta.height - edge) / 2),
      width: edge,
      height: edge,
    })
    .resize(size, size)
    .toBuffer();

  // Circular mask, inset by the ring width so the gold ring reads as a
  // border around the photo rather than overlapping it.
  const maskSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - ring}" fill="#fff"/></svg>`
  );
  const circled = await sharp(squared)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Gold ring, drawn as a stroked circle behind the masked photo.
  const ringSvg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - ring / 2}" fill="none" stroke="${GOLD}" stroke-width="${ring}"/>
    </svg>`
  );

  fs.mkdirSync(path.dirname(output), { recursive: true });
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: circled, top: 0, left: 0 }, { input: ringSvg, top: 0, left: 0 }])
    .flatten({ background: '#ffffff' }) // JPEG has no alpha; email clients handle a flattened circle fine
    .jpeg({ quality: 90 })
    .toFile(output);

  const stat = fs.statSync(output);
  console.log(`${output}  ${size}x${size}  ${(stat.size / 1024).toFixed(1)}kb`);
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
