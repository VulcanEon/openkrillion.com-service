// Cached, independently drawn pixel scenery. All geometry is generated here.
const n=i=>{const v=Math.sin(i*91.37+18.9)*43758.54;return v-Math.floor(v)};
const step=v=>Math.round(v/2)*2;
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(step(x),step(y)):c.moveTo(step(x),step(y)));c.closePath();c.fill()}
function plant(c,x,base,height,phase,color){const count=Math.floor(height/12);c.fillStyle=color;for(let i=0;i<count;i++){const y=base-i*12,bend=Math.round(Math.sin(i*.36+phase)*3)*2,xx=x+bend;c.fillRect(xx-2,y-12,4,16);if(i<2)continue;const leaf=(1-i/count)*11+9;for(const dir of[-1,1]){poly(c,[[xx,y],[xx+dir*leaf*.3,y-5],[xx+dir*leaf*.7,y-6],[xx+dir*(leaf+2),y-17],[xx+dir*leaf,y-20],[xx+dir*leaf*.45,y-12],[xx,y-5]],color)}}}
function tendril(c,x,y,height,phase,color){c.fillStyle=color;for(let j=0;j<height;j+=4){const xx=x+Math.sin(j*.038+phase)*8+Math.sin(j*.1)*2;c.fillRect(step(xx),y-j,3,6);if(j%28===0)c.fillRect(step(xx)+2,y-j-4,3,7)}}
function grain(c,width,height,seed,amount=1){for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=n(x*13+y*57+seed);if(p<.06){c.fillStyle=`rgba(88,133,164,${(.012+p*.08)*amount})`;c.fillRect(x,y,1,1)}else if(p>.96){c.fillStyle=`rgba(0,5,13,${.025*amount})`;c.fillRect(x,y,1,1)}}}
function top(c){const g=c.createLinearGradient(0,0,0,688);g.addColorStop(0,'#081728');g.addColorStop(.12,'#2379a9');g.addColorStop(.54,'#194f70');g.addColorStop(1,'#071322');c.fillStyle=g;c.fillRect(0,0,384,688);
 for(const[x,dx]of[[145,-125],[170,-88],[250,95]])poly(c,[[x,40],[x+8,40],[x+dx+24,430],[x+dx,430]],'#8dcade17');grain(c,384,688,1,1);
 for(const[x,y,h,p]of[[45,608,400,1],[365,610,430,2],[70,595,260,4],[327,625,250,8]])plant(c,x,y,h,p,'#0b2c43');
 poly(c,[[0,365],[38,397],[52,474],[92,482],[80,541],[109,548],[90,601],[116,610],[121,688],[0,688]],'#081a2c');poly(c,[[384,340],[363,330],[348,370],[322,375],[328,403],[304,412],[316,435],[353,446],[338,490],[370,521],[334,560],[327,688],[384,688]],'#081a2c');
 for(const[x,y,h,p]of[[21,605,452,1],[8,625,280,5],[58,624,242,7],[287,620,260,9],[355,602,190,3]])plant(c,x,y,h,p,'#041323');
 for(let j=0;j<6;j++)tendril(c,70+j*7,612,38+n(j)*80,j,'#041323');
 poly(c,[[0,620],[51,616],[85,630],[143,637],[174,642],[231,641],[273,635],[317,623],[384,616],[384,688],[0,688]],'#050f1c');
 for(let i=0;i<45;i++){const x=22+n(i+11)*340,y=220+n(i+28)*380;c.fillStyle='#74bad638';c.fillRect(step(x),step(y),2,2);if(i%5===0){c.strokeStyle='#81bed74d';c.lineWidth=1;c.strokeRect(step(x),step(y),4,4)}}
}
function mid(c){const g=c.createLinearGradient(0,0,0,688);g.addColorStop(0,'#020b12');g.addColorStop(.35,'#071523');g.addColorStop(.55,'#0d2139');g.addColorStop(.83,'#081726');g.addColorStop(1,'#030b14');c.fillStyle=g;c.fillRect(0,0,384,688);grain(c,384,688,3,1.4);
 // Dithered horizontal thermocline bands.
 for(let y=213;y<584;y+=3)for(let x=0;x<384;x+=3){const a=Math.max(0,1-Math.abs(y-245)/80)+Math.max(0,1-Math.abs(y-510)/65);if(n(x*19+y)>.42){c.fillStyle=`rgba(1,8,17,${a*.4})`;c.fillRect(x,y,1,2)}}
 for(const[pts,col]of[[[[0,410],[25,447],[28,497],[47,552],[56,640],[77,688],[0,688]],'#020a13'],[[[36,610],[48,418],[61,331],[71,342],[79,422],[89,480],[101,688]],'#061322'],[[[276,688],[278,431],[290,358],[308,352],[317,452],[326,502],[329,688]],'#061322'],[[[384,359],[367,382],[359,430],[350,474],[348,529],[339,577],[334,688],[384,688]],'#020a13']])poly(c,pts,col);
 for(const[x,y,h,ph]of[[12,455,242,1],[32,553,200,3],[346,428,255,4],[362,491,210,8],[100,684,88,9],[284,688,122,10]])tendril(c,x,y,h,ph,'#03101b');
}
function trench(c){const g=c.createLinearGradient(0,0,0,688);g.addColorStop(0,'#102334');g.addColorStop(.36,'#081522');g.addColorStop(1,'#02060e');c.fillStyle=g;c.fillRect(0,0,384,688);grain(c,384,688,8,1.7);
 for(let side=0;side<2;side++)for(let row=-1;row<13;row++)for(let col=0;col<3;col++){
  const k=row*7+col+side*97,x=col*27-22+n(k+8)*12,y=row*58+n(k+91)*18,w=29+n(k+14)*25,h=39+n(k+65)*35;
  const pts=[[x,y+8],[x+w*.45,y],[x+w,y+8],[x+w+4,y+h*.64],[x+w*.68,y+h],[x+4,y+h-2],[x-5,y+h*.52]],transform=arr=>arr.map(([a,b])=>[side?384-a:a,b]);poly(c,transform(pts),'#01060d');poly(c,transform(pts.map(([a,b])=>[a+2,b+2])),'#0b1927');poly(c,transform([[x+4,y+11],[x+w*.45,y+3],[x+w-3,y+11],[x+w*.63,y+17],[x+w*.55,y+h*.5],[x+7,y+h-8],[x+8,y+h*.53],[x-1,y+h*.42]]),'#172b3c');
  poly(c,transform([[x+8,y+h*.54],[x+w*.44,y+h*.44],[x+w*.55,y+h*.64],[x+w-3,y+h*.76],[x+w*.65,y+h-2],[x+9,y+h-4]]),'#0b1c2b');
  if(n(k+12)>.65)for(let j=0;j<3;j++){c.fillStyle=n(k+14)>.5?'#47ced9aa':'#ed4a8ba0';const xx=x+w*.42+n(j+k)*8;c.fillRect(step(side?384-xx:xx),step(y+h*.3+j*4),2,2)}
 }
 for(let y=50;y<635;y+=4)for(let x=80;x<300;x+=4)if(n(x+y*21)>.7&&Math.sin(y*.035)>.45){c.fillStyle='#1d3d521d';c.fillRect(x,y,1,1)}
}
export class Seascape{
 constructor(){this.layers=[top,mid,trench].map(paint=>{const canvas=document.createElement('canvas');canvas.width=384;canvas.height=688;paint(canvas.getContext('2d'));return canvas});this.trenchMirror=document.createElement('canvas');this.trenchMirror.width=384;this.trenchMirror.height=688;const c=this.trenchMirror.getContext('2d');c.translate(0,688);c.scale(1,-1);c.drawImage(this.layers[2],0,0)}
 draw(ctx,w,h,worldY){for(const [index,start,end,alpha]of[[0,40,470,.45],[1,480,2620,.5],[2,2950,7060,.55]]){
  const topY=worldY(start),bottom=worldY(end);if(topY>h||bottom<0)continue;const scale=w/384,tileH=688*scale;
  ctx.save();
  for(let y=Math.max(0,topY);y<Math.min(h,bottom);){
   const sourceY=((y-topY)%tileH+tileH)%tileH,strip=Math.min(8,h-y,bottom-y,tileH-sourceY),fade=Math.max(0,Math.min(1,(y+strip/2-topY)/150,(bottom-y-strip/2)/150));
   const mirrored=index===2&&Math.floor((y-topY)/tileH)%2===1;ctx.globalAlpha=alpha*fade;ctx.drawImage(mirrored?this.trenchMirror:this.layers[index],0,sourceY/scale,384,strip/scale,0,y,w,strip+.5);y+=strip;
  }
  ctx.restore();
 }}
}
