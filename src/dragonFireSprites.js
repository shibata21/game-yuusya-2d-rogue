"use strict";

export function hideDragonFireSprite(sprite) {
  sprite.setVisible(false);
  sprite.setFrame(0);
  sprite.setRotation(0);
  sprite.setScale(1, 1);
  sprite.setAlpha(1);
  sprite.clearTint();
}

export function showDragonFireSprite(sprite, state) {
  sprite.setVisible(true);
  sprite.setFrame(state.frame);
  sprite.setPosition(state.x, state.y);
  sprite.setRotation(state.rotation);
  sprite.setScale(state.scaleX, 1);
  sprite.setAlpha(state.alpha);
  sprite.clearTint();
  sprite.setDepth(state.depth);
}
