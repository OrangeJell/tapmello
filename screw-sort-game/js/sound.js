export class Sound {
  context = null;
  enabled = true;
  voices = new Set();
  async unlock() {
    if (!this.enabled) return;
    try { this.context ||= new (window.AudioContext || window.webkitAudioContext)(); await this.context.resume(); } catch { /* Optional audio. */ }
  }
  cancel() {for(const voice of this.voices){try{voice.stop();}catch{/* Already ended. */}}this.voices.clear();}
  pause() { this.cancel();this.context?.suspend().catch(()=>{}); }
  play(kind='tap') {
    if (!this.enabled || this.context?.state !== 'running') return;
    const notes = kind==='win'?[523,659,784,1046]:kind==='pack'?[659,880,1318]:[540,710];
    for (const [i,freq] of notes.entries()) {
      const oscillator=this.context.createOscillator(), gain=this.context.createGain(), at=this.context.currentTime+i*(kind==='pack'?.045:.065);
      this.voices.add(oscillator);oscillator.onended=()=>{this.voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.frequency.setValueAtTime(freq,at); gain.gain.setValueAtTime(.0001,at);
      gain.gain.exponentialRampToValueAtTime(kind==='pack'?.045:.035,at+.01); gain.gain.exponentialRampToValueAtTime(.0001,at+.13);
      oscillator.connect(gain); gain.connect(this.context.destination); oscillator.start(at); oscillator.stop(at+.15);
    }
  }
}
