// Original eight-bar, 108 BPM loop: rounded plucks, offbeat chords and light bass.
// Generated once locally; no streaming, percussion noise or audio-file dependency.
export function createMusicSamples(sampleRate=44100){
  const beat=60/108,duration=32*beat,data=new Float32Array(Math.round(duration*sampleRate));
  const add=(midi,start,length,volume,bass=false)=>{
    const freq=440*2**((midi-69)/12),offset=Math.round(start*sampleRate),count=Math.round(length*sampleRate);
    for(let i=0;i<count;i++){
      const t=i/sampleRate;
      const attack=Math.min(1,t/.012),release=Math.min(1,(count-1-i)/(sampleRate*.075));
      const envelope=attack*attack*(3-2*attack)*Math.exp(-t*(bass?5:7))*release*release*(3-2*release);
      const wave=Math.sin(2*Math.PI*freq*t)+(bass?.06:.14)*Math.sin(2*Math.PI*freq*2*t);
      data[(offset+i)%data.length]+=wave*envelope*volume;
    }
  };
  const phrases=[
    [[0,72],[.75,76],[1.5,79],[2.5,76],[3,74]],
    [[0,72],[1,69],[1.75,72],[2.5,76]],
    [[.5,77],[1.25,76],[2,74],[3,72]],
    [[0,71],[.75,74],[1.5,79],[3,74]],
    [[0,76],[.75,79],[1.5,76],[2.5,74],[3.25,72]],
    [[0,69],[1,72],[1.75,77],[2.5,76]],
    [[.5,74],[1.25,71],[2,67],[3,71]],
    [[0,72],[1,76],[2,72]]
  ];
  const chords=[[48,52,55],[45,48,52],[53,57,60],[43,47,50],[48,52,55],[53,57,60],[43,47,50],[48,52,55]];
  phrases.forEach((phrase,bar)=>phrase.forEach(([at,note])=>add(note,(bar*4+at)*beat,.30,.18)));
  chords.forEach((chord,bar)=>{
    [0,2].forEach(at=>add(chord[0]+12,(bar*4+at)*beat,.25,.085,true));
    [.5,1.5,2.5,3.5].forEach(at=>chord.forEach(note=>add(note+12,(bar*4+at)*beat,.17,.038)));
  });
  // Fixed headroom keeps the melody present without competing with game cues.
  let peak=0;for(const value of data)peak=Math.max(peak,Math.abs(value));
  if(peak>0)for(let i=0;i<data.length;i++)data[i]*=.24/peak;
  return {data,sampleRate,duration};
}
