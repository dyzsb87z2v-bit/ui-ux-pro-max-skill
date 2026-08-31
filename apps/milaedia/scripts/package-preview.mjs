/**
 * MiLAEDiA — single-file preview packager.
 *
 * Packs the whole production `dist/` into one self-contained HTML page for
 * the Artifact viewer, which cannot serve a multi-file static site.
 *
 * ---------------------------------------------------------------------------
 * REVIEWABILITY IS A HARD REQUIREMENT.
 *
 * An artifact has to pass an automated review before it can be shared
 * publicly. An earlier build of this packager failed that review outright:
 * it shipped every JS chunk as `data:text/javascript;base64,...` and escaped
 * all non-ASCII to \uXXXX, so the page was several megabytes of opaque
 * blob with base64-encoded executable code -- indistinguishable from
 * deliberate obfuscation, and unreadable to any text scanner.
 *
 * Everything below is written so the output stays legible:
 *   - JavaScript ships as PLAIN INLINE SOURCE, never base64, never data:.
 *   - Copy ships as real UTF-8, not escape sequences.
 *   - Only assets something actually references are embedded.
 *   - One image format (AVIF) instead of the AVIF+WebP pair Astro emits.
 * ---------------------------------------------------------------------------
 *
 * Navigation: pages keep `@@R<n>@@` tokens against a shared resource table so
 * an asset is stored once, not once per page. The shell expands them and
 * hands the result to an iframe's `srcdoc`, which inherits the parent origin
 * -- so localStorage/sessionStorage (the bag, the intro gate, the order
 * record) survive navigation exactly as they do on a real server. Two
 * rewrites make server routing work inside srcdoc:
 *     `window.location.href=`  ->  `window.__navTo=`   (router setter)
 *     `location.search`        ->  `window.__search`   (injected query)
 *
 * PREVIEW TRANSPORT ONLY. It changes no source; the real deployment is the
 * plain `dist/` directory.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const OUT = process.argv[2] ?? '/tmp/milaedia-preview.html';

const MIME = {
  '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(DIST);

const urlOf = (p) => '/' + relative(DIST, p).split('\\').join('/');
const byUrl = new Map(files.map((f) => [urlOf(f), f]));
const pageFiles = files.filter((f) => f.endsWith('.html')).sort();

const ASSET_RE = /\/(?:_astro|media)\/[A-Za-z0-9._%@-]+/g;

/* ========================================================================
   1. JavaScript — flattened to plain readable source, one module per page.

   Rollup emits two leaf chunks (depth, bag) and five dependents that import
   from them. Rather than turning each into a base64 data: module, the
   dependency is emitted ONCE at module top level with its `export{...}`
   stripped, and each dependent is wrapped in a block `{ }` that opens with
   `const <local> = <exported binding>;`. Modules are strict, so const/let/
   function are block-scoped and the minified short names of two dependents
   cannot collide. No chunk declares a top-level `var`, which is what would
   have leaked out of those blocks.

   Aliases read through a namespace object rather than bare `const` copies.
   Bare copies collide: SiteHeader's `import{o as f,b as m}` against bag's
   `export{f as b, w as o}` becomes `const f = w, m = f` -- where `m` binds
   to the just-declared `f`, not bag's. Checkout's three-name import produced
   a TDZ error the same way. Reading `__ns_bag.o` cannot be shadowed by a
   local of any name.

   The result is one instance of each dependency per page -- the same
   semantics the shared data: URI had, so depth.js still runs a single rAF
   loop -- expressed as source a human (or a scanner) can read.
   ======================================================================== */
const EXPORTS_RE = /export\s*\{([^}]*)\}\s*;?\s*$/;
const IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*"\.\/([^"]+)"\s*;?/g;

const nsName = (url) => '__ns_' + basename(url).split('.')[0].replace(/[^A-Za-z0-9_]/g, '_');

const jsCache = new Map();
function loadChunk(url) {
  if (jsCache.has(url)) return jsCache.get(url);
  let src = readFileSync(byUrl.get(url), 'utf8');

  // Only the small video is packed (see below), so point every request at it.
  src = src.replace(/\/media\/atelier-weaver\.mp4/g, '/media/atelier-weaver-sm.mp4');
  // /media/* resolves through the shell so a binary is never embedded twice.
  src = src.replace(/(["'])(\/media\/[A-Za-z0-9._-]+)\1/g,
    (_m, _q, path) => `parent.__res(${JSON.stringify(path)})`);
  src = src.replace(/window\.location\.href\s*=/g, 'window.__navTo=');
  src = src.replace(/location\.search/g, 'window.__search');

  const deps = [];
  const aliases = [];
  src = src.replace(IMPORT_RE, (_m, names, depFile) => {
    const depUrl = '/_astro/' + depFile;
    loadChunk(depUrl);
    deps.push(depUrl);
    for (const part of names.split(',')) {
      const [imported, local] = part.split(/\s+as\s+/).map((x) => x.trim());
      aliases.push(`${local ?? imported} = ${nsName(depUrl)}.${imported}`);
    }
    return '';
  });

  const exports = new Map();
  const em = src.match(EXPORTS_RE);
  if (em) {
    for (const part of em[1].split(',')) {
      const [binding, name] = part.split(/\s+as\s+/).map((x) => x.trim());
      exports.set(name ?? binding, binding);
    }
    src = src.replace(EXPORTS_RE, '');
  }

  const chunk = { url, body: src.trim(), deps, aliases, exports };
  jsCache.set(url, chunk);
  return chunk;
}

function bundleFor(entryUrls) {
  const emitted = new Set();
  const out = [];
  const addDeps = (chunk) => {
    for (const d of chunk.deps) {
      const dep = loadChunk(d);
      addDeps(dep);
      if (!emitted.has(d)) {
        emitted.add(d);
        const ns = [...dep.exports].map(([name, binding]) => `${name}: ${binding}`).join(', ');
        out.push(
          `/* ${basename(d).replace(/\.[A-Za-z0-9_-]+\.js$/, '.js')} */\n${dep.body}\n` +
          `const ${nsName(d)} = { ${ns} };`,
        );
      }
    }
  };
  for (const u of entryUrls) {
    const c = loadChunk(u);
    addDeps(c);
    const open = c.aliases.length ? `const ${c.aliases.join(', ')};\n` : '';
    const name = basename(u).replace(/\.astro_astro_type_script.*$/, '.astro').replace(/\.[A-Za-z0-9_-]+\.js$/, '.js');
    out.push(`/* ${name} */\n{\n${open}${c.body}\n}`);
  }
  return out.join('\n\n');
}

/* ========================================================================
   2. Pages — picture rewrite, routing rewrites, bundled script, shim.
   ======================================================================== */
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
})();</script>`;

/**
 * PUBLIC-SHARE SAFETY (preview transport only -- never written to src/).
 *
 * /checkout asks for a name, email and full postal address; /custom asks for
 * commission details. Live, those forms are real. In a shared link they are
 * not, and a stranger has no way to know that before typing. Built from the
 * measured tokens the rest of the house uses, so it reads as part of the page.
 */
const FORM_NOTICE = `<aside class="demo-note" role="note">
  <p class="demo-note-k">Demonstration</p>
  <p class="demo-note-b">This is a design demonstration, not a live shop. Nothing you type here is sent anywhere &mdash; it stays in this browser tab and is discarded when you close it. Please do not enter real personal details.</p>
</aside>
<style>
  .demo-note {
    /* The forms it sits in are grid/flex containers, so it has to claim the
       full row rather than becoming a column of its own. */
    grid-column: 1 / -1; flex: 1 0 100%;
    display: grid; gap: 0.4em;
    margin-block-end: clamp(1.4rem, 3vh, 2.4rem);
    padding: clamp(0.9rem, 2vw, 1.3rem) clamp(1rem, 2.2vw, 1.5rem);
    background: var(--panel);
    border: 1px solid var(--hairline);
    border-inline-start: 2px solid var(--bronze);
    border-radius: var(--radius-card);
  }
  .demo-note-k {
    margin: 0; font-family: var(--font-display); font-size: var(--type-descriptor);
    letter-spacing: var(--track-cities); text-transform: uppercase; color: var(--bronze);
  }
  .demo-note-b {
    margin: 0; font-family: var(--font-display); font-size: var(--type-card-link);
    line-height: 1.8; color: var(--silver); max-inline-size: 62ch;
  }
</style>`;

const routeOf = (p) => {
  const u = urlOf(p).replace(/index\.html$/, '');
  return u === '/' ? '/' : u.replace(/\/$/, '') + '/';
};

/**
 * Astro emits every image twice: an AVIF <source> and a WebP <img> fallback.
 * Every browser that renders an artifact decodes AVIF, so the WebP half is
 * dead weight -- 472 KB before base64. Move the AVIF srcset onto the <img>
 * and drop the <source>, and no WebP file is referenced at all.
 */
function avifOnly(html) {
  return html.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/g, (pic) => {
    const src = pic.match(/<source\b[^>]*type="image\/avif"[^>]*>/);
    if (!src) return pic;
    const set = src[0].match(/srcset="([^"]*)"/);
    if (!set) return pic;
    const first = set[1].trim().split(/\s+/)[0];
    return pic
      .replace(/<source\b[^>]*>\s*/g, '')
      .replace(/(<img\b[^>]*?)\ssrcset="[^"]*"/, `$1 srcset="${set[1]}"`)
      .replace(/(<img\b[^>]*?)\ssrc="[^"]*"/, `$1 src="${first}"`);
  });
}

const stagedPages = [];
for (const p of pageFiles) {
  let html = readFileSync(p, 'utf8');
  html = avifOnly(html);

  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="(\/_astro\/[^"]+\.js)"[^>]*>\s*<\/script>/g)];
  if (scripts.length) {
    const bundle = bundleFor(scripts.map((m) => m[1]));
    html = html.replace(scripts[0][0], `<script type="module">\n${bundle}\n</script>`);
    for (const m of scripts.slice(1)) html = html.replace(m[0], '');
  }

  html = html.replace(/window\.location\.href\s*=/g, 'window.__navTo=');
  html = html.replace(/location\.search/g, 'window.__search');
  html = html.replace(/<head>/i, '<head>' + SHIM);

  const route = routeOf(p);
  if (route === '/checkout/' || route === '/custom/') {
    // First child of the FORM: the site header is absolutely positioned over
    // the top of the document, and <main>'s top padding belongs to the
    // heading block, so neither is a safe anchor.
    html = html.replace(/(<form\b[^>]*>)/i, (m) => m + FORM_NOTICE);
  }
  stagedPages.push([route, html]);
}

/* ========================================================================
   3. Resources — only what something actually references.

   `dist/_astro` also contains the untouched source PNGs Astro emitted
   alongside the optimised variants. Nothing links to them; blindly packing
   every file added 596 KB (817 KB base64) of dead weight.
   ======================================================================== */
const cssText = new Map();
for (const [u, f] of byUrl) if (u.endsWith('.css')) cssText.set(u, readFileSync(f, 'utf8'));

const referenced = new Set();
const note = (text) => { for (const m of text.matchAll(ASSET_RE)) referenced.add(m[0]); };
for (const [, html] of stagedPages) note(html);
for (const c of jsCache.values()) note(c.body);
// CSS is only reachable if a page links it; follow those links one level.
for (const [u, css] of cssText) if (referenced.has(u)) note(css);

const RES = [];
const tokenFor = new Map();
const dataUri = (buf, ext) =>
  `data:${MIME[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`;

// `/media/*` is reached two ways: HTML/CSS name it in an attribute (the
// video poster), and the atelier script picks a source at runtime. Both read
// the SAME resource-table entry -- the map holds an index, not a second copy
// of the bytes -- so a token works for the markup and `__res` for the script.
const media = {};
for (const u of [...referenced].sort()) {
  const f = byUrl.get(u);
  if (!f) continue;
  const ext = extname(u);
  if (ext === '.js') continue;                       // inlined above
  if (u.startsWith('/media/')) {
    media[u] = RES.length;
    tokenFor.set(u, `@@R${RES.length}@@`);
    RES.push(dataUri(readFileSync(f), ext));
    continue;
  }
  const value = ext === '.css'
    ? `<style>${cssText.get(u).replace(ASSET_RE, (m) => {
        const g = byUrl.get(m);
        return g ? dataUri(readFileSync(g), extname(m)) : m;
      })}</style>`
    : dataUri(readFileSync(f), ext);
  tokenFor.set(u, `@@R${RES.length}@@`);
  RES.push(value);
}

const ROUTES = stagedPages.map(([route, html]) => [
  route,
  html
    .replace(/<link\b[^>]+rel="stylesheet"[^>]*href="(\/_astro\/[^"]+\.css)"[^>]*>/g,
      (m, href) => tokenFor.get(href) ?? m)
    .replace(ASSET_RE, (m) => tokenFor.get(m) ?? m),
]);

/* ========================================================================
   4. Shell. `</script` is escaped because the payload is embedded inside one;
   nothing else is escaped, so the copy stays real UTF-8 and readable.
   ======================================================================== */
const payload = { res: RES, routes: Object.fromEntries(ROUTES), media };
const shell = readFileSync(new URL('./preview-shell.html', import.meta.url).pathname, 'utf8')
  .replace('/*__PAYLOAD__*/null', JSON.stringify(payload).replace(/<\/script/gi, '<\\/script'));

writeFileSync(OUT, shell);
const bytes = Buffer.byteLength(shell);
console.log(`${ROUTES.length} routes, ${RES.length} resources, ${jsCache.size} js chunks inlined`);
console.log(`${(bytes / 1048576).toFixed(2)} MB -> ${OUT}`);
if (bytes > 16 * 1048576) { console.error('OVER 16 MB CAP'); process.exit(1); }
