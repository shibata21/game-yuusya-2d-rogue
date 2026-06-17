# TODO

## 画像素材刷新

- 48pxセルの高密度ドット素材へ刷新済み。
- `assets/pixel/source/v2/` の個別PNGから `actors.png` / `tiles.png` / `effects.png` / `sprites.json` を再生成する。
- 読み込みURLには `PIXEL_ASSET_VERSION` のバージョン文字列を付ける。
- Pixi側は画像ロード完了、寸法一致、全フレーム切り出し成功を確認してからピクセル描画を有効にする。

## 検証

- `npm run assets:build`
- `npm run assets:check`
- `node --check hakaishin_dungeon.js`
- `node --check test_hakaishin_dungeon.js`
- `node --check hakaishin_dungeon_core.js`
- `node --check hakaishin_dungeon_logic.js`
- `node --check hakaishin_dungeon_canvas.js`
- `node --check hakaishin_dungeon_pixi.js`
- `node test_hakaishin_dungeon.js hakaishin_dungeon.html`

## 注意

- スクショ画像はGitに含めない。
- 修正後はAGENTS.md通り、関連ファイルだけをコミットする。
