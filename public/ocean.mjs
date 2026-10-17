import { easeInOut, easeOut } from './presentation.mjs';
import { Seascape } from './seascape.mjs';
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const stops=[[0,[29,85,128]],[150,[18,58,94]],[350,[11,21,38]],[800,[8,16,32]],[1400,[5,10,20]],[2600,[3,7,15]],[5200,[2,5,11]]];
function colorAt(depth){let i=stops.findIndex(([d])=>d>depth);if(i<0)return stops.at(-1)[1];if(!i)return stops[0][1];const[a,c]=stops[i-1],[b,k]=stops[i];return c.map((n,j)=>Math.round(mix(n,k[j],(depth-a)/(b-a))));}
const landmarks=[[60,'light begins to fade','L'],[200,'most sunlight stops here','R'],[332,'deepest scuba dive ever — 332m','R'],[385,'sperm whales hunt below here','L'],[535,'emperor penguins dive this deep','R'],[660,'pressure: 67x the surface','L'],[800,'siphonophore drift zone','R'],[1040,'THE MIDNIGHT ZONE','L'],[1240,'anglerfish territory','R'],[1550,'sperm whales duel giant squid here','L'],[1850,'giant squid territory','R'],[2150,'colossal squid eyes: football-sized','L'],[2500,'the water is 2°C and utterly black','R'],[3000,'THE ABYSSAL ZONE','L'],[3800,'the Titanic rests here — 3,800m','R'],[4400,'cusk eels patrol the plain','L'],[4900,'the abyssal plain stretches out','R'],[5500,'deeper than most submarines survive','L'],[6000,'THE HADAL ZONE','R'],[6500,'named for Hades. fitting.','L'],[7000,'the trench floor — a perfect dive ends here','R']];
function seed(n){const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v);}
export class Ocean {
  constructor(canvas,mascot){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.mascot=mascot;
    this.scenery=new Seascape();this.phase='intro';this.depth=0;this.target=0;this.cameraDepth=-45;this.cameraTarget=-45;this.active=0;this.targetActive=0;this.time=0;this.particles=[];this.fx=null;
    this.lowPower=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.last=0;this.mx=.72;this.my=.66;
    this.sprites={};for(const name of ['krill','krill-gold','schooler','rare','deepcut','tooclever']){const img=new Image();img.src='/assets/'+name+'.svg';this.sprites[name]=img;}
    this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);requestAnimationFrame(t=>this.tick(t));
  }
  layout(){const mobile=this.w<700,rail=this.w>=1200?180:0,bottom=mobile?50:90;return{mobile,rail,bottom,height:this.h-bottom,left:rail,width:this.w-rail*2,center:this.w/2-24};}
  resize(){const previousHeight=this.h,previousWidth=this.w;this.w=this.canvas.clientWidth;this.h=this.canvas.clientHeight;this.canvas.width=Math.ceil(this.w/2);this.canvas.height=Math.ceil(this.h/2);this.ctx.setTransform(.5,0,0,.5,0,0);this.ctx.imageSmoothingEnabled=false;
    if(previousHeight&&(previousHeight!==this.h||previousWidth!==this.w)&&['preview','answering'].includes(this.phase)){const l=this.layout(),cardHeight=document.getElementById('prompt-card')?.offsetHeight||180,dockTop=l.height-80;this.roundAnchor=Math.max(8,Math.min(l.mobile?175:210,(dockTop-cardHeight)/2));this.cameraDepth=this.cameraTarget=(this.roundBase||0)+(l.height/2-this.roundAnchor)/2;this.cameraJob=null;}
    this.draw();}
  moveCamera(to,duration=2200,ease=easeInOut){this.cameraTarget=to;this.cameraJob={from:this.cameraDepth,to,start:performance.now(),duration:this.reduced?1:duration,ease};}
  setPhase(phase){this.phase=phase;this.targetActive=phase==='intro'||phase==='done'?0:1;if(phase==='intro')this.moveCamera(-45,700);}
  setDepth(value){this.target=value;if(!['plunge','surface'].includes(this.phase)){this.depth=value;if(this.phase==='landed')this.moveCamera(value+30,500);}}
  round(depth){this.target=depth;this.depth=depth;this.fx=null;this.roundBase=depth;const l=this.layout(),card=document.getElementById('prompt-card'),dockTop=l.height-80,cardHeight=card?.offsetHeight||180;this.roundAnchor=Math.max(8,Math.min(l.mobile?175:210,(dockTop-cardHeight)/2));this.moveCamera(depth+(l.height/2-this.roundAnchor)/2,2200);}
  drop(oldDepth,result,progress){this.cameraJob=null;this.fx={tier:result.tier,progress,startDepth:oldDepth,resultDepth:oldDepth+result.score*10};const eased=result.tier==='plankton'?(1-Math.cos(Math.PI*progress))/2:easeInOut(progress);this.cameraDepth=mix(oldDepth+120,oldDepth+result.score*10+30,eased);this.cameraTarget=oldDepth+result.score*10+30;this.depth=result.tier==='krillion'?oldDepth:mix(oldDepth,oldDepth+result.score*10,eased);this.target=oldDepth+result.score*10;}
  typeAt(x,y,n=2){if(this.reduced)return;for(let i=0;i<n;i++)this.particles.push({x:x+(Math.random()-.5)*8,y:y+Math.random()*10,vx:(Math.random()-.5)*8,vy:-35-Math.random()*15,life:1,color:'#b2dce8',bubble:true,r:1+Math.random()*2});}
  burst(color='#4de3ff',n=30){if(this.reduced)return;const l=this.layout();for(let i=0;i<(this.lowPower?n/3:n);i++)this.particles.push({x:l.center,y:l.height/2-60,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*240-40,life:1,color});}
  tick(now){const dt=Math.min(.05,(now-this.last)/1000||.016);if(!document.hidden&&(!this.lowPower||now-this.last>=50)){this.dt=dt;this.last=now;this.time+=this.reduced?0:dt;if(this.cameraJob){const job=this.cameraJob,t=clamp((now-job.start)/job.duration,0,1);this.cameraDepth=mix(job.from,job.to,job.ease(t));if(t===1)this.cameraJob=null;}this.active=mix(this.active,this.targetActive,1-Math.exp(-3.6*dt));for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.bubble)p.vy+=90*dt;p.life-=dt*.65;}this.particles=this.particles.filter(p=>p.life>0);this.draw();}requestAnimationFrame(t=>this.tick(t));}
  cloud(x,y,scale){const c=this.ctx;const blocks=[[0,4,5,2],[2,3,7,3],[4,1,5,5],[6,0,4,5],[9,2,4,4],[12,3,5,2],[15,4,5,1],[1,5,6,1],[8,5,5,1]];c.fillStyle='#eaf6fa';for(const[a,b,w,h]of blocks)c.fillRect(Math.round(x+a*scale),Math.round(y+b*scale),w*scale,h*scale);c.fillStyle='#c8e0e8';for(const[a,b,w,h]of [[1,5,4,1],[5,4,2,1],[8,5,4,1],[13,4,3,1]])c.fillRect(x+a*scale,y+b*scale,w*scale,h*scale);}
  boat(x,y,s){const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);c.fillStyle='#061e2c';
    for(const[a,b,w,h]of[[0,-5,2,3],[1,-6,3,5],[3,-4,23,3],[4,-1,20,1],[5,0,18,1],[23,-5,4,2],[26,-7,4,1],[25,-6,3,2],[10,-10,10,1],[11,-9,2,5],[17,-9,2,5],[14,-20,1,11]])c.fillRect(a,b,w,h);
    c.fillStyle='#ff5682';for(const[a,b,w,h]of[[9,-17,5,3],[10,-19,4,2],[8,-16,6,2],[7,-15,3,1]])c.fillRect(a,b,w,h);c.fillStyle='#e6386a';c.fillRect(8,-15,6,1);
    c.fillStyle='#9cc9d8';c.fillRect(13,-9,1,3);c.fillRect(16,-9,1,3);c.restore();}
  fish(x,y,s,dir=1,glow=false){const c=this.ctx;c.save();c.translate(x,y);c.scale(dir*s,s);c.fillStyle=glow?'#0b515e':'#031522';c.beginPath();c.ellipse(0,0,8,3.5,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(-7,0);c.lineTo(-14,-4);c.lineTo(-14,4);c.closePath();c.fill();if(glow){c.fillStyle='#52cdd6';c.fillRect(4,-1,1,1);}c.restore();}
  bubble(x,y,r,alpha=.5){const c=this.ctx;c.strokeStyle=`rgba(173,218,238,${alpha})`;c.lineWidth=1;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();if(r>4){c.strokeStyle=`rgba(224,247,255,${alpha*.7})`;c.beginPath();c.arc(x-1,y-1,r-2,Math.PI,Math.PI*1.5);c.stroke();}}
  draw(){
    if(!this.ctx)return;const c=this.ctx,w=this.w,h=this.h,t=this.time,l=this.layout(),sea=l.height/2-this.cameraDepth*2,worldY=d=>l.height/2+(d-this.cameraDepth)*2;
    c.fillStyle='#050a14';c.fillRect(0,0,w,h);
    if(sea>0){const sky=c.createLinearGradient(0,sea-620,0,sea);sky.addColorStop(0,'#81cbe8');sky.addColorStop(.6,'#a8dcef');sky.addColorStop(1,'#f1f9ff');c.fillStyle=sky;c.fillRect(0,0,w,sea+8);
      if(l.mobile){const sunX=w*.79,sunY=sea-151;c.fillStyle='#ffdf85';c.fillRect(sunX,sunY,38,38);c.fillStyle='#ffeaa7';c.fillRect(sunX-4,sunY+8,46,22);this.cloud(40,sea-147,6.5);this.cloud(210,sea-140,3.5);this.cloud(142,sea-105,4);this.cloud(-25,sea-100,3);this.cloud(335,sea-110,5);}
      else{const sy=sea-600,sunX=w*.84,sunY=sy+80;c.fillStyle='#ffdf85';c.fillRect(sunX,sunY,128,128);c.fillStyle='#ffeaa7';c.fillRect(sunX-8,sunY+12,144,104);this.cloud(w*.1,sy+20,24);this.cloud(w*.54,sy+40,13);this.cloud(w*.36,sy+205,17);this.cloud(-120,sy+215,12);this.cloud(w*.85,sy+230,16);}
      this.boat(w*.25,sea+3,w/288);
    }
    for(let y=Math.max(0,Math.floor(sea)-3);y<h;y+=6){const d=Math.max(0,this.cameraDepth+(y-l.height/2)/2);const color=colorAt(d);c.fillStyle=`rgb(${color.join(',')})`;c.fillRect(0,y,w,7);}
    if(sea>-10&&sea<h+10){c.fillStyle='#1d5580';c.beginPath();c.moveTo(0,sea+8);for(let x=0;x<=w+12;x+=12)c.lineTo(x,sea+Math.sin(x*.011+t*.7)*3+Math.sin(x*.024-t*.3)*2);c.lineTo(w,sea+14);c.lineTo(0,sea+14);c.fill();}
    this.scenery.draw(c,w,h,worldY);
    for(let i=0;i<(this.lowPower?65:220);i++){const x=seed(i+91)*w,yy=((seed(i+331)*h+t*(1+seed(i)*4)+this.cameraDepth*.35)%h+h)%h;if(yy<sea)continue;c.fillStyle=`rgba(190,224,248,${.08+seed(i+2)*.26})`;c.fillRect(x,yy,seed(i+20)>.8?2:1,seed(i+20)>.8?2:1);}
    for(let i=0;i<(l.mobile?14:26);i++){const d=i<(l.mobile?5:10)?75+seed(i+7)*45:this.cameraDepth+(seed(i+7)-.5)*400,yy=worldY(d);if(yy<sea+20||yy<-20||yy>h+20)continue;const direction=i%2?1:-1,x=((seed(i+32)*w+t*(4+seed(i+40)*13)*direction)%(w+60)+w+60)%(w+60)-30;this.fish(x,yy,.6+seed(i+9)*.8,direction,this.cameraDepth>600&&i%7===0);}
    this.seaLife(worldY,l);
    if(this.cameraDepth>3200){const floorY=worldY(7000);c.fillStyle='#09192b';c.beginPath();c.moveTo(0,floorY);for(let x=0;x<=w+20;x+=12)c.lineTo(x,floorY+Math.sin(x*.014)*30+Math.sin(x*.045)*9);c.lineTo(w,h);c.lineTo(0,h);c.fill();}
    const rulerX=w-l.rail-14;c.lineWidth=1.5;c.strokeStyle='#7d93b88c';c.fillStyle='#7d93b8e6';c.font='13px VT323';c.textAlign='right';c.beginPath();c.moveTo(rulerX,Math.max(0,sea));c.lineTo(rulerX,l.height);c.stroke();
    const minD=Math.max(0,Math.floor((this.cameraDepth-l.height/4)/10)*10),maxD=this.cameraDepth+l.height/4;
    for(let d=minD;d<=maxD;d+=10){const yy=worldY(d);if(yy<0||yy>l.height)continue;const size=d%100===0?16:d%50===0?10:5;c.beginPath();c.moveTo(rulerX-size,yy);c.lineTo(rulerX,yy);c.stroke();if(d%100===0&&(!this.roundIndex||Math.abs(yy-worldY(this.target))>14))c.fillText(d===0?'0m':`-${d.toLocaleString()}m`,rulerX-size-5,yy+4);}
    if(this.roundIndex){const yy=worldY(this.target);if(yy>0&&yy<l.height){c.fillStyle='#ff5d8f';c.beginPath();c.moveTo(rulerX+4,yy);c.lineTo(rulerX+12,yy-5);c.lineTo(rulerX+12,yy+5);c.fill();c.strokeStyle='#ff5d8f';c.beginPath();c.moveTo(rulerX-20,yy);c.lineTo(rulerX+4,yy);c.stroke();c.fillText('YOU',rulerX-24,yy+4);}}
    c.font=`${l.mobile?13:17}px VT323`;c.fillStyle=this.phase==='plunge'?'#7d93b8d9':'#7d93b81a';for(const[d,text,side]of landmarks){const yy=worldY(d);if(yy<90||yy>l.height-100)continue;if(['intro','done'].includes(this.phase))continue;c.textAlign=side==='L'?'left':'right';c.fillText(side==='L'?`── ${text}`:`${text} ──`,side==='L'?l.left+l.width*.05:w-l.rail-96,yy);}
    c.textAlign='left';
    if(this.fx&&(this.phase==='plunge'||this.phase==='landed'&&this.fx.tier==='krillion'))this.drawEffect(l);
    for(const p of this.particles){c.globalAlpha=p.life;if(p.bubble)this.bubble(p.x,p.y,p.r||2,p.life*.65);else{c.fillStyle=p.color;c.fillRect(p.x,p.y,3,4);}}c.globalAlpha=1;
    const introTop=document.getElementById('intro')?.offsetTop||l.height-190,fadeTop=this.phase==='intro'?introTop-14:l.height-85,fade=c.createLinearGradient(0,fadeTop,0,this.phase==='intro'?fadeTop+85:l.height+40);fade.addColorStop(0,'#050a1400');fade.addColorStop(.35,'#050a14de');fade.addColorStop(1,'#050a14');c.fillStyle=fade;c.fillRect(0,fadeTop,w,h-fadeTop);
    for(let i=0;i<(this.lowPower?3:10);i++){const x=seed(i+741)*w+Math.sin(t*.3+i)*10,yy=h-((t*16+seed(i+94)*h)%(h*.9));if(yy>sea)this.bubble(x,yy,2+i%3,.38);}
    const hero=document.getElementById('hero');if(hero){hero.style.top=(sea-336)+'px';hero.style.opacity=['intro','done'].includes(this.phase)?'1':this.phase==='preview'?String(clamp((sea-175)/360,0,1)):'0';}
    if(['preview','answering','plunge'].includes(this.phase)){const card=document.getElementById('prompt-card');if(card)card.style.top=worldY(this.roundBase||0)+'px';}
    if(this.phase==='plunge')document.querySelectorAll('.tier-line').forEach(line=>line.style.top=worldY((this.fx?.startDepth||0)+Number(line.dataset.score)*10)+'px');
    const landing=document.getElementById('landing');if(landing&&this.phase==='landed')landing.style.top=(worldY(this.target)-124)+'px';
    const target=this.phase==='intro'?{x:l.left+l.width*.72,y:sea+105}:this.phase==='done'?{x:l.left+l.width*.82,y:l.height*.16}:this.phase==='landed'&&this.fx?.tier==='krillion'?{x:l.center,y:worldY(this.target)-80}:this.phase==='landed'?{x:l.left+l.width*.16,y:l.height*.28}:this.phase==='plunge'?{x:Math.min(l.center+95,w-l.rail-44),y:l.height/2-74}:{x:l.left+48,y:l.height-168};
    const follow=1-Math.exp(-2.6*(this.dt||.016));this.mx=mix(this.mx*w,target.x,follow)/w;this.my=mix(this.my*h,target.y,follow)/h;const mascotSize=this.phase==='landed'&&this.fx?.tier==='krillion'?(l.mobile?66:88):64;this.mascot.style.width=mascotSize+'px';this.mascot.style.height=mascotSize+'px';this.mascot.style.left=(this.mx*w-mascotSize/2)+'px';this.mascot.style.top=(this.my*h-mascotSize/2)+'px';this.mascot.style.transform='none';
  }
  seaLife(worldY,l){const c=this.ctx,t=this.time,w=this.w;
    const y=worldY(800);if(y>-100&&y<this.h+100)for(let i=0;i<22;i++){c.fillStyle=`rgba(77,227,255,${.22+.18*Math.sin(t*3+i)})`;c.beginPath();c.arc(w*(.12+i*.034),y+Math.sin(t*.7+i*.55)*22,2.2,0,Math.PI*2);c.fill();}
    const eyeY=worldY(980);if(eyeY>-100&&eyeY<this.h+100)for(let i=0;i<6;i++){const x=((t*14+i*110)%(w+200))-100,yy=eyeY+Math.sin(t+i*2)*20+i*8;this.fish(x,yy,.6,-1);c.fillStyle=`rgba(232,241,255,${.25+.25*Math.sin(t*5+i)})`;c.fillRect(x-1,yy-1,2,2);}
    const wreckY=worldY(3800);if(wreckY>-160&&wreckY<this.h+160){c.save();c.translate(w*.5,wreckY);c.rotate(.06);c.fillStyle='#040912df';c.fillRect(-108,-8,137,22);c.beginPath();c.moveTo(-108,-8);c.lineTo(-132,14);c.lineTo(-108,14);c.fill();for(let i=0;i<3;i++)c.fillRect(-92+i*34,-22,8,14);c.fillRect(58,-4,60,18);c.restore();}
    const sparkY=worldY(4400);if(sparkY>-80&&sparkY<this.h+80)for(let i=0;i<8;i++){c.fillStyle=`rgba(255,93,143,${.15+.2*Math.sin(t*4+i*3)})`;c.fillRect(w*(.05+i*.13)+Math.sin(t*.8+i*2)*14,sparkY+Math.sin(t*1.3+i)*18+i%3*10,2,2);}
  }
  drawEffect(l){const c=this.ctx,t=this.time,p=this.fx.progress,x=l.center,landed=this.phase==='landed',y=landed?l.height/2-60:l.height/2-60,tier=this.fx.tier,scatter=landed?clamp((performance.now()-(this.goldLandAt||performance.now())-1000)/1500,0,1):0;if(tier==='deepcut'){const g=c.createRadialGradient(x,y,66,x,y,330);g.addColorStop(0,'#02040a00');g.addColorStop(.55,'#02040ab8');g.addColorStop(1,'#02040af5');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);}
    if(tier==='rare'){for(let i=0;i<9;i++){const xx=x+Math.sin(i*4+t)*55,yy=y+Math.cos(i*3+t)*35,r=30+seed(i)*50;const g=c.createRadialGradient(xx,yy,0,xx,yy,r);g.addColorStop(0,'#3c040ed0');g.addColorStop(1,'#14000600');c.fillStyle=g;c.fillRect(xx-r,yy-r,r*2,r*2);}}
    if(tier==='tooclever'&&this.sprites.tooclever.complete){for(let i=0;i<11;i++){const direction=i%2?1:-1,progress=clamp(p*2-i*.07,0,1),xx=mix(direction>0?-70:this.w+70,direction>0?this.w+70:-70,progress),yy=l.height*.42+(seed(i+8)-.5)*260;c.save();c.translate(xx,yy);c.scale(-direction,1);c.rotate(Math.sin(t+i)*.2);c.drawImage(this.sprites.tooclever,-27,-27,54,54);c.restore();}}
    if(!landed){const glow=c.createRadialGradient(x,y-32,6,x,y-32,80);glow.addColorStop(0,'#4de3ff24');glow.addColorStop(1,'#4de3ff00');c.fillStyle=glow;c.fillRect(x-80,y-112,160,160);}
    if(tier==='schooler'&&this.sprites.schooler.complete){for(const[dx,dy]of[[-64,-26],[-88,10],[64,-18],[88,18],[-40,34],[44,38]]){c.save();c.translate(x+dx,y+dy+Math.sin(t*4+dx)*6);c.scale(dx>0?-1:1,1);c.drawImage(this.sprites.schooler,-16,-16,32,32);c.restore();}}
    const sprite=tier==='krillion'?this.sprites.krill:null;
    if(sprite?.complete){for(let i=0;i<(tier==='krillion'?18:7);i++){const angle=t*(i%2?1:-1)+i*2.4,r=(30+seed(i)*48)*(landed?.62:1)*(1+scatter*7),xx=x+Math.cos(angle)*r*1.12,yy=y+Math.sin(angle)*r*.62,size=tier==='krillion'?15+seed(i+3)*13:24;c.save();c.globalAlpha=Math.max(0,.92-scatter*1.15);c.translate(xx,yy);c.scale(-Math.sin(angle)*(i%2?1:-1)>0?-1:1,1);c.drawImage(sprite,-size/2,-size/2,size,size);c.restore();}}
    for(let i=0;i<(landed?24:18);i++){const yy=y-((seed(i+62)*180+t*(landed?38:24))%180),xx=x+Math.sin(i*3+t)*30;this.bubble(xx,yy,1.5+seed(i)*3,landed?.35:.5);}
  }
}
