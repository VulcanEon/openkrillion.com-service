import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:3051',out=process.argv[3]||'output/mobile-flow',local=base.includes('localhost');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.render_game_to_text);await page.locator('#practice-btn').click();
 const answers=['Mashed potatoes','Bass','Adrian Peterson','Tungsten','Ghost station','France','Great Lakes Avengers'];
 for(let i=0;i<7;i++){
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='preview');if(local)await page.evaluate(()=>window.advanceTime(3100));await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='answering');await page.waitForTimeout(700);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:out+`/round-${i+1}.png`});
  if(i===2){await page.setViewportSize({width:390,height:480});await page.waitForTimeout(550);const card=await page.locator('#prompt-card').boundingBox(),hud=await page.locator('.hud').boundingBox(),dock=await page.locator('#answer-form').boundingBox();assert.ok(card.y>=hud.y+hud.height+10,'long question is below the HUD');assert.ok(card.y+card.height<dock.y-10,'long question is above input');await page.locator('#prompt-card').evaluate(e=>e.scrollTo(0,e.scrollHeight));await page.screenshot({path:out+'/long-question-short-viewport.png'});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);}
  await page.locator('#answer').fill(answers[i]);await page.locator('#answer').press('Enter');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='landed',null,{timeout:20000});await page.locator('#next-btn').click();
 }
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='done');await page.waitForFunction(()=>!document.getElementById('distribution').textContent.includes('Sounding'));await page.waitForTimeout(800);const state=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));assert.equal(state.results.length,7);assert.equal(state.score,395);const brand=await page.locator('.result-brand').boundingBox(),menu=await page.locator('#menu-btn').boundingBox();assert.ok(brand.x>=menu.x+menu.width+6||brand.y>=menu.y+menu.height+6,'results brand clears menu');assert.deepEqual(errors,[]);await page.screenshot({path:out+'/results.png'});await writeFile(out+'/report.json',JSON.stringify({ok:true,viewport:'390×844',shortViewport:'390×480',rounds:7,score:state.score,errors},null,2));console.log(JSON.stringify({ok:true,rounds:7,score:state.score,longQuestionShortViewport:'pass',errors}));
}finally{await browser.close();}
