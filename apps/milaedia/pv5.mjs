import { chromium } from '@playwright/test';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage({viewport:{width:1440,height:900}});
await pg.route('**fonts.g**',r=>r.abort());
await pg.goto('file:///tmp/claude-0/-home-user-ui-ux-pro-max-skill/a2f32733-7919-5e73-a972-f964cf818630/scratchpad/milaedia-site.html');
await pg.waitForTimeout(900);
await pg.evaluate(()=>window.postMessage({t:'nav',p:'/home'},'*')); await pg.waitForTimeout(1400);
const F=pg.frames()[1];
await F.evaluate(()=>document.querySelector('[data-atelier]')?.scrollIntoView({block:'center'}));
await pg.waitForTimeout(1800);
console.log('poster attr:', await F.evaluate(()=>(document.querySelector('[data-atelier-video]')?.getAttribute('poster')||'none').slice(0,34)));
console.log('weave bg   :', await F.evaluate(()=>getComputedStyle(document.querySelector('.plane-weave')||document.body).backgroundImage.slice(0,44)));
// is the atelier area actually painted (not black)?
console.log('atelier not blank:', await F.evaluate(()=>{
  const el=document.querySelector('[data-atelier]'); if(!el) return 'no atelier';
  const r=el.getBoundingClientRect(); return r.width>200 && r.height>200 ? `${Math.round(r.width)}x${Math.round(r.height)}` : 'collapsed';
}));
await pg.screenshot({path:'/tmp/shot-home.png', fullPage:false});
await F.evaluate(()=>window.scrollTo(0,0)); await pg.waitForTimeout(600);
await pg.screenshot({path:'/tmp/shot-top.png'});
await pg.evaluate(()=>window.postMessage({t:'nav',p:'/collections/luxury-rugs/isfahan-signature'},'*')); await pg.waitForTimeout(1500);
await pg.screenshot({path:'/tmp/shot-product.png'});
await pg.evaluate(()=>document.querySelector('#pill [data-mode="phone"]').click());
await pg.evaluate(()=>window.postMessage({t:'nav',p:'/home'},'*')); await pg.waitForTimeout(1500);
await pg.screenshot({path:'/tmp/shot-phone.png'});
await b.close();
