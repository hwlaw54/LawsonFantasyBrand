/**
 * Crop a QR code out of a screenshot, safely.
 *
 *   node scripts/crop-qr.js <input.png> [output.png]
 *
 * WHY: a QR screenshot straight off a phone is mostly app chrome. The league's
 * WhatsApp group code occupied under 10% of its frame, which meant the
 * invitation flyer only scanned at full resolution — texting it, which
 * downscales, produced a dead code. Cropping to the code itself made it scan
 * through every realistic degradation.
 *
 * A QR is a credential, so this refuses to guess:
 *   - decodes the source first; aborts if it can't
 *   - locates the code from the decoder's own corner points, not by eye
 *   - re-decodes the crop and requires an identical payload before writing
 *   - compares payloads by hash and never prints them
 *   - backs up the original alongside the output
 *
 * If any check fails, nothing is written.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

let jsQR;
try {
  jsQR = require('jsqr');
} catch {
  console.error('This script needs jsqr:  npm install --no-save jsqr');
  process.exit(1);
}

const TARGET = 1000;      // output edge, px
const QUIET_RATIO = 0.12; // quiet zone as a share of code width (spec wants 4 modules)

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

async function decode(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height);
}

async function main() {
  const [, , src, dstArg] = process.argv;
  if (!src) {
    console.error('usage: node scripts/crop-qr.js <input.png> [output.png]');
    process.exit(1);
  }
  if (!fs.existsSync(src)) {
    console.error(`No such file: ${src}`);
    process.exit(1);
  }
  const dst = dstArg || src;

  const before = await decode(src);
  if (!before) {
    console.error('FAIL: could not decode a QR in the source image. Nothing written.');
    process.exit(1);
  }
  const hash = sha(before.data);
  const meta = await sharp(src).metadata();
  console.log(`source    ${meta.width}x${meta.height}`);
  console.log(`payload   sha256:${hash}  (${before.data.length} chars, not printed)`);

  const L = before.location;
  const xs = [L.topLeftCorner.x, L.topRightCorner.x, L.bottomLeftCorner.x, L.bottomRightCorner.x];
  const ys = [L.topLeftCorner.y, L.topRightCorner.y, L.bottomLeftCorner.y, L.bottomRightCorner.y];
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const codeW = maxX - minX, codeH = maxY - minY;
  const share = ((codeW * codeH) / (meta.width * meta.height)) * 100;
  console.log(`code      ${Math.round(codeW)}x${Math.round(codeH)} — ${share.toFixed(1)}% of the frame`);

  const quiet = Math.round(Math.max(codeW, codeH) * QUIET_RATIO);
  const size = Math.round(Math.max(codeW, codeH)) + quiet * 2;
  const left = Math.max(0, Math.round(minX - quiet - (size - codeW - quiet * 2) / 2));
  const top = Math.max(0, Math.round(minY - quiet - (size - codeH - quiet * 2) / 2));

  const cropped = await sharp(src)
    .extract({
      left,
      top,
      width: Math.min(size, meta.width - left),
      height: Math.min(size, meta.height - top),
    })
    .flatten({ background: '#ffffff' })
    // nearest-neighbour keeps the module edges hard; smooth interpolation
    // softens them and costs scan reliability at small sizes.
    .resize(TARGET, TARGET, { fit: 'contain', background: '#ffffff', kernel: 'nearest' })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const after = await decode(cropped);
  if (!after) {
    console.error('\nFAIL: the cropped image no longer decodes. Nothing written.');
    process.exit(1);
  }
  if (sha(after.data) !== hash) {
    console.error('\nFAIL: payload changed after cropping. Nothing written.');
    process.exit(1);
  }
  console.log(`\ncropped   ${TARGET}x${TARGET} — payload matches, crop is lossless`);

  if (dst === src) {
    const backup = src.replace(/(\.\w+)$/, '-original$1');
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(src, backup);
      console.log(`backup    ${path.basename(backup)}`);
    }
  }
  fs.writeFileSync(dst, cropped);
  console.log(`written   ${dst}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
