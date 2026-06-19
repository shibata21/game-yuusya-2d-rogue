# TODO

## 画像素材刷新

- 48pxセルの高密度ドット素材へ刷新済み。
- `assets/pixel/source/v5/` の8方向・アクション別個別PNGから `actors.png` / `tiles.png` / `effects.png` / `sprites.json` を再生成する。
- キャラクター素材は `assets/external/cc0/` の商用利用可能なCC0外部素材のみから生成する。
- マーク周辺は円囲みではなく、角張った破片・亀裂・放射表現で統一する。
- 読み込みURLには `PIXEL_ASSET_VERSION` のバージョン文字列を付ける。
- Pixi側は画像ロード完了、寸法一致、全フレーム切り出し成功を確認してからピクセル描画を有効にする。

## Godot CLI 全面移行

HTML5/Canvas/PixiJS 版から Godot CLI 運用の Godot 版へ全面移行する。既存HTML版は移行中の仕様参照には使うが、最終的な正規実装は Godot 版に置き換える。

### 固定環境

- Godot は `4.6.3 stable` の Standard 版に固定する。
- C# は使わず、GDScript に統一する。Web export 互換とGUT運用を優先する。
- ローカル確認は `godot --version` で `4.6.3` 系を確認する。
- Godot CLI は `godot --path godot ...` を基本形にする。
- Godot プロジェクトは `godot/` 配下に置く。

### プロジェクト構成

- `godot/project.godot` を作成する。
- `godot/scenes/Main.tscn` をメインシーンにする。
- `godot/scripts/` にロジック、描画、UI、入力を分離する。
- `godot/assets/pixel/` に既存 `assets/pixel/*.png` と `sprites.json` 相当の情報を取り込む。
- 既存の48pxセル、11x16盤面、4フレーム、8方向、6アクションの素材仕様は初回移行では維持する。

### 実装マイルストーン

- [x] M1: Godot CLI 起動、空のメインシーン、Web export preset、GUT実行を通す。
- [x] M2: 11x16、48pxセル、土/通路/岩盤/入口/コア/鉱脈の盤面描画を再現する。
- [x] M3: `tryDig`、鉱脈採掘、魔物出現、HUD更新、タップ/クリック入力を移植する。
- [x] M4: 魔物AI、下位種増殖、上位種卵生成、卵孵化、捕食、視線判定、戦闘を移植する。
- [x] M5: 勇者AI、経路探索、壁掘り、コア攻撃、ウェーブ、敗北/再開UIを移植する。
- [x] M6: 既存仕様テストをGUTへさらに移植し、HTML/JSテストを退役する。
- [ ] M7: Web exportを生成し、モバイルブラウザで表示・入力・pixelated表示を確認する。
  - Web export生成は成功済み。
  - 実ブラウザ確認はこのコンテナに利用可能なChromium/Firefoxがなく、Playwrightブラウザ取得もネットワークポリシーで拒否されたため未完了。OSの`chromium-browser`はsnapd前提で、snapdが起動できない環境だった。

### Godot側の主要クラス

- `GameState.gd`: `grid`、`monsters`、`heroes`、`eggs`、`effects`、`wave`、`score`、`coreHP` を保持する純粋状態。
- `GameRules.gd`: 採掘、出現、更新、AI、戦闘、経路探索、視線判定を担当する。
- `BoardView.gd`: タイル、鉱脈、コア、エフェクトの表示を担当する。
- `ActorView.gd`: 魔物/勇者/卵のアニメーション表示を担当する。
- `HudView.gd`: HP、栄養、ウェーブ、スコア、開始/敗北UIを担当する。

### 実装方針

- 初期移行では `Sprite2D` / `AnimatedSprite2D` ベースで描画する。盤面は176セルなので、TileMap最適化よりコードで制御しやすい構成を優先する。
- ゲームループは `_process(delta)` から `GameRules.update(delta * 1000.0)` を呼ぶ。
- GUTでは `update(ms)` を直接呼び、仕様テストを決定的にする。
- RNGは `RandomNumberGenerator` を `GameState` に持たせ、テストでは固定seedを使う。
- 既存の数値バランス、種別名、鉱脈名、勇者職業、ウェーブ仕様は初回移行では変更しない。
- `localStorage` / `sessionStorage` は引き続き使わない。

### Godot CLI 検証

- `godot --version`
- `godot --headless --path godot --import`
- `godot -d -s --path godot addons/gut/gut_cmdln.gd -gdir=res://test -gexit`
- `godot --headless --path godot --export-release Web ../dist/index.html`

### GUTへ移植する仕様テスト

- [x] 盤面初期化、採掘コスト、鉱脈採掘、上位鉱脈化。
- [x] 下位種増殖、上位種卵生成、卵孵化、魔物/卵上限。
- [x] 捕食、遠距離LOS、斜め壁角の射線遮断。
- [x] 勇者クラス解禁、壁掘り、コア攻撃、ウェーブ人数上限。
- [x] 長時間シミュレーションで例外が出ないこと。

### 完了条件

- GUTが全通過する。
- Web exportが成功する。
- モバイル幅で盤面、HUD、開始/敗北UIが破綻しない。
- 移行完了時は Godot 版を正規起動対象にし、HTML/JS版のテストは退役またはGodot仕様テストへ置き換える。
- 修正後はAGENTS.md通り、関連ファイルだけをコミットし、GitHubとの差分が残らないようにpushする。

## 検証

- `npm run assets:build`
- `npm run assets:check`
- `node --check hakaishin_dungeon.js`
- `node --check test_hakaishin_dungeon.js`
- `node --check hakaishin_dungeon_core.js`
- `node --check hakaishin_dungeon_logic.js`
- `node --check hakaishin_dungeon_canvas.js`
- `node --check hakaishin_dungeon_pixi.js`
- `node --check tools/build_pixel_assets.js`
- `node --check tools/check_pixel_assets.js`
- `npm test`
- `node test_hakaishin_dungeon.js hakaishin_dungeon.html`

## 注意

- スクショ画像はGitに含めない。
- 修正後はAGENTS.md通り、関連ファイルだけをコミットする。
