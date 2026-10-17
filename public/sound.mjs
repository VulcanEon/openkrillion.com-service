// Original procedural sound design. No audio files or third-party engine code.
export class Sound {
  constructor(){this.muted=false;this.ac=null;this.master=null;}
  async init(){try{if(!this.ac){this.ac=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ac.createGain();this.master.gain.value=this.muted?0:.55;this.master.connect(this.ac.destination);}if(this.ac.state==='suspended')await this.ac.resume();}catch{/* Sound support is optional. */}}
  mute(value){this.muted=value;if(this.master)this.master.gain.setTargetAtTime(value?0:.55,this.ac.currentTime,.03);}
  tone(from,to,duration=.25,volume=.15,type='sine',delay=0){if(!this.ac||this.muted)return;const t=this.ac.currentTime+delay,o=this.ac.createOscillator(),g=this.ac.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(1,from),t);o.frequency.exponentialRampToValueAtTime(Math.max(1,to),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.05);}
  noise(duration=.6,frequency=1000,volume=.1){if(!this.ac||this.muted)return;const n=Math.floor(this.ac.sampleRate*duration),b=this.ac.createBuffer(1,n,this.ac.sampleRate),data=b.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n);const source=this.ac.createBufferSource(),f=this.ac.createBiquadFilter(),g=this.ac.createGain();source.buffer=b;f.type='lowpass';f.frequency.setValueAtTime(frequency,this.ac.currentTime);f.frequency.exponentialRampToValueAtTime(100,this.ac.currentTime+duration);g.gain.value=volume;source.connect(f);f.connect(g);g.connect(this.master);source.start();}
  event(name){if(!this.ac||this.muted)return;switch(name){
    case 'begin':this.tone(440,880,.18,.13,'triangle');this.tone(880,220,.8,.2,'sine',.16);this.noise(1.2,2200,.1);break;
    case 'submit':this.tone(800,1400,.09,.12,'triangle');this.tone(1400,700,.13,.07,'sine',.06);break;
    case 'reject':this.tone(180,65,.25,.19,'triangle');break;
    case 'tick':this.tone(880,880,.065,.11);break;
    case 'tier':this.tone(700,1350,.07,.08,'triangle');break;
    case 'sink':this.tone(1050,100,.9,.13);this.noise(1.5,1800,.12);break;
    case 'plankton':this.tone(290,220,.25,.16);break;
    case 'tooclever':this.tone(390,260,.3,.13,'triangle');this.tone(330,210,.3,.1,'triangle',.15);break;
    case 'schooler':this.tone(440,440,.22,.12,'triangle');this.tone(660,660,.28,.1,'triangle',.12);break;
    case 'rare':[523,659,784].forEach((f,i)=>this.tone(f,f,.45,.12,'sine',i*.09));break;
    case 'deepcut':[659,784,988,1175].forEach((f,i)=>this.tone(f,f,.6,.12,'sine',i*.1));this.tone(90,45,.9,.18);break;
    case 'krillion':[784,988,1175,1568].forEach((f,i)=>this.tone(f,f,.8,.13,'sine',i*.12));this.tone(65,40,1.2,.23);this.noise(.7,2800,.07);break;
    case 'miss':this.tone(220,52,.65,.2);this.noise(.4,450,.09);break;
    case 'surface':this.tone(110,720,1.6,.13);this.noise(1.5,3200,.07);break;
    case 'blub':this.tone(480,1300,.08,.15);this.tone(650,230,.15,.1,'sine',.08);break;
  }}
}
