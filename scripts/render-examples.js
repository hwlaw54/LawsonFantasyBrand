/**
 * Renders every template against its example data and refreshes the preview
 * images used by the brand board and README.
 *
 *   npm run examples
 *
 * Run this after changing a template so the previews don't go stale. Fails
 * loudly if any template leaves an unfilled placeholder.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'output');
const PREVIEWS = path.join(ROOT, 'docs', 'previews');

// template → the example data file that fills it
const JOBS = [
  ['newsletter', 'example-newsletter.json'],
  ['email-newsletter', 'example-newsletter.json'],
  ['power-rankings', 'example-power-rankings.json'],
  ['standings', 'example-standings.json'],
  ['draft-board', 'example-draft-board.json'],
  ['flyer', 'example-flyer.json'],
  ['transaction-card', 'example-transactions.json'],
  ['awards', 'example-awards.json'],
  ['season-wrap', 'example-season-wrap.json'],
  ['chat-card', 'example-chat-cards.json'],
];

let failed = false;

for (const [template, data] of JOBS) {
  const out = execFileSync(
    process.execPath,
    [path.join(__dirname, 'render.js'), template, path.join(ROOT, 'data', data), '--png'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  process.stdout.write(out);
  if (/placeholder\(s\) never filled/.test(out)) failed = true;
}

// Refresh the committed previews at a web-friendly width.
(async () => {
  fs.mkdirSync(PREVIEWS, { recursive: true });
  for (const f of fs.readdirSync(OUT).filter((f) => f.endsWith('.png'))) {
    const buf = await sharp(path.join(OUT, f))
      .resize({ width: 900, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(PREVIEWS, f), buf);
  }
  console.log(`\npreviews refreshed in docs/previews/`);

  if (failed) {
    console.error('\nFAILED: at least one template had an unfilled placeholder.');
    process.exit(1);
  }
})();
