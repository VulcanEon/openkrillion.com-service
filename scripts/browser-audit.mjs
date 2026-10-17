import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.argv[2]||'http://localhost:3051';
const output=process.argv[3]||'output/playwright/audit';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[],report=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' '+m.location().url)});page.on('response',r=>{if(r.status()>=500)console.log('HTTP failure',r.status(),r.url())});
  await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.render_game_to_text);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
  await page.screenshot({path:output+'/desktop-home.png'});
  assert.equal(await page.locator('#guide').getAttribute('open'),null);
  await page.locator('#guide-link').click();assert.ok(await page.locator('.guide-sheet').isVisible());
  const links=await page.locator('.ai-links a').evaluateAll(as=>as.map(a=>({href:a.href,target:a.target,rel:a.rel})));assert.equal(links.length,5);assert.equal(new Set(links.map(a=>new URL(a.href).searchParams.get('q'))).size,1);assert.ok(links.every(a=>a.target==='_blank'&&a.rel.includes('nofollow')));
  // Intercept external destinations; no AI question is actually submitted.
  await context.route(/https:\/\/(chatgpt\.com|claude\.ai|www\.perplexity\.ai|www\.google\.com|grok\.com)\//,r=>r.fulfill({status:200,contentType:'text/plain',body:'External AI request intercepted for audit'}));
  const popupPromise=page.waitForEvent('popup');await page.locator('.ai-links a').first().click();const popup=await popupPromise;await popup.waitForLoadState();assert.equal(new URL(popup.url()).hostname,'chatgpt.com');await popup.close();
  await page.screenshot({path:output+'/desktop-guide.png'});await page.locator('#close-guide').click();
  const local=base.includes('localhost');
  await page.locator(local?'#start-btn':'#practice-btn').click({force:true});await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='preview');
  if(local)await page.evaluate(()=>window.advanceTime(3100));else await page.waitForTimeout(3200);
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='answering');
  await page.waitForTimeout(450);await page.screenshot({path:output+'/desktop-answer.png'});
  await page.locator('#answer').fill('zzzzzzzzzz');await page.locator('#answer').press('Enter');await page.waitForFunction(()=>document.getElementById('answer-status').textContent.includes('no echo'));
  await page.locator('#answer').fill('mashed');await page.locator('#answer').press('Enter');await page.waitForFunction(()=>document.getElementById('answer-status').textContent.includes('corrects to'));assert.equal(await page.locator('#answer').inputValue(),'Mashed potatoes');
  await page.locator('#answer').press('Enter');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='landed',{timeout:15000});
  await page.waitForTimeout(1000);await page.screenshot({path:output+'/desktop-landing.png'});
  const answers=['Mara','Bob Pettit','Yttrium','Ghost station','France','Great Lakes Avengers'];
  for(let i=0;i<answers.length;i++){
    await page.locator('#next-btn').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='preview');
    if(local)await page.evaluate(()=>window.advanceTime(3100));else await page.waitForTimeout(3200);
    await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='answering');
    if(i===0){await page.locator('#menu-btn').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).paused);await page.waitForTimeout(120);await page.getByRole('button',{name:'Close menu',exact:true}).click();await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).paused);}
    if(i===5&&local){await page.locator('#answer').fill('');await page.evaluate(()=>window.advanceTime(26000));}else{await page.locator('#answer').fill(answers[i]);await page.locator('#answer').press('Enter');}
    await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='landed',{timeout:20000});
  }
  await page.locator('#next-btn').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='done',{timeout:20000});await page.waitForFunction(()=>!document.getElementById('distribution').textContent.includes('Sounding'));
  const state=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));assert.equal(state.results.length,7);assert.ok(state.score>=300);assert.equal(state.results[6].score,local?0:100);assert.equal(state.sound.state,'running');
  await page.screenshot({path:output+'/desktop-results.png'});await page.locator('[data-review="3"]').click();assert.ok(await page.locator('.review-expanded').nth(3).isVisible());
  await page.locator('#copy-result').click();assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('OpenKrillion'));
  await page.reload();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='done');assert.equal(JSON.parse(await page.evaluate(()=>window.render_game_to_text())).score,state.score);report.push({desktop:'pass',game:state});
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,colorScheme:'light'});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
  await mp.goto(base+'/?test=1&lang=zh');await mp.waitForFunction(()=>window.render_game_to_text);await mp.evaluate(()=>document.fonts.ready);await mp.waitForFunction(()=>/DIVE #/.test(document.getElementById('day-number').textContent));await mp.screenshot({path:output+'/mobile-home.png'});
  assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mp.locator('#guide-link').click();const chinese=await mp.locator('.ai-links a').evaluateAll(as=>as.map(a=>new URL(a.href).searchParams.get('q')));assert.ok(chinese.every(q=>q.includes('用中文回答')));await mp.screenshot({path:output+'/mobile-guide.png'});await mp.locator('#close-guide').click();
  await mp.locator(local?'#start-btn':'#practice-btn').click({force:true});await mp.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='preview');if(local)await mp.evaluate(()=>window.advanceTime(3100));else await mp.waitForTimeout(3200);await mp.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='answering');await mp.waitForTimeout(700);await mp.screenshot({path:output+'/mobile-answer.png'});
  await mp.setViewportSize({width:390,height:480});await mp.waitForTimeout(450);await mp.screenshot({path:output+'/mobile-keyboard-height.png'});const dock=await mp.locator('#answer-form').boundingBox();assert.ok(dock.y+dock.height<=480);assert.ok(dock.y>=0);const prompt=await mp.locator('#prompt-card').boundingBox();const hud=await mp.locator('.hud').boundingBox();assert.ok(prompt.y>=hud.y+hud.height+15,'short viewport keeps prompt below the HUD');assert.ok(prompt.y+prompt.height<dock.y-15,'short viewport keeps prompt above input');
  report.push({mobile:'pass',chinesePrompts:'pass',keyboardHeight:'pass'});
  await writeFile(output+'/report.json',JSON.stringify({report,errors},null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,output,checks:report.map(r=>Object.keys(r)),errors}));
}finally{await browser.close();}
