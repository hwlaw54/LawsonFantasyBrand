/**
 * Downloads the four Lawson League typefaces (latin subset) from Google Fonts
 * into assets/fonts/ as .woff2, and grabs the .ttf originals into
 * scripts/.ttf-cache/ so build-logos.js can outline the crest text.
 *
 * All four families are SIL Open Font License 1.1.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'fonts');
const TTF = path.join(__dirname, '.ttf-cache');

// weight sets come straight from the design system's @import
const FAMILIES = [
  { name: 'Cinzel', weights: [600, 700, 800, 900] },
  { name: 'Oswald', weights: [300, 400, 500, 600, 700] },
  { name: 'Barlow Condensed', weights: [500, 600, 700] },
  { name: 'Barlow', weights: [400, 500, 600, 700] },
];

// A modern UA gets woff2; a fake ancient one gets ttf. Same URL, different Accept.
const UA_WOFF2 =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const UA_TTF = 'Mozilla/5.0 (Windows NT 6.1; WOW64)';

function get(url, ua) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': ua } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, ua).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

function cssUrl(fam, weights) {
  const q = `${fam.replace(/ /g, '+')}:wght@${weights.join(';')}`;
  return `https://fonts.googleapis.com/css2?family=${q}&display=swap`;
}

function slug(s) {
  return s.toLowerCase().replace(/ /g, '-');
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TTF, { recursive: true });

  const faceRules = [];

  for (const { name, weights } of FAMILIES) {
    const css = (await get(cssUrl(name, weights), UA_WOFF2)).toString('utf8');

    // Google returns one @font-face per (weight x unicode-range). We only want
    // the `latin` block for each weight.
    const blocks = css.split('@font-face').slice(1);
    const perWeight = [];

    for (const w of weights) {
      // find the latin block for this weight
      const forWeight = blocks.filter((b) => new RegExp(`font-weight:\\s*${w};`).test(b));
      // the latin subset is the one whose unicode-range starts at U+0000-00FF
      const block =
        forWeight.find((b) => /unicode-range:\s*U\+0000-00FF/.test(b)) ||
        forWeight[forWeight.length - 1];
      if (!block) {
        console.warn(`  ! no block for ${name} ${w}`);
        continue;
      }
      const m = block.match(/src:\s*url\((https:[^)]+)\)/);
      if (!m) continue;

      const buf = await get(m[1], UA_WOFF2);
      perWeight.push({ weight: w, buf });
    }

    // Cinzel and Oswald ship as variable fonts: Google serves one identical
    // file for every weight. Writing it four times would be 75kb of waste, so
    // detect that and emit a single file with a font-weight range instead.
    const hashes = new Set(perWeight.map((p) => p.buf.toString('base64').slice(0, 64)));
    const isVariable = perWeight.length > 1 && hashes.size === 1;

    if (isVariable) {
      const file = `${slug(name)}-variable.woff2`;
      fs.writeFileSync(path.join(OUT, file), perWeight[0].buf);
      faceRules.push({
        family: name,
        weight: `${weights[0]} ${weights[weights.length - 1]}`,
        file,
      });
      console.log(
        `  woff2  ${file}  ${(perWeight[0].buf.length / 1024).toFixed(1)}kb  (variable ${weights[0]}–${weights[weights.length - 1]})`
      );
    } else {
      for (const { weight, buf } of perWeight) {
        const file = `${slug(name)}-${weight}.woff2`;
        fs.writeFileSync(path.join(OUT, file), buf);
        faceRules.push({ family: name, weight, file });
        console.log(`  woff2  ${file}  ${(buf.length / 1024).toFixed(1)}kb`);
      }
    }

    // TTF originals, used only for outlining the crest text
    const ttfCss = (await get(cssUrl(name, weights), UA_TTF)).toString('utf8');
    const ttfBlocks = ttfCss.split('@font-face').slice(1);
    for (const w of weights) {
      const block = ttfBlocks.find((b) => new RegExp(`font-weight:\\s*${w};`).test(b));
      if (!block) continue;
      const m = block.match(/src:\s*url\((https:[^)]+)\)/);
      if (!m) continue;
      const buf = await get(m[1], UA_TTF);
      fs.writeFileSync(path.join(TTF, `${slug(name)}-${w}.ttf`), buf);
    }
    console.log(`  ttf    ${name} cached`);
  }

  writeFontsCss(faceRules);
  writeCdnCss();
  console.log(`\n${faceRules.length} woff2 files in assets/fonts/`);
}

function writeFontsCss(rules) {
  const header = `/* Lawson League — self-hosted typefaces
 * Cinzel · Oswald · Barlow Condensed · Barlow
 * All SIL Open Font License 1.1 — see OFL.txt
 *
 * Paths are relative to this file. Link it before tokens.css:
 *   <link rel="stylesheet" href="../assets/fonts/fonts.css">
 *   <link rel="stylesheet" href="../tokens/tokens.css">
 */
`;
  const body = rules
    .map(
      (r) => `@font-face {
  font-family: '${r.family}';
  font-style: normal;
  font-weight: ${r.weight};
  font-display: swap;
  src: url('./${r.file}') format('woff2');
}`
    )
    .join('\n');
  fs.writeFileSync(path.join(OUT, 'fonts.css'), header + body + '\n');
}

function writeCdnCss() {
  const q = FAMILIES.map(
    (f) => `family=${f.name.replace(/ /g, '+')}:wght@${f.weights.join(';')}`
  ).join('&');
  fs.writeFileSync(
    path.join(OUT, 'fonts-cdn.css'),
    `/* Fallback: pull the same four families from Google's CDN.
 * Use only where the self-hosted files in fonts.css can't be reached.
 */
@import url('https://fonts.googleapis.com/css2?${q}&display=swap');
`
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
