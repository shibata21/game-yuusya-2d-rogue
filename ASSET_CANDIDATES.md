# imagegenピクセル素材方針

現行のゲーム画像は、OpenAIの組み込み `imagegen` で生成する。外部素材や市販素材は使わない。生成済み原画は `assets/pixel/source/imagegen-v1/` に保存し、生成ツール、並び順、色違い対応、プロンプト要約を `manifest.json` に記録する。

旧JS手続き生成素材は削除せず、`assets/pixel/source/legacy-v6-self-made/` に退避している。現行アトラスには使用しない。

## 維持する仕様

- 48pxセル。
- 4フレーム。
- 公開方向は8方向。原画は左右反転を考慮した5方向。
- `idle` / `attack` / `cast` / `dig` / `heal` / `eat` / `dodge` の7アクション。
- 既存の種別名と `assets/pixel/sprites.json` の公開順序。
- 第一進化と第二進化は、通常種と同じ形状を保った色違い。
- 配信用アトラスはモバイルWebGL向けに縦横4096px以下。

## 作成手順

1. `imagegen` で高密度ピクセルアートの原画を生成する。
2. 透過が必要な素材は単色クロマキーで生成し、imagegenスキル付属のクロマキー除去処理を使う。
3. 原画と並び順を `assets/pixel/source/imagegen-v1/manifest.json` に登録する。
4. `npm run assets:build` で原画を48pxへ切り出し、4フレーム化してアトラスを構築する。
5. `npm run assets:check` で生成元、空セル、方向・アクション差分、色違い形状、アトラス寸法を検査する。

`tools/build_pixel_assets.js` は原画の切り出し・縮小・色変換・配置だけを担当する。JS / Canvas / SVGによる図形描画で画像を作らない。

## imagegenを使えない場合

`imagegen` が利用できない、生成に失敗する、または利用上限に達した場合は、別手段で勝手に画像を作らない。JS、Canvas、SVG、外部素材、手描画、未承認のCLI/APIへ切り替えず、利用できない理由と未完了の素材範囲をユーザーへ報告する。

別の画像生成経路を使う必要がある場合は、実行前にユーザーの明示承認を得る。
