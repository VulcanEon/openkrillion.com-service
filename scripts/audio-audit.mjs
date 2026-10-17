import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:3051',output=process.argv[3]||'output/audio';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  const page=await browser.newPage();await page.goto(base);await page.waitForFunction(()=>window.render_game_to_text);
  const results=await page.evaluate(async()=>{
    const {Sound}=await import('/sound.mjs');const report=[];
    for(const name of ['begin','submit','reject','tick','tier','sink','plankton','tooclever','schooler','rare','deepcut','krillion','miss','surface','blub']){
      const ac=new OfflineAudioContext(1,96000,48000);Object.defineProperty(ac,'state',{get:()=> 'running'});
      const sound=new Sound();sound.ac=ac;sound.master=ac.createGain();sound.master.gain.value=.75;sound.master.connect(ac.destination);sound.event(name);
      const samples=(await ac.startRendering()).getChannelData(0);
      const rms=(a,b)=>{const cut=samples.slice(Math.floor(a*48000),Math.floor(b*48000));return Math.sqrt(cut.reduce((n,x)=>n+x*x,0)/cut.length)};
      let crossings=0;for(let i=1;i<960;i++)if(samples[i]>=0&&samples[i-1]<0)crossings++;
      report.push({name,attackAmplitude:Math.abs(samples[48]),peak:Math.max(...samples.map(Math.abs)),rms:rms(0,1.8),first:rms(.01,.03),gap:rms(.085,.105),second:rms(.125,.145),tail:rms(1.8,1.99),frequency:crossings/.02,samples:Array.from(samples)});
    }
    const silent=new OfflineAudioContext(1,96000,48000);Object.defineProperty(silent,'state',{get:()=> 'running'});const muted=new Sound();muted.ac=silent;muted.master=silent.createGain();muted.master.connect(silent.destination);muted.muted=true;muted.event('krillion');const quiet=(await silent.startRendering()).getChannelData(0);report.push({name:'muted',peak:Math.max(...quiet.map(Math.abs)),tail:0,samples:Array.from(quiet)});
    return report;
  });
  for(const r of results){if(r.name==='muted')assert.equal(r.peak,0,'muted audio stays silent');else assert.ok(r.peak>0&&r.peak<1,`${r.name}: audible without clipping`);assert.ok(r.tail<.0001,`${r.name}: envelope ends cleanly`);const wav=Buffer.alloc(44+r.samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(96000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(r.samples.length*2,40);r.samples.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));await writeFile(output+'/'+r.name+'.wav',wav);delete r.samples;}
  const submit=results.find(r=>r.name==='submit'),tick=results.find(r=>r.name==='tick');assert.ok(submit.attackAmplitude>.02&&submit.attackAmplitude<.05,'submit has the short linear attack, rather than a soft exponential fade-in');assert.ok(Math.abs(submit.frequency-1150)<80,'submit is the 1,150 Hz ping');assert.ok(tick.first>.01&&tick.second>.001&&tick.gap<.0001,'countdown has two distinct pulses 120 ms apart');
  await writeFile(output+'/report.json',JSON.stringify({ok:true,sampleRate:48000,events:results},null,2));console.log(JSON.stringify({ok:true,events:results.filter(r=>r.name!=='muted').length,mute:'silent',clipping:false,submitFrequency:submit.frequency,countdown:'two pulses, 120 ms apart',output}));
}finally{await browser.close();}
