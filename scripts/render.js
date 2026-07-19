/**
 * Fills a template with data and (optionally) exports it to PNG/PDF.
 *
 *   node scripts/render.js <template> <data.json> [--png] [--pdf] [--out DIR]
 *
 * e.g.
 *   node scripts/render.js power-rankings data/week-04.json --png
 *
 * TEMPLATE SYNTAX
 *   {{KEY}}                    replaced with data.KEY
 *   <!-- REPEAT:thing -->      block is repeated once per item in data.things
 *      ...{{FIELD}}...         fields resolve against the item, then the
 *   <!-- /REPEAT:thing -->     top-level data as a fallback
 *
 *   An item may carry "_class": "is-first" — appended to the class attribute
 *   of the block's first element. That is how rank 1 gets its gold wash and
 *   how the standings cut line is positioned.
 *
 * Unfilled {{PLACEHOLDERS}} are reported rather than silently shipped, since
 * a stray {{TEAM}} in a newsletter that goes to twelve people is worse than
 * a loud failure here.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES = path.join(ROOT, 'templates');

const PLURAL = (s) => (s.endsWith('s') ? s : s + 's');

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Substitute {{KEY}} from a scope chain. Values are HTML-escaped unless the
 *  key ends in _HTML, which lets a headline carry a deliberate <br>. */
function substitute(html, scopes) {
  return html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (whole, key) => {
    const raw = key.endsWith('_HTML');
    // Match data keys case-insensitively. The _HTML suffix reads as an
    // acronym, so it gets written "_HTML", "_html", and "_Html" in practice,
    // and a silent miss here ships a visible {{PLACEHOLDER}} to the league.
    const want = key.toLowerCase();
    for (const scope of scopes) {
      if (!scope) continue;
      const hit = Object.keys(scope).find((k) => k.toLowerCase() === want);
      if (hit !== undefined) {
        return raw ? String(scope[hit]) : escapeHtml(scope[hit]);
      }
    }
    return whole; // leave it visible so the check below can catch it
  });
}

/**
 * Fill in the colour class for direction-bearing fields.
 *
 * A power-rankings row has both a movement string ("⬇ 3") and a colour class,
 * and if those two disagree you ship a green down-arrow — which is exactly
 * what happened the first time. The glyph already states the direction
 * unambiguously, so derive the class from it. An explicit `<field>_class` in
 * the data still wins, for the odd case that wants a deliberate override.
 */
const DIRECTION_FIELDS = ['move', 'streak', 'trend'];

function deriveClasses(item) {
  const out = { ...item };
  for (const field of DIRECTION_FIELDS) {
    const key = `${field}_class`;
    if (out[field] == null || out[key] != null) continue;
    const v = String(out[field]).trim();
    if (/^[⬆▲↑]|^W/i.test(v)) out[key] = 'pos';
    else if (/^[⬇▼↓]|^L/i.test(v)) out[key] = 'red';
    else out[key] = 'muted';
  }
  return out;
}

/** Replace the "is-*" modifiers on a block's first element with `modifier`
 *  (which may be undefined, meaning: no modifier). */
function applyItemClass(block, modifier) {
  let done = false;
  return block.replace(/class="([^"]*)"/, (whole, cls) => {
    if (done) return whole;
    done = true;
    const base = cls.split(/\s+/).filter((c) => c && !/^is-/.test(c));
    if (modifier) base.push(...String(modifier).split(/\s+/));
    return `class="${base.join(' ')}"`;
  });
}

function expandRepeats(html, data) {
  const re = /([ \t]*)<!--\s*REPEAT:(\w+)\s*(?:—[^>]*?)?-->([\s\S]*?)<!--\s*\/REPEAT:\2\s*-->/g;
  return html.replace(re, (whole, indent, name, block) => {
    const items = data[PLURAL(name)];
    if (!Array.isArray(items)) {
      console.warn(`  ! REPEAT:${name} found but data.${PLURAL(name)} is not an array — block removed`);
      return '';
    }
    return items
      .map((raw) => {
        const item = deriveClasses(raw);
        const out = substitute(block, [item, data]);
        // The template's first element carries demo modifiers like "is-first"
        // so the raw file previews sensibly. Strip those and apply whatever
        // this item actually asked for.
        return applyItemClass(out, item._class).trimEnd();
      })
      .join('\n');
  });
}

/**
 * `<!-- OPTIONAL:qr -->…<!-- /OPTIONAL:qr -->` keeps the block only when
 * data.qr_image exists. Used for the flyer's invitation QR, which is a
 * local-only asset most flyers won't carry.
 */
function resolveOptionals(html, data) {
  const re = /[ \t]*<!--\s*OPTIONAL:(\w+)\s*(?:—[^>]*?)?-->([\s\S]*?)<!--\s*\/OPTIONAL:\1\s*-->\n?/g;
  return html.replace(re, (whole, name, block) => {
    const key = Object.keys(data).find((k) => k.toLowerCase() === `${name}_image`);
    return key && data[key] ? block : '';
  });
}

function render(templateName, data) {
  const file = path.join(TEMPLATES, templateName.replace(/\.html$/, '') + '.html');
  if (!fs.existsSync(file)) {
    throw new Error(`No template at ${file}`);
  }
  let html = fs.readFileSync(file, 'utf8');
  html = resolveOptionals(html, data);
  html = expandRepeats(html, data);
  html = substitute(html, [data]);

  // Drop the template's documentation comments from the output. They exist to
  // explain the data contract to whoever edits the template; shipping them
  // would also make the leftover-placeholder check below fire on the prose
  // ("Fill the {{PLACEHOLDERS}} below").
  html = html.replace(/<!--[\s\S]*?-->\n?/g, '');

  const leftover = [...new Set((html.match(/\{\{[A-Z0-9_]+\}\}/g) || []))];
  return { html, leftover, file };
}

// ---------------------------------------------------------------------------

async function main() {
  const [, , templateName, dataPath, ...rest] = process.argv;
  if (!templateName || !dataPath) {
    console.error('usage: node scripts/render.js <template> <data.json> [--png] [--pdf] [--out DIR]');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const outDir = rest.includes('--out') ? rest[rest.indexOf('--out') + 1] : path.join(ROOT, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const { html, leftover } = render(templateName, data);
  const base = path.basename(templateName, '.html');
  const htmlOut = path.join(outDir, `${base}.html`);

  // Written into templates/ so the relative ../assets and ../tokens links
  // still resolve; then moved. Simpler: rewrite the links to absolute file
  // URLs so the output is portable to any directory.
  const abs = (...p) => path.join(ROOT, ...p).replace(/\\/g, '/');
  const fixed = html
    .replace(/(href|src)="\.\.\/(assets|tokens)\//g, (m, attr, dir) => `${attr}="${abs(dir)}/`)
    .replace(/(href|src)="_shared\.css"/g, (m, attr) => `${attr}="${abs('templates', '_shared.css')}"`)
    // Repo-root-relative paths supplied through data — e.g. a flyer's
    // "local/whatsapp-group-qr.png". Resolve against the repo, not the
    // output directory.
    .replace(/(href|src)="(local|assets|data)\//g, (m, attr, dir) => `${attr}="${abs(dir)}/`);

  fs.writeFileSync(htmlOut, fixed);
  console.log(`  html  ${path.relative(ROOT, htmlOut)}`);

  if (leftover.length) {
    console.warn(`\n  ! ${leftover.length} placeholder(s) never filled: ${leftover.join(', ')}`);
    console.warn('    Add them to your data file, or delete them from the template.');
  }

  if (rest.includes('--png') || rest.includes('--pdf')) {
    const { shoot } = require('./shoot');
    await shoot({
      htmlPath: htmlOut,
      outDir,
      base,
      png: rest.includes('--png'),
      pdf: rest.includes('--pdf'),
      selector: data._selector || '.sheet',
      clips: data._clips || null,
    });
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { render };
