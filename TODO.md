# TODO

## Phaser一本化

- Godot / Pixi / 旧Canvas実行系は廃止済み。
- 正規実装は `index.html` + `src/` のPhaser/Vite版。
- 配布は `npm run build` で `dist/` へ生成する。

## 画像素材

- 48pxセルの高密度ドット素材を継続利用する。
- `assets/pixel/source/v5/` の8方向・アクション別個別PNGから `actors.png` / `tiles.png` / `effects.png` / `sprites.json` を再生成する。
- キャラクター素材は `assets/external/cc0/` の商用利用可能なCC0外部素材のみから生成する。
- 読み込みURLには `PIXEL_ASSET_VERSION` のバージョン文字列を付ける。
- Vite build時は `vite.config.mjs` で `assets/pixel/` を `dist/assets/pixel/` へコピーする。

## 実装方針

- ゲームルールは `src/gameCore.js` に集約し、Phaser非依存に保つ。
- Phaser側は `src/main.js` で描画・入力・HUD同期だけを担当する。
- `createGame({ seed })` から独立状態を作り、Vitestでは `update(ms)` を直接呼ぶ。
- 既存の数値バランス、種別名、鉱脈名、勇者職業、ウェーブ仕様は維持する。
- `localStorage` / `sessionStorage` は使わない。

## 検証

正規検証:

```bash
npm run assets:check
npm test
npm run build
```

素材生成を変更した場合:

```bash
npm run assets:build
npm run assets:check
```

## 注意

- スクショ画像はGitに含めない。
- 修正後は関連ファイルだけをコミットする。
