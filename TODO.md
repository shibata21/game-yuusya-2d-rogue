# TODO

## 画像素材の表示修正

- `assets/pixel/tiles.png` の各32pxセル左端/右端に混入した白線・罫線ピクセルを除去する。
- `actors.png` / `tiles.png` / `effects.png` の読み込みURLにバージョン文字列を付け、ブラウザキャッシュで古い画像が残る問題を避ける。
- Pixi側で `actors.png` のフレームテクスチャ作成が確実に成功しているか確認する。
- モンスターが生成済みピクセル画像で表示されていることを目視確認する。
- 必要ならモンスターのPixiスプライトを少し拡大し、生成素材が反映されたことを分かりやすくする。

## 検証

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
