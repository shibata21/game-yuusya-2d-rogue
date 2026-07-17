"use strict";

export const BGM_TRACKS = Object.freeze([
  Object.freeze({ key: "bgmVeinPulse", file: "bgm_vein_pulse.wav", title: "地脈の鼓動" }),
  Object.freeze({ key: "bgmMonsterMarch", file: "bgm_monster_march.wav", title: "魔群の行進" }),
  Object.freeze({ key: "bgmDeepRitual", file: "bgm_deep_ritual.wav", title: "深層の儀式" }),
]);

const BGM_PLAYBACK_STATES = new Set(["playing", "dialogue", "itemChoice", "shop", "trap", "debuffNotice"]);

function randomIndex(random, size) {
  const value = Number(random());
  const bounded = Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0;
  return Math.floor(bounded * size);
}

export function isBgmPlaybackState(state) {
  return BGM_PLAYBACK_STATES.has(state);
}

export function createBgmPlaylist({ tracks = BGM_TRACKS, random = Math.random } = {}) {
  const source = [...tracks];
  let queue = [];
  let previousKey = null;

  function refill() {
    queue = [...source];
    for (let i = queue.length - 1; i > 0; i--) {
      const j = randomIndex(random, i + 1);
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    if (queue.length > 1 && queue[0].key === previousKey) {
      const swapIndex = queue.findIndex((track, index) => index > 0 && track.key !== previousKey);
      if (swapIndex > 0) [queue[0], queue[swapIndex]] = [queue[swapIndex], queue[0]];
    }
  }

  return Object.freeze({
    next() {
      if (queue.length === 0) refill();
      const track = queue.shift() || null;
      if (track) previousKey = track.key;
      return track;
    },
    reset() {
      queue = [];
    },
  });
}
