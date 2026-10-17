import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { shrimp, fish, squid, angler } from './pixel-art.mjs';
import { siClaude, siPerplexity, siGooglegemini } from 'simple-icons';
import { documents } from '../src/docs.mjs';
import { SITE } from '../src/config.mjs';
import { homePage } from '../src/html.mjs';

await mkdir('public/assets',{recursive:true});
const sprite=shrimp();
for(const[name,svg]of Object.entries({'krill':sprite,'krill-gold':shrimp('gold'),'evil':shrimp('evil'),'schooler':fish(),'tooclever':fish(true),'rare':squid(),'deepcut':angler()}))await writeFile('public/assets/'+name+'.svg',svg);
await copyFile('node_modules/@fontsource/vt323/files/vt323-latin-400-normal.woff2','public/assets/vt323-latin-400-normal.woff2');
await copyFile('node_modules/@fontsource/vt323/LICENSE','public/assets/VT323-LICENSE.txt');
for(const[name,icon]of [['claude',siClaude],['perplexity',siPerplexity],['gemini',siGooglegemini]])await writeFile(`public/assets/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img"><title>${icon.title}</title><path fill="currentColor" d="${icon.path}"/></svg>`);
for(const name of ['chatgpt','grok']){const text=await readFile(`public/assets/${name}.svg`,'utf8');if(!text.includes('<svg')||/<script|\bonload\s*=|\bonerror\s*=/.test(text))throw new Error('Invalid local icon: '+name);}
for(const[size,name]of [[32,'favicon.png'],[180,'apple-touch-icon.png'],[256,'icon.png']]){
  const bg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size/6}" fill="#09192b"/></svg>`);
  await sharp(bg).composite([{input:await sharp(Buffer.from(sprite)).resize(Math.floor(size*.8),Math.floor(size*.8),{kernel:'nearest'}).png().toBuffer(),gravity:'centre'}]).png().toFile('public/assets/'+name);
}
const og=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#93d5e6"/><stop offset="1" stop-color="#dbf0f1"/></linearGradient><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#1d5580"/><stop offset="1" stop-color="#050a14"/></linearGradient></defs><rect width="1200" height="630" fill="#050a14"/><path fill="url(#sky)" d="M0 0h1200v330H0z"/><path fill="url(#sea)" d="M0 320q150-12 300 0t300 0t300 0t300 0v310H0z"/><g fill="#fff" opacity=".75"><path d="M90 76h30V58h70V42h70v18h35v20h40v24H90zM860 60h40V42h80V26h50v18h40v24h50v22H860z"/></g><text x="598" y="213" text-anchor="middle" font-family="monospace" font-size="82" font-weight="bold" letter-spacing="4" fill="#ff5d8f">OPENKRILLION</text><text x="605" y="206" text-anchor="middle" font-family="monospace" font-size="82" font-weight="bold" letter-spacing="4" fill="#4de3ff">OPENKRILLION</text><text x="601" y="210" text-anchor="middle" font-family="monospace" font-size="82" font-weight="bold" letter-spacing="4" fill="#e8f1ff">OPENKRILLION</text><text x="600" y="275" text-anchor="middle" font-family="monospace" font-size="23" letter-spacing="7" fill="#258ca8">THE OPEN-SOURCE DAILY DIVE</text><text x="600" y="427" text-anchor="middle" font-family="monospace" font-size="25" fill="#d5e7f4">7 prompts · 25 seconds · think rare, dive deeper</text><rect x="300" y="480" width="600" height="67" fill="#101d33" stroke="#4de3ff" stroke-width="3"/><text x="600" y="524" text-anchor="middle" font-family="monospace" font-size="27" letter-spacing="5" fill="#e8f1ff">▼ BEGIN DESCENT ▼</text><text x="600" y="595" text-anchor="middle" font-family="monospace" font-size="17" letter-spacing="3" fill="#7d93b8">openkrillion.com · free to play · MIT source code</text></svg>`;
await sharp(Buffer.from(og)).png().toFile('public/assets/og.png');
// Build snapshots document drift; HTTP routes use the same renderers and configuration.
await mkdir('docs/generated',{recursive:true});
for(const[path,body]of Object.entries(documents()))await writeFile('docs/generated/'+path.slice(1),body);
const text=homePage().replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' '),words=text.match(/[A-Za-z]+(?:[’'-][A-Za-z]+)*/g)||[],count=words.filter(w=>w.toLowerCase()==='krillion').length;
await writeFile('docs/build-report.json',JSON.stringify({name:SITE.name,words:words.length,krillion:count,density:count/words.length*100,documents:Object.keys(documents()),languages:SITE.languages},null,2)+'\n');
console.log(`Built original pixel assets, font and five local AI icons. Homepage: ${words.length} words; krillion ${count} (${(100*count/words.length).toFixed(2)}%). Four documents synchronized.`);
if(words.length<=1500||count/words.length<=.03)throw new Error('Homepage word count or keyword density below requested threshold');
