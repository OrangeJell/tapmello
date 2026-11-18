import test from 'node:test';
import assert from 'node:assert/strict';
import { flightFrames } from '../js/motion.js';

test('a flight preserves source size and lands exactly on the receiving head in every direction',()=>{
  for(const [dx,dy] of [[-190,-400],[190,-400],[0,-60],[80,0],[-80,120]]) {
    for(const screwIn of [false,true]) {
      const frames=flightFrames(dx,dy,.73,25/29,{startY:-14,screwIn});
      assert.ok(frames[0].x===0&&frames[0].y===-14&&frames[0].scale===.73&&frames[0].turn===0);
      const last=frames.at(-1);
      assert.deepEqual([last.x,last.y,last.scale],[dx,dy,25/29]);
      assert.ok(last.turn%360===0,'symbol must hand off upright');
      assert.ok(frames.every(f=>[f.x,f.y,f.scale,f.turn].every(Number.isFinite)&&f.scale>0));
    }
  }
});

test('flight starts and stops softly without a jump at the insertion phase',()=>{
  const frames=flightFrames(-160,-300,.8,1,{startY:-14,screwIn:true});
  const distances=frames.slice(1).map((f,i)=>Math.hypot(f.x-frames[i].x,f.y-frames[i].y));
  assert.ok(distances[0]<.1 && distances.at(-1)<.1,'endpoints should settle before handoff');
  assert.ok(Math.max(...distances)<15,'no sampled frame should teleport');
  for(let i=1;i<frames.length;i++)assert.ok(Math.abs(frames[i].scale-frames[i-1].scale)<.012);
  assert.ok(frames.slice(45).every(f=>Math.hypot(f.x+160,f.y+300)<25),'insertion stays close to the hole');
});

test('a screw lifted from swinging glass keeps its current symbol orientation before landing upright',()=>{
  const frames=flightFrames(30,-260,.9,1,{startY:-14,startTurn:137,screwIn:true});
  assert.equal(frames[0].turn,137);assert.equal(frames.at(-1).turn,-720);
  assert.ok(Math.abs(frames[1].turn-137)<.1,'no orientation snap on departure');
});
