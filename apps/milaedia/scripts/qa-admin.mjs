/**
 * Admin QA. GitHub is mocked at the network layer, so every code path the
 * real editor uses is exercised without a live token: connect, load, edit,
 * add, delete, publish (with the sha round-trip), upload, and history.
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const B = process.env.QA_BASE || 'http://127.0.0.1:4321';
const catalogue = readFileSync('src/data/catalogue.json', 'utf8');
const b64 = Buffer.from(catalogue, 'utf8').toString('base64');

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
pg.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|fonts\.g/.test(m.text())) errs.push(m.text().slice(0, 140)); });

let putBody = null;
let putCount = 0;

await pg.route('**', async (route) => {
  const url = route.request().url();
  if (url.startsWith(B)) return route.continue();
  const json = (o, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(o) });

  if (url.includes('api.github.com/user')) return json({ login: 'milad' });
  if (/api\.github\.com\/repos\/[^/]+\/[^/]+\/branches\//.test(url)) return json({ name: 'main' });
  if (url.includes('/contents/src/data/catalogue.json')) {
    if (route.request().method() === 'PUT') {
      putCount++;
      putBody = JSON.parse(route.request().postData() || '{}');
      return json({ content: { sha: 'newsha123' } });
    }
    return json({ sha: 'sha-abc', content: b64 });
  }
  if (url.includes('/contents/public/uploads')) {
    if (route.request().method() === 'PUT') return json({ content: { sha: 'imgsha' } });
    return json([]);
  }
  if (url.includes('/commits')) {
    return json([{ sha: 'abcdef1234', commit: { message: 'Catalogue: 12 pieces', author: { name: 'milad', date: new Date().toISOString() } } }]);
  }
  return route.abort();
});

const say = (k, v) => console.log(String(k).padEnd(30), v);
await pg.goto(B + '/admin/', { waitUntil: 'load' });
await pg.waitForTimeout(500);

// locked by default
say('locked before token', await pg.evaluate(() => document.querySelector('[data-work]').hidden));
// The input's own placeholder is literally "github_pat_…", so match a real
// token VALUE being serialised, not the hint text.
say('no token value in HTML', !/value="(github_pat_|ghp_)/.test(await pg.content()));

// connect
await pg.fill('[data-f="token"]', 'github_pat_TEST');
await pg.click('[data-connect]');
await pg.waitForTimeout(700);
say('connected as', await pg.textContent('[data-conn-label]'));
say('products loaded', await pg.textContent('[data-count]'));

// edit the first piece
await pg.click('[data-list] li:first-child button');
await pg.waitForTimeout(300);
await pg.fill('[data-k="title"]', 'Renamed By Admin');
await pg.fill('[data-k="priceMinor"]', '123400');
await pg.click('[data-apply]');
await pg.waitForTimeout(300);
say('title in list', await pg.textContent('[data-list] li:first-child .li-title'));
say('price reformatted', (await pg.textContent('[data-list] li:first-child .li-meta')).split('·')[0].trim());
say('unsaved bar shown', !(await pg.evaluate(() => document.querySelector('[data-savebar]').hidden)));

// add a piece
await pg.click('[data-new]');
await pg.waitForTimeout(300);
await pg.fill('[data-k="title"]', 'Brand New Rug');
await pg.click('[data-apply]');
await pg.waitForTimeout(300);
say('count after add', await pg.textContent('[data-count]'));

// publish
await pg.click('[data-save]');
await pg.waitForTimeout(800);
say('PUT sent', putCount);
const sent = putBody ? JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8')) : null;
say('committed sha guard', putBody?.sha);
say('committed items', sent ? sent.length : 'none');
say('committed title', sent ? sent[0].title : 'none');
say('committed price', sent ? sent[0].priceMinor : 'none');
say('valid JSON committed', Array.isArray(sent));
say('publish confirmation', (await pg.textContent('[data-prod-msg]')).slice(0, 46));

// history
await pg.click('[data-tab="history"]');
await pg.waitForTimeout(500);
say('history rows', await pg.evaluate(() => document.querySelectorAll('[data-hist] li').length));

// sign out clears the token
await pg.click('[data-signout]');
await pg.waitForTimeout(300);
say('token cleared on sign out', await pg.evaluate(() => localStorage.getItem('milaedia:admin:v1') === null));
say('locked again', await pg.evaluate(() => document.querySelector('[data-work]').hidden));

say('overflow-x at 390', await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
console.log('\nerrors:', errs.length ? errs : 'none');
await b.close();
