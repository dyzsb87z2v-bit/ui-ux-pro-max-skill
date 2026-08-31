/**
 * MiLAEDiA — single-file preview packager.
 *
 * Packs the WHOLE production `dist/` (every route, every asset) into one
 * self-contained HTML page for the Artifact viewer, which cannot serve a
 * multi-file static site.
 *
 * Method
 *   - Every non-HTML file becomes one entry in a shared resource table
 *     (data: URI, or CSS/JS text). The table is emitted ONCE, so shared
 *     assets are not duplicated across the 36 pages.
 *   - Each page keeps `@@R<n>@@` tokens instead of asset URLs; the shell
 *     expands them at navigation time and hands the result to an iframe's
 *     `srcdoc`. srcdoc inherits the parent origin, so localStorage /
 *     sessionStorage (the bag, the intro gate, the order record) survive
 *     navigation exactly as they do on a real server.
 *   - Two surgical rewrites make server-routing work inside srcdoc:
 *       `window.location.href=`  ->  `window.__navTo=`      (router setter)
 *       `location.search`        ->  `window.__search`      (injected query)
 *
 * This is a PREVIEW TRANSPORT ONLY. It changes no source, and the real
 * deployment is the plain `dist/` directory.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const OUT = process.argv[2] ?? '/tmp/milaedia-preview.html';

const MIME = {
  '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.json': 'application/json',
};

/* ---------- walk ---------- */
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(DIST);

const urlOf = (p) => '/' + relative(DIST, p).split('\\').join('/');
const pages = files.filter((f) => f.endsWith('.html'));
const assets = files.filter(
  (f) => !f.endsWith('.html') && !/robots\.txt$|sitemap\.xml$/.test(f),
);

/* ---------- resource table ---------- */
const RES = [];            // emitted strings, referenced as @@R<n>@@
const tokenFor = new Map(); // url path -> token
const valueFor = new Map(); // url path -> literal string (for JS/CSS use)

function push(url, value) {
  const i = RES.length;
  RES.push(value);
  tokenFor.set(url, `@@R${i}@@`);
  valueFor.set(url, value);
  return i;
}

const dataUri = (buf, ext) =>
  `data:${MIME[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`;

// 1. binary assets first — CSS url() and JS literals resolve against them
for (const f of assets) {
  const ext = extname(f);
  if (ext === '.css' || ext === '.js') continue;
  push(urlOf(f), dataUri(readFileSync(f), ext));
}

// helper: swap every /_astro//media path in a text blob for its final value
const ASSET_RE = /\/(?:_astro|media)\/[A-Za-z0-9._%@-]+/g;
const resolveLiterals = (text) =>
  text.replace(ASSET_RE, (m) => valueFor.get(m) ?? m);

// 2. CSS — inline url() references, emit as a <style> element
for (const f of assets.filter((f) => f.endsWith('.css'))) {
  push(urlOf(f), `<style>${resolveLiterals(readFileSync(f, 'utf8'))}</style>`);
}

// 3. JS — topological: rewrite relative imports to the data: URI of the dep.
//    Media paths become `parent.__res(...)` lookups so a 350 KB mp4 is not
//    base64-nested inside a base64 module.
const jsFiles = assets.filter((f) => f.endsWith('.js'));
const jsText = new Map(jsFiles.map((f) => [urlOf(f), readFileSync(f, 'utf8')]));
const jsUri = new Map();

function buildJs(url, seen = new Set()) {
  if (jsUri.has(url)) return jsUri.get(url);
  if (seen.has(url)) throw new Error(`import cycle at ${url}`);
  seen.add(url);
  let src = jsText.get(url);
  src = src.replace(/(["'])\.\/([A-Za-z0-9._-]+\.js)\1/g, (_m, q, dep) =>
    q + buildJs('/_astro/' + dep, seen) + q);
  // /_astro/* literals (never .js — those are imports, handled above)
  // resolve straight to their data: URI.
  src = src.replace(/\/_astro\/[A-Za-z0-9._%@-]+/g,
    (m) => (m.endsWith('.js') ? m : valueFor.get(m) ?? m));
  // /media/* literals become a runtime lookup on the shell instead, so a
  // 350 KB mp4 is never base64-nested inside an already-base64 module.
  src = src.replace(/(["'])(\/media\/[A-Za-z0-9._-]+)\1/g,
    (_m, _q, path) => `parent.__res(${JSON.stringify(path)})`);
  src = src.replace(/window\.location\.href=/g, 'window.__navTo=');
  src = src.replace(/location\.search/g, 'window.__search');
  const uri = 'data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64');
  jsUri.set(url, uri);
  return uri;
}
for (const f of jsFiles) {
  const u = urlOf(f);
  const uri = buildJs(u);
  tokenFor.set(u, uri);        // JS is referenced directly, no token needed
  valueFor.set(u, uri);
}

/* ---------- pages ---------- */
const routeOf = (p) => {
  const u = urlOf(p).replace(/index\.html$/, '');
  return u === '/' ? '/' : u.replace(/\/$/, '') + '/';
};

const SHIM = `<script>(function(){
var W=window;W.__search=@@Q@@;
try{Object.defineProperty(W,'__navTo',{set:function(p){parent.postMessage({t:'nav',p:String(p)},'*');},get:function(){return '';},configurable:true});}catch(e){}
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;
  var h=a.getAttribute('href');if(!h)return;
  if(h.charAt(0)==='#'){e.preventDefault();var t=document.querySelector(h);if(t){t.scrollIntoView({behavior:'smooth'});}return;}
  if(/^(https?:|mailto:|tel:)/.test(h)){a.target='_blank';a.rel='noopener';return;}
  e.preventDefault();e.stopPropagation();parent.postMessage({t:'nav',p:h},'*');
},true);
document.addEventListener('keydown',function(e){parent.postMessage({t:'key',k:e.key},'*');});
var ro=new ResizeObserver(function(){});
})();<\/script>`;

// Escape `</script` (would close the host script) and every non-ASCII code
// point (so the page survives being served without a charset declaration).
const esc = (s) => s
  .replace(/<\/script/gi, '<\\/script')
  .replace(/[\u007f-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

const ROUTES = [];
for (const p of pages.sort()) {
  let html = readFileSync(p, 'utf8');

  // stylesheet links -> inlined <style> token
  html = html.replace(
    /<link[^>]+rel="stylesheet"[^>]*href="(\/_astro\/[^"]+\.css)"[^>]*>/g,
    (m, href) => tokenFor.get(href) ?? m,
  );
  // module scripts -> data: URI module
  html = html.replace(/(<script[^>]+src=")(\/_astro\/[^"]+\.js)(")/g,
    (m, a, href, b) => a + (valueFor.get(href) ?? href) + b);

  // remaining asset references -> shared tokens
  html = html.replace(ASSET_RE, (m) => tokenFor.get(m) ?? m);

  // routing rewrites for inline page scripts
  html = html.replace(/window\.location\.href=/g, 'window.__navTo=');
  html = html.replace(/location\.search/g, 'window.__search');

  html = html.replace(/<head>/i, '<head>' + SHIM);
  ROUTES.push([routeOf(p), html]);
}

/* ---------- shell ---------- */
const payload = {
  res: RES,
  routes: Object.fromEntries(ROUTES),
  media: Object.fromEntries([...valueFor].filter(([k]) => k.startsWith('/media/'))),
};

const shell = readFileSync(new URL('./preview-shell.html', import.meta.url).pathname, 'utf8')
  .replace('/*__PAYLOAD__*/null', esc(JSON.stringify(payload)));

writeFileSync(OUT, shell);
const mb = (Buffer.byteLength(shell) / 1048576).toFixed(2);
console.log(`${ROUTES.length} routes, ${RES.length} resources -> ${OUT} (${mb} MB)`);
if (Buffer.byteLength(shell) > 16 * 1048576) { console.error('OVER 16 MB CAP'); process.exit(1); }
