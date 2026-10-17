// Independent Web Audio synthesis, calibrated from the reference's audible event design.
export const SOUND_CUES = {
  begin: [
    { noise: true, duration: 1.1, lowpass: 2000, sweep: 240, volume: .15 },
    { from: 110, to: 48, duration: 1.2, volume: .32 },
    { from: 784, duration: .5, volume: .12, type: 'triangle', lowpass: 3000 },
    { from: 523, duration: .75, volume: .12, type: 'triangle', lowpass: 3000, delay: .22 },
  ],
  submit: [{ from: 1150, duration: .16, attack: .003, volume: .16 }],
  reject: [{ noise: true, duration: .22, lowpass: 420, volume: .2 }, { from: 150, to: 62, duration: .36, volume: .22, lowpass: 700 }],
  tier: [{ from: 780, to: 1560, duration: .07, volume: .13, type: 'triangle', lowpass: 2500 }],
  sink: [{ from: 1150, duration: .7, attack: .01, volume: .1 }, { noise: true, duration: 1.3, lowpass: 1400, sweep: 180, volume: .16 }, { from: 300, to: 60, duration: 1.3, volume: .1 }],
  small: [{ from: 140, to: 70, duration: .25, volume: .28, lowpass: 600 }, { noise: true, duration: .14, lowpass: 500, volume: .1 }],
  big: [{ from: 80, to: 45, duration: .6, volume: .38 }, { noise: true, duration: .7, lowpass: 900, sweep: 200, volume: .18, delay: .02 }, { from: 523, duration: .4, volume: .09, type: 'triangle', delay: .15 }],
  krillion: [{ from: 60, to: 40, duration: 1.2, volume: .34 }, ...[784, 988, 1175, 1568].map((from, i) => ({ from, duration: .7, volume: .15, type: 'triangle', lowpass: 3000, delay: i * .13 })), { noise: true, duration: 1.4, lowpass: 2500, highpass: 1200, volume: .05, delay: .3 }],
  miss: [{ from: 220, to: 52, duration: .7, volume: .24 }, { noise: true, duration: .5, lowpass: 400, volume: .14, delay: .05 }],
  tick: [{ from: 880, duration: .07, volume: .16 }, { from: 880, duration: .05, volume: .06, delay: .12 }],
  surface: [{ noise: true, duration: 1.6, lowpass: 300, sweep: 3000, volume: .16 }, { from: 80, to: 600, duration: 1.5, volume: .08 }],
};
export class Sound {
  constructor() { this.muted = false; this.ac = null; this.master = null; }
  async init() {
    try {
      if (!this.visibilityBound) {
        this.visibilityBound = true;
        document.addEventListener('visibilitychange', () => {
          if (!this.ac) return;
          if (document.hidden && this.ac.state === 'running') this.ac.suspend().catch(() => {});
          else if (!document.hidden && !this.muted && this.ac.state === 'suspended') this.ac.resume().catch(() => {});
        });
      }
      if (!this.ac || this.ac.state === 'closed') {
        this.ac = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ac.createGain(); this.master.gain.value = this.muted ? 0 : .75;
        this.master.connect(this.ac.destination);
      }
      if (this.ac.state === 'suspended') await this.ac.resume();
    } catch { /* The game remains playable when audio is unavailable. */ }
  }
  mute(value) { this.muted = value; if (this.master) this.master.gain.setTargetAtTime(value ? 0 : .75, this.ac.currentTime, .02); }
  play(cue) {
    if (!this.ac || this.muted || this.ac.state !== 'running') return;
    const { duration = .2, volume = .15, delay = 0, attack = cue.noise ? .003 : .005 } = cue;
    const t = this.ac.currentTime + delay, gain = this.ac.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, t + duration + attack);
    gain.connect(this.master);
    let source;
    if (cue.noise) {
      source = this.ac.createBufferSource();
      const buffer = this.ac.createBuffer(1, Math.ceil(this.ac.sampleRate * (duration + .1)), this.ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      source.buffer = buffer;
    } else {
      source = this.ac.createOscillator(); source.type = cue.type || 'sine';
      source.frequency.setValueAtTime(cue.from, t);
      if (cue.to) source.frequency.exponentialRampToValueAtTime(cue.to, t + duration);
    }
    let output = source;
    if (cue.lowpass || cue.noise) {
      const filter = this.ac.createBiquadFilter(); filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cue.lowpass || 1200, t);
      if (cue.sweep) filter.frequency.exponentialRampToValueAtTime(cue.sweep, t + duration);
      output.connect(filter); output = filter;
    }
    if (cue.highpass) { const filter = this.ac.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = cue.highpass; output.connect(filter); output = filter; }
    output.connect(gain); source.start(t); source.stop(t + duration + attack + .1);
  }
  event(name) {
    if (document.hidden) return;
    if (this.ac?.state === 'suspended' && !this.muted) {
      const started = performance.now();
      this.ac.resume().then(() => { if (performance.now() - started < 250 && this.ac.state === 'running') this.event(name); }).catch(() => {});
      return;
    }
    const aliases = { plankton: 'small', tooclever: 'small', schooler: 'big', rare: 'big', deepcut: 'big', descend: 'begin' };
    if (name === 'blub') {
      const variation = .85 + Math.random() * .45;
      this.play({ from: 260 * variation, to: 720 * variation, duration: .13, volume: .22, lowpass: 2200 });
      this.play({ noise: true, duration: .05, lowpass: 1800, highpass: 700, volume: .05 });
      return;
    }
    for (const cue of SOUND_CUES[aliases[name] || name] || []) this.play(cue);
  }
}
