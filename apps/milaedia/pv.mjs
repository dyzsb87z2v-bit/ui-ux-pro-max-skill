import { chromium } from '@playwright/test';
const FILE='file:///tmp/claude-0/-home-user-ui-ux-pro-max-skill/a2f32733-7919-5e73-a972-f964cf818630/scratchpad/milaedia-site.html';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];
pg.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|fonts\./.test(m.text()))errs.push(m.text().slice(0,240));});
pg.on('pageerror',e=>errs.push('PAGEERROR '+String(e).slice(0,240)));
await pg.route('**fonts.g**',r=>r.abort());
await pg.goto(FILE); await pg.waitForTimeout(1200);
const F=()=>pg.frames()[1];
const nav=async p=>{await pg.evaluate(x=>window.postMessage({t:'nav',p:x},'*'),p);await pg.waitForTimeout(900);};
const say=(k,v)=>console.log(k.padEnd(30),v);

say('encoding (title)', await F().evaluate(()=>document.title));

// intro gate
say('intro gate present', await F().evaluate(()=>!!document.querySelector('[data-intro],[data-enter],.cover')));
// click the enter affordance
const entered = await F().evaluate(()=>{const a=document.querySelector('a[href="/home"],[data-enter]');if(!a)return 'no enter control';a.click();return 'clicked';});
say('intro enter', entered); await pg.waitForTimeout(1000);
say('route after enter', await pg.locator('#route').textContent());

// product -> add to bag
await nav('/collections/luxury-rugs/isfahan-signature');
say('viewer mode', await F().evaluate(()=>document.querySelector('[data-viewer]')?.getAttribute('data-mode')||document.querySelector('[data-rug-viewer]')?.outerHTML.slice(0,60)||'n/a'));
await F().evaluate(()=>document.querySelector('[data-add-line]').click()); await pg.waitForTimeout(400);
say('bag count (localStorage)', await pg.evaluate(()=>JSON.parse(localStorage.getItem('milaedia:bag:v1')||'[]').length));
await nav('/collections/antique-rugs/tabriz-garden-antique');
await F().evaluate(()=>document.querySelector('[data-add-line]').click()); await pg.waitForTimeout(400);
say('header badge', await F().evaluate(()=>document.querySelector('[data-bag-count]')?.textContent));

await nav('/bag');
say('bag lines', await F().evaluate(()=>document.querySelectorAll('[data-bag-lines] .line').length));
say('subtotal', await F().evaluate(()=>document.querySelector('[data-bag-subtotal]')?.textContent));

await nav('/checkout');
await F().evaluate(()=>document.querySelector('[data-checkout]').requestSubmit()); await pg.waitForTimeout(400);
say('empty-form guard', (await F().evaluate(()=>document.querySelector('[data-co-note]')?.textContent))||'(none)');
await F().evaluate(()=>{for(const el of document.querySelectorAll('[data-checkout] [required]')){if(el.tagName==='SELECT'){const o=[...el.options].find(o=>o.value);el.value=o?o.value:'';}else el.value=el.type==='email'?'a@b.co':'Musterstrasse 1';}document.querySelector('[data-checkout]').requestSubmit();});
await pg.waitForTimeout(1000);
say('checkout ->', await pg.locator('#route').textContent());
say('order ref', await F().evaluate(()=>document.querySelector('[data-ref]')?.textContent));
say('bag cleared', await pg.evaluate(()=>JSON.parse(localStorage.getItem('milaedia:bag:v1')||'[]').length));

// sold piece
await nav('/collections/antique-silk-tapestries/hunting-silk-tapestry-antique');
say('sold CTA', await F().evaluate(()=>{const b=document.querySelector('[data-add-line]');return (b?.textContent||'').trim()+' / disabled='+b?.getAttribute('aria-disabled');}));

// search
await nav('/search?q=silk'); 
say('search results', await F().evaluate(()=>document.querySelector('[data-count]')?.textContent+' | li='+document.querySelectorAll('[data-results] li').length));

// gallery lightbox
await nav('/gallery');
await F().evaluate(()=>document.querySelector('[data-lb-open],figure button,figure a')?.click()); await pg.waitForTimeout(500);
say('lightbox img', await F().evaluate(()=>{const i=document.querySelector('[data-lb-img]');return i?(i.currentSrc?'loaded '+i.naturalWidth+'px':'empty'):'n/a';}));

// mobile
await pg.evaluate(()=>document.querySelector('#pill [data-mode="phone"]').click()); await pg.waitForTimeout(300);
await nav('/home');
say('phone overflow-x', await F().evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth));
say('phone menu trigger', await F().evaluate(()=>getComputedStyle(document.querySelector('[data-menu-open]')).display));

console.log('\nERRORS:', errs.length?errs.slice(0,8):'none');
await b.close();
