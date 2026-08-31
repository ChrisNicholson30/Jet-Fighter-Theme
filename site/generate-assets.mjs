/**
 * Jet Fighter site — raster assets.
 *
 * The mark is the supplied artwork (`assets/brand/mark-source.jpg`), which is
 * the authoritative logo. Everything the site shows is derived from it here so
 * the crop, the sizes and the encoding are reproducible rather than the result
 * of someone dragging a file through an image editor once.
 *
 *   node site/generate-assets.mjs
 *
 * Needs Playwright, which is a local tool rather than a project dependency:
 * the outputs are committed, so neither CI nor a contributor building the site
 * has to install a browser. Chromium does the resampling and the WebP
 * encoding — its downscaler is high quality, and it is already here.
 */

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, 'assets');
const SOURCE = resolve(OUT, 'brand', 'mark-source.jpg');
mkdirSync(OUT, { recursive: true });

let chromium;
try {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
} catch {
  ({ chromium } = await import('playwright'));
}

const dataUri = `data:image/jpeg;base64,${readFileSync(SOURCE).toString('base64')}`;
const browser = await chromium.launch();
const page = await browser.newPage();

/**
 * The source is 1170x1227 with uneven black margins — it is a screen capture,
 * not the authored file. Rather than hard-code a crop, find the ring by
 * luminance and centre a square on it, so re-exporting the source at a
 * different size does not silently shift the framing.
 */
const box = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
  for (let y = 0; y < c.height; y += 1) {
    for (let x = 0; x < c.width; x += 1) {
      const i = (y * c.width + x) * 4;
      if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 42) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // Largest centred square that stays inside the frame, then a small margin so
  // the ring never touches the edge.
  const side = Math.min(cx, cy, c.width - cx, c.height - cy) * 2;
  return { cx, cy, side: Math.floor(side), ring: maxX - minX + 1 };
}, dataUri);

console.log(`source ring ${box.ring}px · square crop ${box.side}px at (${box.cx}, ${box.cy})`);

/**
 * Crop the square and re-encode at `size`.
 *
 * `zoom` tightens the crop for small icons. The supplied artwork is a badge —
 * ring, code field and airframe — and below about 24px the airframe collapses
 * to a smudge while the ring thins to nothing. Framing in on the delta and the
 * plumes keeps the two elements that still read. Measured, not assumed: at 16px
 * the full crop loses the aircraft entirely, 58% clips the plumes, and 72%
 * holds both. Large sizes keep the full badge, which is the design.
 */
async function render(size, type, quality, zoom = 1) {
  const buf = await page.evaluate(
    async ({ src, box: b, size: s, type: t, quality: q, zoom: z }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = s;
      c.height = s;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const side = b.side * z;
      // The airframe's visual centre sits below the ring's, so a tightened crop
      // biases downward to keep the nozzles and plumes in frame.
      const cy = b.cy + b.side * (1 - z) * 0.1;
      ctx.drawImage(img, b.cx - side / 2, cy - side / 2, side, side, 0, 0, s, s);
      const url = c.toDataURL(t, q);
      return url.slice(url.indexOf(',') + 1);
    },
    { src: dataUri, box, size, type, quality, zoom },
  );
  return Buffer.from(buf, 'base64');
}

// Display logo. WebP because the artwork is photographic — a PNG of the same
// crop is several times the size for no visible gain.
//
// 640 is the hero, at the full badge. 96 is the header mark, which renders at
// 34px and therefore needs the same tightened crop as the tab icons: at that
// size the ring is a hairline and the airframe is a smudge.
for (const [size, zoom] of [[640, 1], [96, 0.72]]) {
  const buf = await render(size, 'image/webp', 0.92, zoom);
  writeFileSync(resolve(OUT, `logo-${size}.webp`), buf);
  console.log(`logo-${size}.webp     ${(buf.length / 1024).toFixed(1)} KB${zoom < 1 ? `  (${Math.round(zoom * 100)}% crop)` : ''}`);
}

// Icons. PNG, because favicon support for WebP is still uneven.
// 180 keeps the whole badge; the tab-sized icons frame in on the aircraft.
for (const [size, zoom] of [[180, 1], [32, 0.72], [16, 0.72]]) {
  const buf = await render(size, 'image/png', undefined, zoom);
  writeFileSync(resolve(OUT, `icon-${size}.png`), buf);
  console.log(`icon-${size}.png     ${(buf.length / 1024).toFixed(1)} KB${zoom < 1 ? `  (${Math.round(zoom * 100)}% crop)` : ''}`);
}

// Social card. The registry listing for a Zed theme shows no artwork —
// extension.toml has no icon field — so this is the highest-leverage placement
// for the mark: it is what renders when the repo URL is pasted into Slack,
// Discord or a chat client.
const fontCss = ['sairacond-800-normal', 'saira-var-normal', 'plexmono-400-normal']
  .map((f) => {
    const b64 = readFileSync(resolve(OUT, 'fonts', `${f}.woff2`)).toString('base64');
    const family = f.startsWith('sairacond') ? 'Saira Cond' : f.startsWith('saira') ? 'Saira' : 'Plex Mono';
    const weight = f.includes('800') ? 800 : f.includes('var') ? '300 700' : 400;
    return `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${weight}}`;
  })
  .join('');

const logo640 = `data:image/webp;base64,${readFileSync(resolve(OUT, 'logo-640.webp')).toString('base64')}`;

const card = `<!doctype html><meta charset="utf-8"><style>
${fontCss}
*{margin:0;box-sizing:border-box}
body{width:1280px;height:640px;background:#000;color:#F8FAFC;display:flex;align-items:center;gap:64px;padding:0 84px;overflow:hidden;position:relative;font-family:'Saira',sans-serif}
body::before{content:'';position:absolute;inset:0;
  background-image:linear-gradient(rgba(45,55,72,.55) 1px,transparent 1px),linear-gradient(90deg,rgba(45,55,72,.55) 1px,transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:radial-gradient(ellipse 80% 70% at 74% 50%,#000 10%,transparent 72%)}
.art{flex:none;width:400px;height:400px;position:relative;z-index:1;border-radius:50%;overflow:hidden;
  box-shadow:0 0 90px rgba(56,189,248,.30)}
.art img{width:100%;height:100%;display:block}
.txt{position:relative;z-index:1}
.eyebrow{font-size:15px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:#728299;margin-bottom:26px}
h1{font-family:'Saira Cond',sans-serif;font-weight:800;font-size:118px;line-height:.84;text-transform:uppercase;letter-spacing:-.02em}
h1 span{display:block;color:#38BDF8}
p{margin-top:26px;font-size:26px;line-height:1.42;color:#CBD5E1;max-width:19ch;font-weight:300}
.bar{margin-top:34px;display:flex;gap:10px}
.pill{font-family:'Plex Mono',monospace;font-size:14px;letter-spacing:.14em;text-transform:uppercase;padding:7px 14px;border:1px solid #2D3748;color:#728299}
.pill.on{color:#0B0F14;background:#38BDF8;border-color:#38BDF8}
</style>
<div class="art"><img src="${logo640}" alt=""></div>
<div class="txt">
  <div class="eyebrow">Theme family · Zed</div>
  <h1>Jet<span>Fighter</span></h1>
  <p>All 185 style keys. Four variants. Evidence, not adjectives.</p>
  <div class="bar">
    <span class="pill on">Afterburner</span><span class="pill">Stealth</span><span class="pill">Contrail</span><span class="pill">Hyperjet</span>
  </div>
</div>`;

const cardPage = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await cardPage.setContent(card, { waitUntil: 'networkidle' });
await cardPage.evaluate(() => document.fonts.ready);
await cardPage.screenshot({ path: resolve(OUT, 'social-card.png') });
console.log('social-card.png  1280x640');

await browser.close();
