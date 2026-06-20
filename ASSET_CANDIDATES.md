# 自製ピクセル素材方針

現行方針では、モンスター・勇者・タイル素材に外部素材や市販素材を使わない。`tools/build_pixel_assets.js` の図形描画で48pxセルの個別PNGとアトラスを決定的に生成する。

## 維持する仕様

- 48pxセル。
- 4フレーム。
- 8方向。
- `idle` / `attack` / `cast` / `dig` / `heal` / `eat` の6アクション。
- `assets/pixel/sprites.json` の公開順序。

## 生成時の確認ポイント

- `npm run assets:build` で `assets/pixel/source/v6-self-made/` とアトラスを再生成する。
- `npm run assets:check` で空フレーム、方向差分、職業アクション差分、卵形状、鉱脈密度、外部素材参照なしを検査する。
- 魔物は `slime` をスライム、`carniv` を犬系の獣、`spitter` を蜘蛛、`golem` をゴーレム、`flame` をドラゴンとして描く。
- 鉱脈はくどくしすぎず、水玉、牙、毒滴、岩片、火種の種別マークとして描く。
- 進化後の鉱脈は中のマークを変えず、枠だけを光らせる。
