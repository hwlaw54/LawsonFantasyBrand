/**
 * Rasterises every SVG in assets/logo/ to PNG at a few useful widths.
 *
 * PNGs are transparent-background by default — the crest carries its own navy
 * field, so it sits correctly on any surface. `--on-navy` and `--on-cream`
 * flattened copies are also produced for the two primary brand grounds, which
 * is what you want when pasting into Yahoo, a group chat, or a slide.
 *
 *   node scripts/build-pngs.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'logo');
const OUT = path.join(SRC, 'png');

const WIDTHS = [256, 512, 1024, 2048];

// Only these get the full size ladder; one-colour marks are vector-only tools
// and rarely needed as big rasters.
const FULL_LADDER = new Set([
  'crest-full.svg',
  'lockup-primary.svg',
  'lockup-stacked.svg',
  'monogram-badge.svg',
]);

const NAVY = { r: 0x10, g: 0x23, b: 0x3f, alpha: 1 };
const CREAM = { r: 0xf4, g: 0xee, b: 0xe1, alpha: 1 };

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const svgs = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg'));
  let n = 0;

  for (const file of svgs) {
    const buf = fs.readFileSync(path.join(SRC, file));
    const base = file.replace(/\.svg$/, '');
    const widths = FULL_LADDER.has(file) ? WIDTHS : [512];

    for (const w of widths) {
      const out = path.join(OUT, `${base}-${w}.png`);
      await sharp(buf, { density: 400 }).resize({ width: w }).png({ compressionLevel: 9 }).toFile(out);
      n++;
    }

    // Flattened copies on the two brand grounds, at one sensible size.
    if (FULL_LADDER.has(file)) {
      await sharp(buf, { density: 400 })
        .resize({ width: 1024 })
        .flatten({ background: NAVY })
        .png({ compressionLevel: 9 })
        .toFile(path.join(OUT, `${base}-1024-on-navy.png`));
      await sharp(buf, { density: 400 })
        .resize({ width: 1024 })
        .flatten({ background: CREAM })
        .png({ compressionLevel: 9 })
        .toFile(path.join(OUT, `${base}-1024-on-cream.png`));
      n += 2;
    }
  }

  // Favicon raster set for anywhere that won't take an SVG.
  const fav = fs.readFileSync(path.join(SRC, 'favicon.svg'));
  for (const s of [16, 32, 48, 180, 512]) {
    await sharp(fav, { density: 600 })
      .resize({ width: s, height: s, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, `favicon-${s}.png`));
    n++;
  }

  console.log(`${n} PNGs in assets/logo/png/`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
