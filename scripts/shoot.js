/**
 * PNG / PDF export via headless Edge.
 *
 * We drive the browser already on the machine with puppeteer-core rather than
 * downloading a private Chromium — it keeps the repo clone small and there is
 * nothing here that needs a specific Chrome build.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

/** Common install locations, most-preferred first. */
const CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

function findBrowser() {
  if (process.env.LFF_BROWSER && fs.existsSync(process.env.LFF_BROWSER)) {
    return process.env.LFF_BROWSER;
  }
  const hit = CANDIDATES.find((p) => fs.existsSync(p));
  if (!hit) {
    throw new Error(
      'No Chrome or Edge found. Set LFF_BROWSER to the browser executable path.'
    );
  }
  return hit;
}

/**
 * @param {object} o
 * @param {string} o.htmlPath  file to load
 * @param {string} o.outDir
 * @param {string} o.base      output filename stem
 * @param {boolean} o.png
 * @param {boolean} o.pdf
 * @param {string} o.selector  element to capture (default ".sheet")
 * @param {string[]} [o.clips] capture these selectors individually instead,
 *                             writing <base>-<id>.png for each
 * @param {number} [o.scale]   device scale factor (default 2 — retina)
 */
async function shoot({ htmlPath, outDir, base, png, pdf, selector = '.sheet', clips, scale = 2 }) {
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: scale });
    await page.goto('file:///' + path.resolve(htmlPath).replace(/\\/g, '/'), {
      waitUntil: 'networkidle0',
    });
    // Self-hosted webfonts load async; without this the first paint can use
    // fallback metrics and the export ships in the wrong typeface.
    await page.evaluate(() => document.fonts.ready);

    if (png) {
      if (clips && clips.length) {
        for (const sel of clips) {
          const el = await page.$(sel);
          if (!el) {
            console.warn(`  ! no element matches ${sel}`);
            continue;
          }
          const name = `${base}-${sel.replace(/^[#.]/, '')}.png`;
          await el.screenshot({ path: path.join(outDir, name) });
          console.log(`  png   ${name}`);
        }
      } else {
        const el = await page.$(selector);
        const target = el || page;
        const out = path.join(outDir, `${base}.png`);
        await (el ? el.screenshot({ path: out }) : page.screenshot({ path: out, fullPage: true }));
        console.log(`  png   ${base}.png`);
      }
    }

    if (pdf) {
      const el = await page.$(selector);
      const box = el ? await el.boundingBox() : null;
      const out = path.join(outDir, `${base}.pdf`);
      await page.pdf({
        path: out,
        printBackground: true,
        width: box ? `${Math.ceil(box.width)}px` : '860px',
        height: box ? `${Math.ceil(box.height)}px` : undefined,
        pageRanges: '1',
      });
      console.log(`  pdf   ${base}.pdf`);
    }
  } finally {
    await browser.close();
  }
}

module.exports = { shoot, findBrowser };
