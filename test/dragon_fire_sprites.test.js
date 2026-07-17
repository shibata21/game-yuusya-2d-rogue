"use strict";

import { describe, expect, it } from "vitest";
import { hideDragonFireSprite, showDragonFireSprite } from "../src/dragonFireSprites.js";

function mockSprite() {
  const state = { visible: false, frame: 0, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, tint: null, depth: 0 };
  return {
    state,
    setVisible(value) { state.visible = value; return this; },
    setFrame(value) { state.frame = value; return this; },
    setPosition(x, y) { state.x = x; state.y = y; return this; },
    setRotation(value) { state.rotation = value; return this; },
    setScale(x, y = x) { state.scaleX = x; state.scaleY = y; return this; },
    setAlpha(value) { state.alpha = value; return this; },
    setTint(value) { state.tint = value; return this; },
    clearTint() { state.tint = null; return this; },
    setDepth(value) { state.depth = value; return this; },
  };
}

describe("ドラゴン炎スプライト", () => {
  it("斜め表示から非表示・縦横表示へ再利用しても状態を残さない", () => {
    const sprite = mockSprite();
    sprite.setTint(0xff00ff);
    showDragonFireSprite(sprite, {
      frame: 35,
      x: 120,
      y: 168,
      rotation: Math.PI / 4,
      scaleX: Math.SQRT2 * 1.4,
      alpha: 0.65,
      depth: 490.002,
    });
    expect(sprite.state).toMatchObject({
      visible: true,
      frame: 35,
      x: 120,
      y: 168,
      rotation: Math.PI / 4,
      scaleX: Math.SQRT2 * 1.4,
      scaleY: 1,
      alpha: 0.65,
      tint: null,
      depth: 490.002,
    });

    hideDragonFireSprite(sprite);
    expect(sprite.state).toMatchObject({ visible: false, frame: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, tint: null });

    showDragonFireSprite(sprite, { frame: 4, x: 48, y: 72, rotation: 0, scaleX: 1.4, alpha: 1, depth: 490 });
    expect(sprite.state).toMatchObject({ visible: true, frame: 4, rotation: 0, scaleX: 1.4, scaleY: 1, alpha: 1, tint: null });
  });
});
