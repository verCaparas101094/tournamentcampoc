import {test} from 'node:test';import assert from 'node:assert/strict';import {initialScore,rally} from '../src/scoring.mjs';
test('opening doubles side-out skips the second service turn',()=>{const s=rally(initialScore(),1);assert.equal(s.serving,1);assert.equal(s.server,1);assert.deepEqual(s.points,[0,0]);});
test('regular doubles uses both service turns before side-out',()=>{let s=rally(initialScore(),1);s=rally(s,0);assert.equal(s.serving,1);assert.equal(s.server,2);s=rally(s,0);assert.equal(s.serving,0);assert.equal(s.server,1);});
test('only serving team scores and input state is immutable',()=>{const s=initialScore();const next=rally(s,0);assert.deepEqual(next.points,[1,0]);assert.deepEqual(s.points,[0,0]);});
test('singles immediately changes service',()=>{const s=rally(initialScore(false),1,11,false);assert.equal(s.serving,1);assert.deepEqual(s.points,[0,0]);});
test('win by two and ignore rallies after a game is over',()=>{let s={points:[10,10],serving:0,server:1,winner:null};s=rally(s,0);assert.equal(s.winner,null);s=rally(s,0);assert.equal(s.winner,0);assert.deepEqual(rally(s,1),s);});
test('15 and 21 point games do not end at 11',()=>{for(const target of [15,21]){let s={points:[10,0],serving:0,server:1,winner:null};s=rally(s,0,target);assert.equal(s.winner,null);}});
