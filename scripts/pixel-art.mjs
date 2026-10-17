// Original, reproducible pixel illustrations. No sampled reference pixels or external image inputs.
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgb=c=>'#'+c.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
const hash=(x,y)=>{const n=Math.sin(x*31.7+y*83.9)*48731.5;return n-Math.floor(n)};
class Pixels{
 constructor(){this.p=Array.from({length:64},()=>Array(64).fill(null))}
 put(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&x<64&&y>=0&&y<64)this.p[y][x]=c}
 rect(x,y,w,h,c){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)this.put(i,j,c)}
 poly(points,c){for(let y=0;y<64;y++)for(let x=0;x<64;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const[a,b]=points[i],[d,e]=points[j];if((b>y)!==(e>y)&&x<(d-a)*(y-b)/(e-b)+a)inside=!inside}if(inside)this.put(x,y,typeof c==='function'?c(x,y):c)}}
 oval(cx,cy,rx,ry,light,dark){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<=1){const f=Math.max(0,Math.min(1,.36+dx*.18+dy*.28+(hash(x,y)-.5)*.15));this.put(x,y,Array.isArray(light)?rgb(mix(light,dark,f)):light)}}}
 line(points,color,width=1){for(let i=1;i<points.length;i++){const[a,b]=points[i-1],[c,d]=points[i],steps=Math.ceil(Math.hypot(c-a,d-b)*2);for(let n=0;n<=steps;n++)this.rect(Math.round(a+(c-a)*n/steps),Math.round(b+(d-b)*n/steps),width,width,color)}}
 curve(a,b,c,d,col,width=1){const ps=[];for(let i=0;i<=60;i++){const t=i/60,q=1-t;ps.push([q*q*q*a[0]+3*q*q*t*b[0]+3*q*t*t*c[0]+t*t*t*d[0],q*q*q*a[1]+3*q*q*t*b[1]+3*q*t*t*c[1]+t*t*t*d[1]])}this.line(ps,col,width)}
 svg(){let body='';for(let y=0;y<64;y++)for(let x=0;x<64;){const c=this.p[y][x];let end=x+1;while(end<64&&this.p[y][end]===c)end++;if(c)body+=`<path fill="${c}" d="M${x} ${y}h${end-x}v1H${x}z"/>`;x=end}return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">${body}</svg>`}
}
export function shrimp(kind='red'){
 const p=new Pixels(),gold=kind==='gold',white=kind==='evil';
 const hi=gold?[255,224,96]:white?[248,248,255]:[255,64,111],lo=gold?[208,92,3]:white?[114,130,162]:[192,0,55],edge=gold?'#ab4e09':white?'#6b7796':'#940b43',pink=gold?'#ffd151':white?'#f3f4ff':'#ff245f';
 p.curve([25,29],[5,21],[18,6],[35,6],pink);p.curve([25,27],[13,18],[20,11],[40,11],pink);p.curve([25,30],[15,25],[20,16],[32,18],pink);
 p.poly([[24,26],[33,24],[41,28],[45,35],[44,43],[40,49],[34,53],[26,54],[20,52],[17,48],[18,44],[23,44],[26,48],[31,48],[34,44],[33,39],[28,37],[23,34],[18,32]],edge);
 for(const[x,y,rx,ry]of[[35,31,8,7],[38,37,7,7],[37,43,7,6],[32,48,7,5],[25,49,6,4]])p.oval(x,y,rx,ry,hi,lo);
 p.curve([39,30],[32,30],[31,33],[34,35],edge);p.curve([43,37],[38,36],[35,36],[34,38],edge);p.curve([41,44],[37,42],[35,42],[33,44],edge);p.line([[29,48],[31,51],[34,51]],edge);
 p.oval(25,30,7,4,hi,lo);p.poly([[22,29],[15,26],[18,30],[14,31],[23,34]],pink);p.oval(24,28,2,2,gold?'#f8d35c':'#f86c78');p.rect(24,28,1,2,'#191326');
 for(const[x,y]of[[27,34],[30,35],[33,36]])p.curve([x,y],[x-2,y+3],[x-4,y+6],[x-4,y+8],pink);
 p.line([[22,33],[17,35],[14,34]],pink);p.line([[23,32],[18,32],[17,30]],pink);
 p.poly([[23,47],[18,43],[17,46],[20,50],[16,48],[16,51],[21,53],[26,51]],pink);p.line([[18,46],[21,49],[24,50]],rgb(hi));
 // Curved witch hat, separate from the shell palette.
 p.poly([[25,24],[29,16],[36,12],[40,13],[45,17],[45,20],[41,17],[37,18],[35,24],[44,28],[43,30],[32,28],[24,25]],'#1b0a25');
 p.poly([[27,24],[30,17],[37,14],[40,14],[43,17],[39,16],[36,18],[35,25]],(x,y)=>rgb(mix([85,21,76],[30,9,37],Math.min(1,(x-27)/18+(y-16)/30))));
 p.line([[26,23],[33,26],[42,28]],'#c67122',2);p.line([[33,25],[33,27],[35,28],[36,25],[34,24],[33,25]],'#ffce43');p.line([[24,24],[33,28],[44,30]],'#200b2e');
 return p.svg();
}
export function fish(orange=false){const p=new Pixels(),hi=orange?[255,172,67]:[74,229,255],lo=orange?[174,62,10]:[0,116,168],edge=orange?'#a54c17':'#076184';
 p.poly([[25,27],[30,19],[35,18],[38,20],[34,25],[36,28]],edge);p.poly([[26,26],[30,21],[35,20],[33,25]],rgb(hi));
 p.poly([[37,32],[48,23],[49,27],[48,44],[43,42],[37,38]],edge);p.poly([[38,33],[47,27],[46,41],[39,37]],rgb(lo));p.line([[43,30],[46,28],[46,39]],rgb(hi),2);
 p.oval(28,34,17,9,hi,lo);p.oval(17,34,7,6,hi,lo);p.poly([[25,42],[28,48],[34,47],[36,43]],edge);p.line([[28,44],[30,46],[34,45]],rgb(hi),2);
 p.line([[26,30],[25,35],[27,39]],orange?'#ffdcbb':'#5de8fc');p.line([[28,33],[30,36],[28,39]],orange?'#ffe7c9':'#22b5d8',2);
 if(orange)for(const x of[19,33])p.poly([[x,27],[x+3,28],[x+3,41],[x,41]],'#fff0d1');
 p.rect(16,32,2,2,'#041c27');p.put(16,32,'#daffff');p.line([[11,36],[14,36]],edge);return p.svg();}
export function squid(){const p=new Pixels();for(let i=0;i<6;i++){const x=29+(i-2)*1.3;p.curve([x,35],[x-5+i*2,22],[10+i*8,15],[15+i*6,5+i%2*2],'#f52d50',1+(i%3===0?1:0))}p.poly([[27,32],[35,32],[39,39],[35,52],[32,58],[28,53],[24,42]],'#b51037');p.oval(31,41,5,10,[255,72,58],[219,8,43]);p.poly([[27,44],[23,49],[27,53]],'#ec1644');p.poly([[35,44],[39,49],[35,53]],'#ec1644');p.rect(29,36,1,2,'#ffb143');p.rect(34,36,1,2,'#ffb143');p.line([[31,40],[31,47]],'#ff6f30');return p.svg()}
export function angler(){const p=new Pixels();p.curve([34,29],[32,9],[17,9],[14,25],'#12354b',2);p.curve([33,28],[31,12],[19,12],[16,24],'#2b536a');p.oval(14,25,3,3,[255,255,255],[198,230,242]);p.poly([[25,28],[34,20],[38,23],[38,28],[43,32],[50,25],[50,42],[42,40],[38,45],[25,47],[16,43],[14,36],[18,31]],'#071320');p.oval(30,35,14,11,[44,75,99],[9,26,46]);p.poly([[18,33],[24,29],[28,34],[29,43],[22,45],[16,42],[15,37]],'#030812');p.poly([[23,31],[27,34],[25,36],[24,33],[22,38],[21,34],[19,39],[18,35]],'#afbbc8');p.poly([[17,40],[19,41],[20,38],[22,43],[24,39],[26,43]],'#768da3');p.rect(31,29,2,2,'#040d16');p.put(31,29,'#5a8a9b');for(let i=0;i<12;i++)p.rect(31+i%4*3,33+Math.floor(i/4)*3,2,2,i%2?'#152b42':'#263f55');return p.svg()}
