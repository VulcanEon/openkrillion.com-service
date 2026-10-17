import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { validateReference } from '../src/worker.mjs';
import { etDate } from '../public/rules.mjs';

const date=etDate();
const read=url=>JSON.parse(execFileSync('curl',['--fail','--silent','--show-error','--max-time','20',url],{maxBuffer:4*1024*1024}).toString());
const puzzle=validateReference(read('https://krillion.io/api/today'),read('https://krillion.io/api/reveal?date='+date),date);
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const file=process.argv[2]||'/tmp/openkrillion-reference-seed.sql';
const content=JSON.stringify(puzzle),chunks=content.match(/[\s\S]{1,12000}/g);
// Keep each SQL statement below D1's SQL text limit. Bound runtime writes use
// parameters, while this one-time import appends safe, quoted text chunks.
let sql=`INSERT INTO puzzles(date,day_number,source,content) VALUES(${quote(date)},${puzzle.dayNumber},${quote(puzzle.source)},'') ON CONFLICT(date) DO UPDATE SET content='',day_number=excluded.day_number,source=excluded.source;\n`;
for(const chunk of chunks)sql+=`UPDATE puzzles SET content=content||${quote(chunk)} WHERE date=${quote(date)};\n`;
await writeFile(file,sql);
await writeFile(file.replace(/\.sql$/,'.json'),content);
console.log(JSON.stringify({file,date,day:puzzle.dayNumber,prompts:puzzle.prompts.length,answers:puzzle.prompts.reduce((n,p)=>n+p.answers.length,0),bytes:Buffer.byteLength(content)}));
