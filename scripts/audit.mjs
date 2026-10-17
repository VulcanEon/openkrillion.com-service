import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { homePage } from '../src/html.mjs';
import { documents, aiLinks } from '../src/docs.mjs';

const html=homePage();
assert.ok(html.includes('https://openkrillion.com/'));
assert.ok(html.includes('AI &amp; Agent Docs'));
for(const path of Object.keys(documents()))assert.ok(html.includes(`href="${path}"`));
for(const lang of ['en','zh'])assert.equal(aiLinks(lang).length,5);
const scan=async dir=>{for(const entry of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())await scan(path);else if(/\.(mjs|js|json|jsonc|md|txt|sql|html|css|example)$/.test(path)){const text=await readFile(path,'utf8');assert.ok(!/gh[pousr]_[A-Za-z0-9]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text),'Sensitive material in '+path);}}};
for(const dir of ['src','public','scripts','tests','docs','migrations'])await scan(dir);
const report=JSON.parse(await readFile('docs/build-report.json','utf8'));assert.ok(report.words>1500);assert.ok(report.density>3);
const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));assert.equal(config.d1_databases[0].database_id,'00000000-0000-0000-0000-000000000000');assert.ok(!config.account_id);
console.log(JSON.stringify({ok:true,seo:report,publicConfigSanitized:true}));
