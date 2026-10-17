import { execFileSync } from 'node:child_process';
import { cp, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';

const root=await realpath(new URL('..',import.meta.url).pathname);
const target=await realpath(process.argv[2]||path.resolve(root,'../openkrillion.com-service'));
if(target===root)throw new Error('Choose the separate public checkout.');
const remote=execFileSync('git',['remote','get-url','origin'],{cwd:target,encoding:'utf8'}).trim();
if(!/github\.com[:/]VulcanEon\/openkrillion\.com-service(?:\.git)?$/.test(remote))throw new Error('Public destination repository mismatch.');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const denied=/(^|\/)(?:\.git|node_modules|\.wrangler|private|output)(?:\/|$)|wrangler\.production|(?:^|\/)\.env|(?:^|\/)\.dev\.vars(?!\.example$)/;
for(const file of [...new Set(files)]){
  if(denied.test(file)||file.includes('..'))throw new Error('Unsafe public file: '+file);
  await mkdir(path.dirname(path.join(target,file)),{recursive:true});
  await cp(path.join(root,file),path.join(target,file));
}
console.log(`Copied ${new Set(files).size} sanitized application files. Review and commit in the public checkout.`);
