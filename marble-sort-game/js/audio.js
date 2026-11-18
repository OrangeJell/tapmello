import {storage} from './platform.js';
import {createMusicSamples} from './music.js';
const EFFECT_LEVEL=1,MUSIC_LEVEL=.20,MAX_VOICES=12;
const CUE_GAP=.08,FADE_OUT=.022;
export class Sound {
  constructor(){
    this.enabled=storage.get('sound',true);this.musicEnabled=storage.get('music',true);
    this.context=null;this.active=false;this.blocked=false;this.voices=new Set();
    this.lastCues=new Map();this.lastCueAt=-Infinity;this.currentCue=null;this.roundEnded=false;
    this.ready=Promise.resolve().then(()=>{this.score=createMusicSamples();if(this.active&&!this.blocked)this.startMusic();});
  }
  unlock(){
    this.active=true;
    if(this.blocked||(!this.enabled&&!this.musicEnabled))return null;
    try{
      this.context=this.context||new (window.AudioContext || window.webkitAudioContext)();
      if(!this.effects){this.effects=this.context.createGain();this.effects.gain.value=this.enabled?EFFECT_LEVEL:0;this.effects.connect(this.context.destination);}
      if(this.context.state!=='running')this.context.resume()?.catch?.(()=>{});
      this.startMusic();return this.context;
    }catch{return null;}
  }
  startMusic(){
    if(!this.musicEnabled||!this.score||this.musicSource||!this.context||this.blocked)return;
    let source,gain;
    try{
      const c=this.context,{data,sampleRate}=this.score;
      if(!this.musicBuffer){this.musicBuffer=c.createBuffer(1,data.length,sampleRate);this.musicBuffer.getChannelData(0).set(data);}
      source=c.createBufferSource();gain=c.createGain();source.buffer=this.musicBuffer;source.loop=true;
      gain.gain.setValueAtTime(0,c.currentTime);gain.gain.linearRampToValueAtTime(MUSIC_LEVEL,c.currentTime+.45);
      source.connect(gain);gain.connect(c.destination);
      source.onended=()=>{source.disconnect();gain.disconnect();};source.start();
      this.musicSource=source;this.musicGain=gain;
    }catch{try{source?.disconnect();gain?.disconnect();}catch{}}
  }
  fade(gain,value,duration){
    const at=this.context.currentTime,param=gain.gain,current=param.value;
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(at);
    else {param.cancelScheduledValues(at);param.setValueAtTime(current,at);}
    param.linearRampToValueAtTime(value,at+duration);
  }
  stopMusic(){
    try{if(this.musicSource){this.fade(this.musicGain,0,.08);this.musicSource.stop(this.context.currentTime+.09);}}catch{}
    this.musicSource=null;this.musicGain=null;
  }
  note(freq,duration,volume,delay=0,type='sine',end=freq*.7){
    if(!this.enabled||this.blocked)return;
    const context=this.context;if(!context||!this.active)return;
    // Bound both active and scheduled voices, including a burst within one frame.
    for(const voice of this.voices)if(voice.end<=context.currentTime)this.voices.delete(voice);
    if(this.voices.size>=MAX_VOICES)return;
    let oscillator,gain,voice;
    try{
      const at=context.currentTime+Math.max(0,delay)+.008;
      duration=Math.max(.04,duration);volume=Math.max(.001,Math.min(.14,volume,.72-[...this.voices].reduce((sum,v)=>sum+v.volume,0)));
      const attack=Math.min(.008,duration*.18),hold=Math.min(.022,duration*.32),release=.014;
      freq=Math.max(220,Math.min(1000,freq));end=Math.max(220,Math.min(1000,end));
      oscillator=context.createOscillator();gain=context.createGain();
      oscillator.type=type;oscillator.frequency.setValueAtTime(freq,at);oscillator.frequency.exponentialRampToValueAtTime(end,at+duration);
      // Exact silence at each end avoids clicks; leave time for audio-thread scheduling.
      gain.gain.setValueAtTime(0,context.currentTime);gain.gain.setValueAtTime(0,at);
      gain.gain.linearRampToValueAtTime(volume,at+attack);
      gain.gain.setValueAtTime(volume,at+hold);
      gain.gain.exponentialRampToValueAtTime(.0001,at+duration-release);
      gain.gain.linearRampToValueAtTime(0,at+duration);
      oscillator.connect(gain);gain.connect(this.effects);
      voice={oscillator,gain,at,duration,volume,attack,hold,release,end:at+duration+.005};this.voices.add(voice);
      oscillator.onended=()=>{this.voices.delete(voice);oscillator.disconnect();gain.disconnect();};
      oscillator.start(at);oscillator.stop(voice.end);
    }catch{this.voices.delete(voice);try{oscillator?.disconnect();gain?.disconnect();}catch{}}
  }
  stopEffects(){
    if(!this.context)return;
    const now=this.context.currentTime;
    for(const voice of this.voices){
      if(voice.stopping||voice.end<=now)continue;
      try{
        const {gain,at,duration,volume,oscillator,attack,hold,release}=voice,t=now-at;
        // Match the scheduled envelope when cancelAndHoldAtTime is unavailable.
        const level=t<=0||t>=duration?0:t<attack?volume*t/attack:t<hold?volume:t<duration-release?volume*Math.pow(.0001/volume,(t-hold)/(duration-release-hold)):.0001*(duration-t)/release;
        if(gain.gain.cancelAndHoldAtTime)gain.gain.cancelAndHoldAtTime(now);
        else {gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(level,now);}
        gain.gain.linearRampToValueAtTime(0,now+FADE_OUT);
        voice.end=now+FADE_OUT+.005;voice.stopping=true;oscillator.stop(voice.end);
      }catch{}
    }
    this.currentCue=null;
  }
  resetRound(){
    this.stopEffects();this.roundEnded=false;this.lastCues.clear();this.lastCueAt=-Infinity;
  }
  // One short motif at a time. Repeated events are dropped, never queued.
  cue(name,priority,cooldown,notes,{force=false}={}){
    if(!this.enabled||this.blocked||!this.context||!this.active||(!force&&this.roundEnded))return false;
    const now=this.context.currentTime,current=this.currentCue;
    if(!force&&(now-(this.lastCues.get(name)??-Infinity)<cooldown||now-this.lastCueAt<CUE_GAP))return false;
    if(!force&&current&&now<current.until&&priority<=current.priority)return false;
    const interrupted=current&&now<current.until;
    if(interrupted)this.stopEffects();
    const offset=interrupted?FADE_OUT:0;
    this.lastCues.set(name,now);this.lastCueAt=now;
    const length=Math.max(...notes.map(n=>n[1]+(n[3]||0)))+offset+.013;
    this.currentCue={priority,until:now+length};
    for(const [freq,duration,volume,delay=0,end=freq,type='sine'] of notes)this.note(freq,duration,volume,delay+offset,type,end);
    return true;
  }
  tone(freq=523.25,duration=.1,volume=.095){
    const pitch=Math.max(440,Math.min(freq,660));
    this.cue('ui',3,.16,[[pitch,duration,volume,0,pitch*1.06,'sine']]);
  }
  release(column){
    // A little rubber-toy "bloop": buoyant pitch, with a quiet wooden overtone.
    const freq=[392,440,466.16,493.88,523.25][column%5]||440;
    this.cue('release',3,.16,[[freq,.12,.125,0,freq*1.24,'sine'],[freq*1.5,.075,.028,.04,freq*1.4,'triangle']]);
  }
  drop(){this.cue('drop',1,.28,[[466,.10,.075,0,370,'sine']]);}
  land(){this.cue('land',0,.3,[[440,.085,.065,0,349,'sine']]);}
  impact(force){
    if(force<.35)return;
    force=Math.max(0,Math.min(1,force));
    // Small soft pops support the animals; no bass-drum layer on collisions.
    this.cue('impact',0,.28,[[380+force*90,.085,.03+force*.025,0,330,'sine']]);
  }
  collect(seat){
    const freq=[523.25,587.33,659.25][seat%3]||523.25;
    this.cue('collect',2,.14,[[freq,.12,.12,0,freq*1.04,'sine'],[freq*.75,.09,.028,.018,freq*.75,'triangle']]);
  }
  depart(combo=1){
    // A cheerful toy-marimba answer to the boarding pops. Short, rounded
    // notes keep the melody playful without a metallic ring or a heavy kick.
    const scale=[523.25,587.33,659.25,783.99,880];
    const tier=combo>=10?3:combo>=6?2:combo>=3?1:0;
    const root=combo>=3?1:0;
    const notes=[[392,.11,.10,0,440,'sine'],...Array.from({length:tier+2},(_,i)=>{
      const freq=scale[Math.min(scale.length-1,root+i)];
      return [freq,.14,.10-i*.008,.06+i*.085,freq*1.015,i===1?'triangle':'sine'];
    })];
    this.cue('depart',4,.18,notes);
  }
  events(events){
    if(events.some(e=>e.type==='won'||e.type==='lost')){
      this.stopEffects();this.roundEnded=true;return;
    }
    if(events.some(e=>e.type==='undo'||e.type==='expand'))this.resetRound();
    // Select a single cue from simultaneous simulation events, even at 4×.
    const departures=events.filter(e=>e.type==='box');
    if(departures.length)return this.depart(departures[departures.length-1].combo||1);
    const release=events.find(e=>e.type==='release');if(release)return this.release(release.column);
    const boarding=events.find(e=>e.type==='collect');if(boarding)return this.collect(boarding.hole);
    if(events.some(e=>e.type==='drop'))return this.drop();
    if(events.some(e=>e.type==='land'))return this.land();
  }
  result(won,revealDelay=1.8){
    if(this.currentCue?.priority===10&&this.context?.currentTime<this.currentCue.until)return;
    const notes=won?[
      // A skipping toy-piano phrase follows the smaller, bouncing parade.
      ...(revealDelay>0?[392,523.25,659.25,783.99,659.25,523.25].map((f,i)=>[f,.13,.08,.1+i*.27,f*1.02,'sine']):[]),
      [523.25,.15,.10,revealDelay,523.25,'sine'],[659.25,.16,.095,revealDelay+.14,659.25,'sine'],[783.99,.24,.10,revealDelay+.29,783.99,'sine']
    ]:[
      [587.33,.15,.08,0,523.25,'sine'],[493.88,.17,.075,.19,440],[392,.18,.07,.40,349.23]
    ];
    this.cue('result',10,1,notes,{force:true});
  }
  toggle(){
    this.enabled=!this.enabled;storage.set('sound',this.enabled);
    if(!this.enabled)this.stopEffects();
    if(this.effects)this.fade(this.effects,this.enabled?EFFECT_LEVEL:0,.025);
    if(this.enabled){this.unlock();this.tone(800,.12);}
  }
  toggleMusic(){
    this.musicEnabled=!this.musicEnabled;storage.set('music',this.musicEnabled);
    if(this.musicEnabled)this.unlock();else this.stopMusic();
  }
  suspend(){this.stopEffects();this.blocked=true;try{this.context?.suspend()?.catch?.(()=>{});}catch{}}
  resume(){this.blocked=false;if(this.active)this.unlock();}
}
