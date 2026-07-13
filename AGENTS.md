# AGENTS.md

迷宮を守る — Phaser / Vite運用の迷宮防衛ゲーム（日本語UI・モバイル向け）。地中を掘って鉱脈から魔物を出し、少数精鋭の魔物と卵繁殖で最下層の迷宮コアを勇者の襲来から守る。

## ファイル構成
- `index.html` — ViteのHTML入口。
- `src/gameCore.js` — Phaser非依存の状態・ルール・公開テストAPI。
- `src/main.js` — Phaserシーン、描画、入力、DOM HUD連携。
- `src/style.css` — 画面レイアウトと見た目。
- `assets/pixel/` — Phaser版の48pxピクセル素材、アトラス、素材メタデータ。
- `tools/` — imagegen生成済みピクセル素材のアトラス構築・検査スクリプト。
- `test/` — Vitest製の仕様・素材・Phaser構成テスト。
- `dist/` — Vite build出力。コミット対象ではなく配布成果物。

## 実行・検証
正規実装はPhaser版。変更を入れたら、原則として以下を実行し「エラー0・全テスト通過」を確認する。

```bash
npm run assets:check
npm test
npm run build
npm run smoke
```

`npm test` には通常の仕様テストに加えて、`createGame()` と `update(ms)` でゲームを長時間・複数seed進行させるシミュレーションテストも含める。移動AI、勇者AI、繁殖、捕食、ウェーブ、コア攻撃などの時間進行ロジックに触る変更では、短い仕様テストだけで済ませず、シミュレーションテストを追加または更新して通す。将来シミュレーションテストを専用npm scriptに分けた場合は、この正規検証コマンド列にも追加する。

`npm run smoke` は `npm run build` 後の `dist` を Vite preview で一時配信し、空のChromeプロファイルでブラウザ初回ロードを確認する。`localStorage` が空の初回起動、Phaser canvas生成、公開名前空間の `title` 状態、開始ボタン押下後の `playing` 状態、実行時例外と素材404がないことまで見る。UI、起動処理、保存処理、Vite/Phaser連携に触った変更では、このスモーク確認を省略しない。

開発サーバー:

```bash
npm run dev
```

通常の動作確認は GitHub Pages で行う。ユーザーから明示指示がない限り、実装後にローカル開発サーバーを起動しない。
ただし `npm run smoke` は検証用にローカル preview サーバーを一時起動し、完了後に停止するため、この禁止事項の例外として毎回実行する。

素材生成を触った場合:

```bash
npm run assets:build
npm run assets:check
```

`npm run assets:build` は `assets/pixel/source/imagegen-v1/` の生成済みPNGを48pxへ切り出してアトラス化する。画像そのものをJSで描画・生成するコマンドではない。

変更を入れて検証が通ったら、ユーザーから別指示がない限り、その変更を毎回 Git commit する。コミット前に `git status --short` で対象ファイルを確認し、関係ない変更を混ぜない。
ローカルで開発したコミットは GitHub との差分が残らないように、ユーザーから別指示がない限り `git push origin master` まで実行する。push 前後に `git status -sb` を確認し、完了時は `## master...origin/master` のように ahead/behind 表示がない状態にする。

## 規約
- UI文言・コードコメントはすべて日本語。利用者とのやり取りも日本語。
- 正規実装はPhaser/Viteに一本化する。Godot、Pixi、旧Canvas実行系は復活させない。
- モンスター、勇者、卵、タイル、エフェクト、アイテム、デバフ、会話立ち絵の新規作成・更新は、OpenAIの組み込み `imagegen` で生成する。外部素材は使わない。
- `tools/build_pixel_assets.js` はimagegen生成済みPNGの切り出し、48px化、色違い、4フレーム化、アトラス合成だけを行う。図形描画や手続き生成で画像を代替しない。
- `imagegen` が利用できない、生成に失敗する、または利用上限に達した場合は、JS / Canvas / SVG / 外部素材 / 手描画へ勝手に切り替えない。理由と生成できなかった範囲をユーザーへ報告して作業を止める。
- CLIやAPIなど別経路の画像生成へ切り替える場合も、事前にユーザーの明示承認を得る。
- `localStorage` / `sessionStorage` は使わない。
- バランス調整はデータ駆動。ロジック内に数値を散らさず、`src/gameCore.js` の定数ブロックと各テーブルの値を変える。
- 既存の数値バランス、種別名、48pxセル、11x16盤面、4フレーム、8方向、7アクション（`idle` / `attack` / `cast` / `dig` / `heal` / `eat` / `dodge`）素材仕様を維持する。
- モバイルWebGL互換のため、配信用アトラスは縦横とも4096px以下を維持する。
- テストはVitestを使い、`createGame()` で独立したゲームを生成し、`GameRules.update(ms)` 相当の `update(ms)` を直接呼べる形を維持する。
- 版権に注意：実在ゲームの名称・固有表現を入れない（オリジナルを維持）。

## どこに何があるか
- **調整用定数**: `src/gameCore.js` 冒頭の `MONSTER_CAP` / `BREED_LIMIT` / `MAX_HEROES` / `WAVE_INTERVAL` / `FIRST_GRACE` / `HERO_STAGGER` / `DIG_COST` / `START_NUT` / `CORE_MAX` / `VEIN_CAP` / `EGG_HATCH` など。
- **`KINDS`**: 魔物テーブル（hp/atk/range/rank/breedEvery/breedCap...）。
- **`VEIN`**: 鉱脈の種別、通常種、上位種、接触進化数、解禁ウェーブ。
- **`HERO_CLASSES`**: 戦士/盾兵/魔法使い/僧侶。
- **`createGame()`**: 独立したゲーム状態とルールAPIを作る。テストと公開名前空間で使う。
- **`update(ms)`**: ウェーブ、鉱脈進化、増殖、卵、捕食、戦闘、勇者AI、コア攻撃を進める。
- **`MainScene`**: Phaserでタイル、アクター、エフェクトを同期描画する。

## 現在のゲーム仕様（要点）
- 土をタップで採掘（固定の `DIG_COST=1` 消費）。開始栄養は `START_NUT=25`。色付きの鉱脈を掘ると対応する魔物が1体出て、跡は通路になる。
- 鉱脈は隣接した魔物の接触回数が `touchNeed` に達すると上位鉱脈になる。後半の強い鉱脈ほど必要接触数が多い。上位鉱脈を掘ると上位種が1体出る。
- 自然湧き・盤面養分・個体進化はない。栄養は採掘用のグローバル資源で、時間経過と勇者撃破報酬で増える。
- 下位種は遅めに直接増殖する。上位種は直接増殖せず、単独で低確率に卵を作り、卵は時間経過で孵化する。
- 魔物は自分より序列（`rank`）が低い隣接魔物を一定確率で捕食する。序列差が大きいほど捕食されやすく、捕食した個体はHPを回復する。
- 魔物は発生地点をホームとして持ち、遠くへ行きすぎると戻りやすい。掘った場所が防衛線になる。
- 遠距離攻撃（魔法使い・毒吐き・タランチュラ）は敵味方とも壁を貫通しない（`hasLOS`）。
- 勇者は最下層の迷宮コアへ経路探索し、塞がれると壁を掘り、コアマス上でのみコアを攻撃する。コアHPが0で敗北。
