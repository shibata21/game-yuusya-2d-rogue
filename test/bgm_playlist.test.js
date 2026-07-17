"use strict";

import { describe, expect, it } from "vitest";
import { BGM_TRACKS, createBgmPlaylist, isBgmPlaybackState } from "../src/bgmPlaylist.js";

describe("BGMプレイリスト", () => {
  it("固有のキーとファイル名を持つ3曲で構成される", () => {
    expect(BGM_TRACKS).toHaveLength(3);
    expect(new Set(BGM_TRACKS.map((track) => track.key)).size).toBe(3);
    expect(new Set(BGM_TRACKS.map((track) => track.file)).size).toBe(3);
    expect(BGM_TRACKS.map((track) => track.title)).toEqual(["地脈の鼓動", "魔群の行進", "深層の儀式"]);
  });

  it("一巡するまで全3曲を一度ずつ選び、巡回境界でも同じ曲を連続させない", () => {
    const randomValues = [0, 0.7, 0.2, 0.95, 0.4, 0.1, 0.8, 0.3];
    let randomIndex = 0;
    const playlist = createBgmPlaylist({ random: () => randomValues[randomIndex++ % randomValues.length] });
    const played = Array.from({ length: 18 }, () => playlist.next());

    for (let start = 0; start < played.length; start += 3) {
      expect(new Set(played.slice(start, start + 3).map((track) => track.key)).size).toBe(3);
    }
    for (let i = 1; i < played.length; i++) expect(played[i].key).not.toBe(played[i - 1].key);
  });

  it("リセット後は新しい一巡を組み直す", () => {
    const playlist = createBgmPlaylist({ random: () => 0 });
    const first = playlist.next();
    playlist.reset();
    const restarted = Array.from({ length: 3 }, () => playlist.next());

    expect(restarted[0].key).not.toBe(first.key);
    expect(new Set(restarted.map((track) => track.key)).size).toBe(3);
  });

  it("曲がない場合と1曲だけの場合にも安全に動く", () => {
    expect(createBgmPlaylist({ tracks: [] }).next()).toBeNull();
    const only = Object.freeze({ key: "only", file: "only.wav", title: "単曲" });
    const playlist = createBgmPlaylist({ tracks: [only], random: () => 0.5 });
    expect(playlist.next()).toBe(only);
    expect(playlist.next()).toBe(only);
  });

  it("防衛中の画面だけでBGM再生を継続する", () => {
    for (const state of ["playing", "dialogue", "itemChoice", "shop", "trap", "debuffNotice"]) {
      expect(isBgmPlaybackState(state), state).toBe(true);
    }
    for (const state of ["title", "dead", "clear", null]) expect(isBgmPlaybackState(state), String(state)).toBe(false);
  });
});
