import { chromium } from '@playwright/test';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const pg=await b.newPage();
await pg.setContent(`<video id=a muted playsinline src="file:///home/user/ui-ux-pro-max-skill/apps/milaedia/dist/media/atelier-weaver.mp4"></video>`);
await pg.evaluate(()=>document.getElementById('a').load());
await pg.waitForTimeout(2500);
console.log('direct file video:', await pg.evaluate(()=>{const v=document.getElementById('a');return {w:v.videoWidth,ready:v.readyState,err:v.error&&v.error.code};}));
console.log('canPlay h264:', await pg.evaluate(()=>document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"')));
await b.close();
