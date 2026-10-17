const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const stops=[[0,[29,85,128]],[150,[18,58,94]],[350,[11,21,38]],[800,[8,16,32]],[1400,[5,10,20]],[2600,[3,7,15]],[5200,[2,5,11]]];
const depthColor=d=>{let i=stops.findIndex(([v])=>v>d);if(i<0)return stops.at(-1)[1];if(!i)return stops[0][1];const[a,c]=stops[i-1],[b,k]=stops[i];return c.map((n,j)=>Math.round(lerp(n,k[j],(d-a)/(b-a))));};
const landmarks=[[60,'light begins to fade','L'],[200,'most sunlight stops here','R'],[332,'deepest scuba dive ever — 332m','R'],[385,'sperm whales hunt below here','L'],[535,'emperor penguins dive this deep','R'],[660,'pressure: 67x the surface','L'],[800,'siphonophore drift zone','R'],[1040,'THE MIDNIGHT ZONE','L'],[1240,'anglerfish territory','R'],[1550,'sperm whales duel giant squid here','L'],[1850,'giant squid territory','R'],[2150,'colossal squid eyes: football-sized','L'],[2500,'the water is 2°C and utterly black','R'],[3000,'THE ABYSSAL ZONE','L'],[3800,'the Titanic rests here — 3,800m','R'],[4400,'cusk eels patrol the plain','L'],[4900,'the abyssal plain stretches out','R'],[5500,'deeper than most submarines survive','L'],[6100,'THE HADAL ZONE','R'],[6450,'named for Hades. fitting.','L'],[7000,'the trench floor — a perfect dive ends here','R']];
function seeded(n){const s=Math.sin(n*127.1+311.7)*43758.5453123;return s-Math.floor(s);}

export class Ocean {
  constructor(canvas,mascot){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.mascot=mascot;
    this.depth=0;this.target=0;this.active=0;this.targetActive=0;this.phase='intro';this.lowPower=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.last=0;this.particles=[];this.time=0;this.mx=.72;this.my=.66;
    this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  resize(){this.w=this.canvas.clientWidth;this.h=this.canvas.clientHeight;this.canvas.width=Math.ceil(this.w/2);this.canvas.height=Math.ceil(this.h/2);this.ctx.setTransform(.5,0,0,.5,0,0);this.ctx.imageSmoothingEnabled=false;this.draw();}
  setPhase(phase){this.phase=phase;this.targetActive=phase==='intro'||phase==='done'?0:1;}
  setDepth(depth){this.target=depth;}
  burst(color='#4de3ff',n=35){if(this.reduced)return;for(let i=0;i<(this.lowPower?n/3:n);i++)this.particles.push({x:this.w/2,y:this.h*.45,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*240-40,life:1,color});}
  tick(now){const dt=Math.min(.05,(now-this.last)/1000||.016);if(!document.hidden&&(!this.lowPower||now-this.last>=60)){this.last=now;this.time+=this.reduced?0:dt;this.depth=lerp(this.depth,this.target,1-Math.exp(-(this.reduced?20:2.7)*dt));this.active=lerp(this.active,this.targetActive,1-Math.exp(-3.6*dt));if(Math.abs(this.depth-this.target)<.1)this.depth=this.target;this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=110*dt;p.life-=dt*.5});this.particles=this.particles.filter(p=>p.life>0);this.draw();}this.frame=requestAnimationFrame(t=>this.tick(t));}
  cloud(x,y,s){const c=this.ctx;c.fillStyle='#eaf7f7';const cells=[[0,2,4,2],[2,1,5,3],[4,0,5,4],[8,1,4,3],[10,2,5,2],[1,3,13,1],[5,4,4,1]];for(const[a,b,w,h]of cells)c.fillRect(Math.round(x+a*s),Math.round(y+b*s),w*s,h*s);c.fillStyle='#e4f1ee';c.fillRect(x+s,y+4*s,3*s,s);c.fillRect(x+11*s,y+4*s,2*s,s);}
  boat(x,y,s){const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);c.fillStyle='#071d2b';for(const[a,b,w,h]of [[0,-4,26,2],[1,-6,3,3],[2,-3,22,2],[3,-1,19,1],[22,-7,7,1],[23,-6,3,2],[10,-9,9,1],[11,-8,2,4],[16,-8,2,4],[13,-18,1,10]])c.fillRect(a,b,w,h);c.fillStyle='#e7517a';c.fillRect(8,-16,5,3);c.fillRect(10,-18,3,2);c.fillRect(7,-15,3,1);c.fillStyle='#80b6c7';c.fillRect(13,-8,1,2);c.fillRect(16,-8,1,2);c.restore();}
  fish(x,y,s,dir=1,glow=false){const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir*s,s);c.fillStyle=glow?'#0c5c69':'#031522';c.beginPath();c.ellipse(0,0,8,3.5,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(-7,0);c.lineTo(-14,-4);c.lineTo(-14,4);c.closePath();c.fill();if(glow){c.fillStyle='#5fffff';c.fillRect(4,-1,1,1)}c.restore();}
  weed(x,y,s,seed){const c=this.ctx;c.save();c.translate(x,y);c.scale(s,s);c.strokeStyle='#041a29';c.lineWidth=5;c.beginPath();c.moveTo(0,0);for(let j=0;j<10;j++)c.lineTo(Math.sin(j*.9+seed)*10,-j*16);c.stroke();c.lineWidth=3;for(let j=1;j<10;j++){const xx=Math.sin(j*.9+seed)*10,yy=-j*16;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-18,-j*16-16);c.lineTo(xx-22,-j*16-26);c.moveTo(xx,yy-2);c.lineTo(xx+16,yy-19);c.lineTo(xx+19,yy-28);c.stroke();}c.restore();}
  draw(){if(!this.ctx)return;const c=this.ctx,w=this.w,h=this.h,t=this.time,mobile=w<700;
    const anchor=lerp(h*(mobile?.58:.55),h*(mobile?.206:.235),this.active),scale=1.8,sea=anchor-this.depth*scale;
    c.fillStyle='#050a14';c.fillRect(0,0,w,h);
    if(sea>0){const sky=c.createLinearGradient(0,0,0,Math.max(sea,1));sky.addColorStop(0,'#8bcbdc');sky.addColorStop(.5,'#b5e1e9');sky.addColorStop(1,'#d7edef');c.fillStyle=sky;c.fillRect(0,0,w,sea+10);
      if(mobile){c.fillStyle='#ffdf93';c.shadowColor='#ffe5ab';c.shadowBlur=25;c.fillRect(w*.79,sea*.69,32,30);c.shadowBlur=0;c.fillStyle='#ffe7ae';c.fillRect(w*.79-4,sea*.69+6,40,18);this.cloud(w*.09,sea*.71,5);this.cloud(w*.55,sea*.72,3);this.cloud(-40,sea*.81,4);this.cloud(w*.9,sea*.81,4);}
      else{this.cloud(-70+Math.sin(t*.04)*30,sea*.13,14);this.cloud(w*.36+Math.sin(t*.025)*20,sea*.06,15);this.cloud(w*.87,sea*.08,13);}
      this.boat(w*(mobile?.29:.255),sea-3+Math.sin(t*1.5)*2,mobile?2:5);
    }
    // A depth-based color field, not a scrolling screenshot.
    for(let y=Math.max(0,Math.floor(sea)-8);y<h;y+=6){const d=Math.max(0,this.depth+(y-anchor)/scale),color=depthColor(d);c.fillStyle=`rgb(${color.join(',')})`;c.fillRect(0,y,w,7);}
    if(sea>-10&&sea<h+20){c.fillStyle='#1d5580';c.beginPath();c.moveTo(0,sea+8);for(let x=0;x<=w+30;x+=12)c.lineTo(x,sea+Math.sin(x*.011+t*.7)*3+Math.sin(x*.024-t*.3)*2);c.lineTo(w,sea+14);c.lineTo(0,sea+14);c.fill();
    }
    const lineX=mobile?w-15:Math.min(w-25,w/2+405);c.strokeStyle='#a1bfd54d';c.fillStyle='#a1bfd577';c.lineWidth=1;c.font='11px VT323';
    c.beginPath();c.moveTo(lineX,Math.max(0,sea));c.lineTo(lineX,h);c.stroke();
    const d0=Math.floor((this.depth-anchor/scale)/10)*10;
    for(let d=Math.max(0,d0);d<this.depth+(h-anchor)/scale;d+=10){const yy=anchor+(d-this.depth)*scale;if(yy<0)continue;const big=d%100===0;c.beginPath();c.moveTo(lineX-(big?14:6),yy);c.lineTo(lineX,yy);c.stroke();if(big)c.fillText(d===0?'0m':`-${d}m`,lineX-39,yy+3);}
    const count=this.lowPower?25:80;
    for(let i=0;i<count;i++){const x=seeded(i+91)*w,yy=((seeded(i+331)*h+t*(2+seeded(i)*5)+this.depth*.18)%h+h)%h;if(yy<sea)continue;c.fillStyle=`rgba(160,211,240,${.08+seeded(i+2)*.18})`;c.fillRect(x,yy,seeded(i+20)> .7?2:1,seeded(i+20)>.7?2:1);}
    // Light shafts are strongest close to the surface.
    if(this.depth<500){c.save();c.globalAlpha=.035*(1-this.depth/500);c.fillStyle='#b0e5ff';for(let i=0;i<4;i++){const x=w*(.08+i*.27)+Math.sin(t*.2+i)*15;c.beginPath();c.moveTo(x,Math.max(0,sea));c.lineTo(x+25,Math.max(0,sea));c.lineTo(x+150,h);c.lineTo(x+50,h);c.fill();}c.restore();}
    for(let i=0;i<38;i++){const d=40+seeded(i+7)*1600,yy=anchor+(d-this.depth)*scale;if(yy<sea+20||yy<-20||yy>h+20)continue;const direction=i%2?1:-1,x=((seeded(i+32)*w+t*(4+seeded(i+40)*14)*direction)%(w+60)+w+60)%(w+60)-30;this.fish(x,yy,.45+seeded(i+9)*.65,direction,this.depth>600&&i%7===0);}
    if(this.depth<650){const base=anchor+(310-this.depth)*scale;for(let i=0;i<12;i++){const x=i%2? w+15-seeded(i+2)*65:-15+seeded(i+5)*70;this.weed(x,base+seeded(i+5)*220,.6+seeded(i+3),i);}}
    // Deep silhouettes and distant bioluminescence.
    if(this.depth>700&&this.depth<3000){const x=w*.14+Math.sin(t*.1)*30,y=h*.65;c.save();c.globalAlpha=.3;c.fillStyle='#0c2234';c.beginPath();c.ellipse(x,y,45,12,-.2,0,7);c.fill();c.restore();for(let i=0;i<7;i++){c.fillStyle='#45f8ee55';c.fillRect((seeded(i+900)*w+t*2)%w,seeded(i+400)*h,2,2);}}
    if(this.depth>3200){c.fillStyle='#081425';const floorY=h*.87+Math.sin(t*.1)*2;c.beginPath();c.moveTo(0,floorY);for(let x=0;x<=w+30;x+=15)c.lineTo(x,floorY+Math.sin(x*.014)*25+Math.sin(x*.045)*8);c.lineTo(w,h);c.lineTo(0,h);c.fill();}
    c.font=`${mobile?11:14}px VT323`;c.fillStyle='#6e95b37d';for(const[d,text,side]of landmarks){const yy=anchor+(d-this.depth)*scale;if(yy<80||yy>h-130)continue;if(mobile&&this.active<.8)continue;c.textAlign=side==='L'?'left':'right';c.fillText(side==='L'?`── ${text}`:`${text} ──`,side==='L'?(mobile?14:Math.max(22,w*.08)):(mobile?w-35:w*.91),yy);}
    c.textAlign='left';
    for(const p of this.particles){c.globalAlpha=p.life;c.fillStyle=p.color;c.fillRect(p.x,p.y,3,4);}c.globalAlpha=1;
    // The foreground fades at the dock, like the reference's deep-water shelf.
    const bottom=c.createLinearGradient(0,h*.68,0,h*.88);bottom.addColorStop(0,'#050a1400');bottom.addColorStop(1,'#050a14');c.fillStyle=bottom;c.fillRect(0,h*.68,w,h*.32);
    for(let i=0;i<(this.lowPower?2:7);i++){const x=(seeded(i+741)*w+Math.sin(t*.3+i)*12),yy=h-((t*16+seeded(i+94)*h)%(h*.7));if(yy<sea)continue;c.strokeStyle='#b5dce655';c.lineWidth=1;c.beginPath();c.arc(x,yy,2+(i%3),0,Math.PI*2);c.stroke();}
    const target=this.phase==='intro'?{x:.7,y:.66}:this.phase==='done'?{x:.86,y:.12}:this.phase==='landed'?{x:.16,y:.28}:this.phase==='plunge'?{x:.62,y:.46}:{x:mobile?.16:.2,y:mobile?.72:.7};
    this.mx=lerp(this.mx,target.x,.035);this.my=lerp(this.my,target.y,.035);this.mascot.style.left=`${this.mx*w-24}px`;this.mascot.style.top=`${this.my*h-24}px`;this.mascot.style.transform=`translateY(${Math.sin(t*1.7)*5}px) rotate(${Math.sin(t*1.1)*5}deg)`;
  }
}
