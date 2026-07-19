/**
 * Builds every logo file in assets/logo/ from a single crest definition.
 *
 * WHY THIS EXISTS: the crest that came out of Claude Design used live <text>
 * elements with font-family="Cinzel". On any machine without Cinzel installed
 * — which is most of them — the logo silently rendered in fallback Times.
 * Here we convert all crest lettering to outlined <path> data using the real
 * Cinzel outlines, so the SVGs are self-contained and render identically
 * everywhere: browsers, email, Illustrator, embroidery software, a printer.
 *
 * Geometry (shield, football, banner) is carried over verbatim from the
 * approved design so the shape does not drift.
 *
 *   node scripts/build-logos.js
 */
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'logo');
const TTF = path.join(__dirname, '.ttf-cache');

const C = {
  navyGradTop: '#123056',
  navyGradBottom: '#050c18',
  navy: '#10233F',
  navyDeep: '#081121',
  laces: '#0d2244',
  gold: '#C8A04B',
  cream: '#F4EEE1',
  white: '#ffffff',
  black: '#000000',
};

/** SVG is XML: a bare "&" in a title or aria-label makes the whole file
 *  unparseable and the browser renders nothing. */
function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const fontCache = new Map();
function font(file) {
  if (!fontCache.has(file)) {
    fontCache.set(file, opentype.parse(fs.readFileSync(path.join(TTF, file)).buffer));
  }
  return fontCache.get(file);
}

/**
 * Lay out text glyph by glyph so letter-spacing survives outlining.
 * Returns SVG path data plus the true advance width.
 *
 * `anchor` mirrors SVG text-anchor. Note we centre on the width WITHOUT
 * trailing letter-space, which is what a designer means by centred — browsers
 * include the trailing gap and push wide-tracked text visibly off-centre.
 */
function outline(text, { fontFile, size, tracking = 0, x = 0, y = 0, anchor = 'middle' }) {
  const f = font(fontFile);
  const scale = size / f.unitsPerEm;

  // charToGlyph rather than stringToGlyphs: opentype's shaper runs a ccmp
  // feature query that Cinzel's lookup tables trip over ("substFormat: 2 is
  // not yet supported"). Our lettering is uppercase Latin, digits, "&" and
  // ".", so there is nothing for a shaper to do — we only need kerning, which
  // we apply explicitly below.
  const glyphs = Array.from(text).map((ch) => f.charToGlyph(ch));

  const kernAt = (i) =>
    i > 0 ? (f.getKerningValue(glyphs[i - 1], glyphs[i]) || 0) * scale : 0;

  let width = 0;
  glyphs.forEach((g, i) => {
    width += kernAt(i);
    width += g.advanceWidth * scale;
    if (i < glyphs.length - 1) width += tracking;
  });

  let penX = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;

  const parts = [];
  glyphs.forEach((g, i) => {
    penX += kernAt(i);
    const d = g.getPath(penX, y, size).toPathData(3);
    if (d) parts.push(d);
    penX += g.advanceWidth * scale + tracking;
  });
  return { d: parts.join(' '), width };
}

// ---------------------------------------------------------------------------
// Crest pieces. Geometry verbatim from the approved design system.
// ---------------------------------------------------------------------------

const SHIELD_OUTER = 'M22,22 H238 V150 C238,222 176,272 130,294 C84,272 22,222 22,150 Z';
const SHIELD_INNER = 'M32,32 H228 V150 C228,214 172,260 130,281 C88,260 32,214 32,150 Z';
const BANNER = 'M-74,-13 L74,-13 L62,0 L74,13 L-74,13 L-62,0 Z';
const BALL_OUTER = 'M-50,0 Q-28,-23 0,-23 Q28,-23 50,0 Q28,23 0,23 Q-28,23 -50,0 Z';
const BALL_INNER = 'M-40,0 Q-24,-13 0,-13 Q24,-13 40,0 Q24,13 0,13 Q-24,13 -40,0 Z';

function football({ ball, laces }) {
  return `  <g transform="translate(130,74)">
    <path d="${BALL_OUTER}" fill="${ball}"/>
    <path d="${BALL_INNER}" fill="none" stroke="${laces}" stroke-width="1.4" opacity="0.35"/>
    <line x1="-33" y1="-10" x2="-33" y2="10" stroke="${laces}" stroke-width="3.2" stroke-linecap="round"/>
    <line x1="33" y1="-10" x2="33" y2="10" stroke="${laces}" stroke-width="3.2" stroke-linecap="round"/>
    <line x1="-16" y1="0" x2="16" y2="0" stroke="${laces}" stroke-width="2.6" stroke-linecap="round"/>
    <line x1="-14" y1="-5" x2="-14" y2="5" stroke="${laces}" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="-7" y1="-5.5" x2="-7" y2="5.5" stroke="${laces}" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="0" y1="-6" x2="0" y2="6" stroke="${laces}" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="7" y1="-5.5" x2="7" y2="5.5" stroke="${laces}" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="14" y1="-5" x2="14" y2="5" stroke="${laces}" stroke-width="2.4" stroke-linecap="round"/>
  </g>`;
}

// Outlined lettering — computed once, reused by every crest variant.
const TXT = {
  lff: outline('LFF', { fontFile: 'cinzel-900.ttf', size: 70, tracking: 2, x: 130, y: 150 }),
  est: outline('EST. 2020', { fontFile: 'cinzel-700.ttf', size: 18, tracking: 7, x: 130, y: 184 }),
  banner: outline('FAMILY & FRIENDS', {
    fontFile: 'cinzel-800.ttf',
    size: 10.5,
    tracking: 0,
    x: 0,
    y: 5,
  }),
};

/**
 * @param {object} o
 * @param {string} o.field   shield fill (colour or url(#id))
 * @param {string} o.trim    gold trim / rules
 * @param {string} o.letters LFF fill
 * @param {string} o.laces   football lace lines
 * @param {string} o.onBanner banner text fill
 * @param {string} [o.defs]  optional <defs> block
 */
function crest({ field, trim, letters, laces, onBanner, defs = '', title, mono = false }) {
  // In full colour the ribbon is a solid gold bar with navy text knocked out
  // of it. That trick needs two colours, so a one-colour mark instead strokes
  // the ribbon outline and sets the text in the same ink — otherwise the bar
  // fills solid and swallows "FAMILY & FRIENDS" entirely.
  const ribbon = mono
    ? `    <path d="${BANNER}" fill="none" stroke="${trim}" stroke-width="1.6"/>
    <path d="${TXT.banner.d}" fill="${trim}"/>`
    : `    <path d="${BANNER}" fill="${trim}"/>
    <path d="${TXT.banner.d}" fill="${onBanner}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 300" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
${defs}  <path d="${SHIELD_OUTER}" fill="${field}" stroke="${trim}" stroke-width="6"/>
  <path d="${SHIELD_INNER}" fill="none" stroke="${trim}" stroke-width="1.5" opacity="0.5"/>
${football({ ball: trim, laces })}
  <path d="${TXT.lff.d}" fill="${letters}"/>
  <path d="${TXT.est.d}" fill="${trim}"/>
  <g transform="translate(130,216)">
${ribbon}
  </g>
</svg>
`;
}

const GRADIENT_DEFS = `  <defs>
    <linearGradient id="lffField" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.navyGradTop}"/>
      <stop offset="1" stop-color="${C.navyGradBottom}"/>
    </linearGradient>
  </defs>
`;

// ---------------------------------------------------------------------------
// Wordmark
// ---------------------------------------------------------------------------

function wordmark({ lawson, ff, sub, title }) {
  // "LAWSON F&F" set as one optically-tracked line, then the condensed subline.
  const size = 46;
  const tracking = 0.02 * size;
  const gap = 14;

  const a = outline('LAWSON', { fontFile: 'cinzel-900.ttf', size, tracking, anchor: 'start' });
  const b = outline('F&F', { fontFile: 'cinzel-900.ttf', size, tracking, anchor: 'start' });
  const total = a.width + gap + b.width;

  const subSize = 13;
  const subTrack = 0.22 * subSize;
  const s = outline('FANTASY FOOTBALL LEAGUE', {
    fontFile: 'oswald-500.ttf',
    size: subSize,
    tracking: subTrack,
    anchor: 'start',
  });

  const width = Math.max(total, s.width);
  const padX = 4;
  const baseline = 50;
  const subBaseline = 76;
  const vbW = width + padX * 2;
  const vbH = 92;

  const aPath = outline('LAWSON', {
    fontFile: 'cinzel-900.ttf',
    size,
    tracking,
    x: padX,
    y: baseline,
    anchor: 'start',
  });
  const bPath = outline('F&F', {
    fontFile: 'cinzel-900.ttf',
    size,
    tracking,
    x: padX + a.width + gap,
    y: baseline,
    anchor: 'start',
  });
  const sPath = outline('FANTASY FOOTBALL LEAGUE', {
    fontFile: 'oswald-500.ttf',
    size: subSize,
    tracking: subTrack,
    x: padX,
    y: subBaseline,
    anchor: 'start',
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW.toFixed(1)} ${vbH}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <path d="${aPath.d}" fill="${lawson}"/>
  <path d="${bPath.d}" fill="${ff}"/>
  <path d="${sPath.d}" fill="${sub}"/>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Monogram badge — circular, for avatars and small marks
// ---------------------------------------------------------------------------

function monogramBadge({ field, trim, letters, defs = '', title }) {
  const lff = outline('LFF', { fontFile: 'cinzel-900.ttf', size: 54, tracking: 1, x: 100, y: 104 });
  const est = outline('EST. 2020', {
    fontFile: 'cinzel-700.ttf',
    size: 11,
    tracking: 3.3,
    x: 100,
    y: 130,
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
${defs}  <circle cx="100" cy="100" r="94" fill="${field}" stroke="${trim}" stroke-width="6"/>
  <circle cx="100" cy="100" r="84" fill="none" stroke="${trim}" stroke-width="1.2" opacity="0.45"/>
  <path d="${lff.d}" fill="${letters}"/>
  <path d="${est.d}" fill="${trim}"/>
</svg>
`;
}

const BADGE_DEFS = `  <defs>
    <radialGradient id="lffBadge" cx="50%" cy="0%" r="130%">
      <stop offset="0" stop-color="#16305a"/>
      <stop offset="42%" stop-color="#10233F"/>
      <stop offset="100%" stop-color="#081121"/>
    </radialGradient>
  </defs>
`;

// ---------------------------------------------------------------------------
// Lockups — crest + wordmark
// ---------------------------------------------------------------------------

function stripSvgWrapper(svg) {
  return svg.replace(/^[\s\S]*?<title>[\s\S]*?<\/title>\n/, '').replace(/<\/svg>\s*$/, '');
}

function lockupHorizontal({ onLight }) {
  const crestW = 150;
  const crestH = (300 / 260) * crestW;
  const wm = wordmark(
    onLight
      ? { lawson: C.navy, ff: C.gold, sub: '#6b7280', title: 'x' }
      : { lawson: C.cream, ff: C.gold, sub: '#9aa0ab', title: 'x' }
  );
  const vb = wm.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const wmW = parseFloat(vb[1]);
  const wmH = parseFloat(vb[2]);

  const gap = 34;
  const scale = 1.0;
  // The shield path starts at x=22 inside a 260-wide viewBox, so the crest
  // carries ~8.5% of built-in inset on its left. Mirror that on the right or
  // the wordmark sits flush to the edge and the whole mark reads off-centre.
  const inset = (22 / 260) * crestW;
  const totalW = crestW + gap + wmW * scale + inset;
  const totalH = Math.max(crestH, wmH);
  const wmY = (totalH - wmH * scale) / 2;

  const crestSvg = crest({
    field: 'url(#lffField)',
    trim: C.gold,
    letters: C.cream,
    laces: C.laces,
    onBanner: C.navy,
    defs: GRADIENT_DEFS,
    title: 'x',
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(1)} ${totalH.toFixed(1)}" role="img" aria-label="Lawson Family &amp; Friends Fantasy League">
  <title>Lawson Family &amp; Friends Fantasy League — primary horizontal lockup</title>
${GRADIENT_DEFS}  <g transform="translate(0,${((totalH - crestH) / 2).toFixed(1)}) scale(${(crestW / 260).toFixed(4)})">
${stripSvgWrapper(crestSvg).replace(GRADIENT_DEFS, '')}  </g>
  <g transform="translate(${(crestW + gap).toFixed(1)},${wmY.toFixed(1)})">
${stripSvgWrapper(wm)}  </g>
</svg>
`;
}

function lockupStacked({ onLight }) {
  const crestW = 190;
  const crestH = (300 / 260) * crestW;
  const wm = wordmark(
    onLight
      ? { lawson: C.navy, ff: C.gold, sub: '#6b7280', title: 'x' }
      : { lawson: C.cream, ff: C.gold, sub: '#9aa0ab', title: 'x' }
  );
  const vb = wm.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const wmW = parseFloat(vb[1]);
  const wmH = parseFloat(vb[2]);

  const gap = 26;
  const totalW = Math.max(crestW, wmW);
  const totalH = crestH + gap + wmH;

  const crestSvg = crest({
    field: 'url(#lffField)',
    trim: C.gold,
    letters: C.cream,
    laces: C.laces,
    onBanner: C.navy,
    defs: GRADIENT_DEFS,
    title: 'x',
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(1)} ${totalH.toFixed(1)}" role="img" aria-label="Lawson Family &amp; Friends Fantasy League">
  <title>Lawson Family &amp; Friends Fantasy League — stacked lockup</title>
${GRADIENT_DEFS}  <g transform="translate(${((totalW - crestW) / 2).toFixed(1)},0) scale(${(crestW / 260).toFixed(4)})">
${stripSvgWrapper(crestSvg).replace(GRADIENT_DEFS, '')}  </g>
  <g transform="translate(${((totalW - wmW) / 2).toFixed(1)},${(crestH + gap).toFixed(1)})">
${stripSvgWrapper(wm)}  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------

const files = {
  // Primary — full colour, navy gradient field
  'crest-full.svg': crest({
    field: 'url(#lffField)',
    trim: C.gold,
    letters: C.cream,
    laces: C.laces,
    onBanner: C.navy,
    defs: GRADIENT_DEFS,
    title: 'Lawson Family & Friends Fantasy League crest',
  }),

  // Flat navy — for print, screen print, and anywhere gradients misbehave
  'crest-flat.svg': crest({
    field: C.navy,
    trim: C.gold,
    letters: C.cream,
    laces: C.laces,
    onBanner: C.navy,
    title: 'Lawson Family & Friends Fantasy League crest — flat navy',
  }),

  // Single-colour marks — embroidery, stamps, one-colour print, watermarks
  'crest-mono-gold.svg': crest({
    field: 'none',
    trim: C.gold,
    letters: C.gold,
    laces: 'none',
    onBanner: 'none',
    mono: true,
    title: 'Lawson League crest — one colour gold',
  }),
  'crest-mono-navy.svg': crest({
    field: 'none',
    trim: C.navy,
    letters: C.navy,
    laces: 'none',
    onBanner: 'none',
    mono: true,
    title: 'Lawson League crest — one colour navy',
  }),
  'crest-mono-cream.svg': crest({
    field: 'none',
    trim: C.cream,
    letters: C.cream,
    laces: 'none',
    onBanner: 'none',
    mono: true,
    title: 'Lawson League crest — one colour cream',
  }),
  'crest-mono-white.svg': crest({
    field: 'none',
    trim: C.white,
    letters: C.white,
    laces: 'none',
    onBanner: 'none',
    mono: true,
    title: 'Lawson League crest — one colour white',
  }),
  'crest-mono-black.svg': crest({
    field: 'none',
    trim: C.black,
    letters: C.black,
    laces: 'none',
    onBanner: 'none',
    mono: true,
    title: 'Lawson League crest — one colour black',
  }),

  // Wordmarks
  'wordmark-on-dark.svg': wordmark({
    lawson: C.cream,
    ff: C.gold,
    sub: '#9aa0ab',
    title: 'Lawson F&F Fantasy Football League wordmark — on dark',
  }),
  'wordmark-on-light.svg': wordmark({
    lawson: C.navy,
    ff: C.gold,
    sub: '#6b7280',
    title: 'Lawson F&F Fantasy Football League wordmark — on light',
  }),

  // Lockups
  'lockup-primary.svg': lockupHorizontal({ onLight: false }),
  'lockup-primary-on-light.svg': lockupHorizontal({ onLight: true }),
  'lockup-stacked.svg': lockupStacked({ onLight: false }),
  'lockup-stacked-on-light.svg': lockupStacked({ onLight: true }),

  // Monogram badge — avatars, profile pictures, small marks
  'monogram-badge.svg': monogramBadge({
    field: 'url(#lffBadge)',
    trim: C.gold,
    letters: C.cream,
    defs: BADGE_DEFS,
    title: 'Lawson League monogram badge',
  }),
  'monogram-badge-gold.svg': monogramBadge({
    field: 'none',
    trim: C.gold,
    letters: C.gold,
    title: 'Lawson League monogram badge — one colour gold',
  }),

  // Favicon — the crest alone reads as mush at 32px, so the favicon is the
  // monogram only: shield silhouette + LFF, no ribbon, no EST line.
  'favicon.svg': (() => {
    const lff = outline('LFF', {
      fontFile: 'cinzel-900.ttf',
      size: 96,
      tracking: 2,
      x: 130,
      y: 200,
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 300" role="img" aria-label="Lawson League">
  <title>Lawson League</title>
${GRADIENT_DEFS}  <path d="${SHIELD_OUTER}" fill="url(#lffField)" stroke="${C.gold}" stroke-width="10"/>
  <path d="${lff.d}" fill="${C.cream}"/>
</svg>
`;
  })(),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log(`  ${name}  ${(svg.length / 1024).toFixed(1)}kb`);
}
console.log(`\n${Object.keys(files).length} SVG files in assets/logo/`);
