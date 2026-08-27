/**
 * Jet Fighter site — raster assets.
 *
 * Renders the social card and the icon set from the vector mark. Needs
 * Playwright, which is a local tool rather than a project dependency: the
 * outputs are committed, so neither CI nor a contributor building the site
 * has to install a browser.
 *
 *   node site/generate-assets.mjs
 *
 * The registry listing for a Zed theme shows no artwork — extension.toml has
 * no icon field — so the highest-leverage placement for the mark is the
 * GitHub social preview card, which is what renders when the repo URL is
 * pasted into Slack, Discord or a chat client.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { markSvg, faviconSvg } from './src/mark.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, 'assets');
mkdirSync(OUT, { recursive: true });

let chromium;
try {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
} catch {
  ({ chromium } = await import('playwright'));
}

const fontCss = ['sairacond-800-normal', 'saira-var-normal', 'plexmono-400-normal']
  .map((f) => {
    const b64 = readFileSync(resolve(OUT, 'fonts', `${f}.woff2`)).toString('base64');
    const family = f.startsWith('sairacond') ? 'Saira Cond' : f.startsWith('saira') ? 'Saira' : 'Plex Mono';
    const weight = f.includes('800') ? 800 : f.includes('var') ? '300 700' : 400;
    return `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${weight}}`;
  })
  .join('');

const card = `<!doctype html><meta charset="utf-8"><style>
${fontCss}
*{margin:0;box-sizing:border-box}
body{width:1280px;height:640px;background:#000;color:#F8FAFC;display:flex;align-items:center;gap:64px;padding:0 84px;overflow:hidden;position:relative;font-family:'Saira',sans-serif}
body::before{content:'';position:absolute;inset:0;
  background-image:linear-gradient(rgba(45,55,72,.55) 1px,transparent 1px),linear-gradient(90deg,rgba(45,55,72,.55) 1px,transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:radial-gradient(ellipse 80% 70% at 74% 50%,#000 10%,transparent 72%)}
.art{flex:none;width:392px;position:relative;z-index:1;filter:drop-shadow(0 0 70px rgba(56,189,248,.34))}
.txt{position:relative;z-index:1}
.eyebrow{font-size:15px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:#728299;margin-bottom:26px}
h1{font-family:'Saira Cond',sans-serif;font-weight:800;font-size:118px;line-height:.84;text-transform:uppercase;letter-spacing:-.02em}
h1 span{display:block;color:#38BDF8}
p{margin-top:26px;font-size:26px;line-height:1.42;color:#CBD5E1;max-width:19ch;font-weight:300}
.bar{margin-top:34px;display:flex;gap:10px}
.pill{font-family:'Plex Mono',monospace;font-size:14px;letter-spacing:.14em;text-transform:uppercase;padding:7px 14px;border:1px solid #2D3748;color:#728299}
.pill.on{color:#0B0F14;background:#38BDF8;border-color:#38BDF8}
</style>
<div class="art">${markSvg({ id: 'card', size: 392 })}</div>
<div class="txt">
  <div class="eyebrow">Theme family · Zed</div>
  <h1>Jet<span>Fighter</span></h1>
  <p>All 185 style keys. Three variants. Evidence, not adjectives.</p>
  <div class="bar">
    <span class="pill on">Afterburner</span><span class="pill">Stealth</span><span class="pill">Contrail</span>
  </div>
</div>`;

const browser = await chromium.launch();

const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
await page.setContent(card, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: resolve(OUT, 'social-card.png') });
console.log('social-card.png  1280x640');

// Icon set. 16 and 32 take the reduction; the larger sizes take the badge.
for (const size of [16, 32, 180, 512]) {
  const svg = size <= 32 ? faviconSvg({ id: `i${size}` }) : markSvg({ id: `i${size}`, size });
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.setContent(
    `<!doctype html><style>*{margin:0}body{width:${size}px;height:${size}px;overflow:hidden}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
  );
  await p.screenshot({ path: resolve(OUT, `icon-${size}.png`), omitBackground: size > 32 });
  await p.close();
  console.log(`icon-${size}.png`);
}

writeFileSync(resolve(OUT, 'mark.svg'), markSvg({ id: 'mark', size: 512 }));
writeFileSync(resolve(OUT, 'favicon.svg'), faviconSvg());
console.log('mark.svg, favicon.svg');

await browser.close();
