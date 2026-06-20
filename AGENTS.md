# AGENTS.md

破壊神ダンジョン — Phaser / Vite運用の地下防衛ゲーム（日本語UI・モバイル向け）。地中を掘って鉱脈から魔物を出し、少数精鋭の魔物と卵繁殖で最下層の魔王コアを勇者の襲来から守る。

## ファイル構成
- `index.html` — ViteのHTML入口。
- `src/gameCore.js` — Phaser非依存の状態・ルール・公開テストAPI。
- `src/main.js` — Phaserシーン、描画、入力、DOM HUD連携。
- `src/style.css` — 画面レイアウトと見た目。
- `assets/pixel/` — Phaser版の48pxピクセル素材、アトラス、素材メタデータ。
- `tools/` — ピクセル素材の生成・検査スクリプト。
- `test/` — Vitest製の仕様・素材・Phaser構成テスト。
- `dist/` — Vite build出力。コミット対象ではなく配布成果物。

## 実行・検証
正規実装はPhaser版。変更を入れたら、原則として以下を実行し「エラー0・全テスト通過」を確認する。

```bash
npm run assets:check
npm test
npm run build
```

開発サーバー:

```bash
npm run dev
```

素材生成を触った場合:

```bash
npm run assets:build
npm run assets:check
```

変更を入れて検証が通ったら、ユーザーから別指示がない限り、その変更を毎回 Git commit する。コミット前に `git status --short` で対象ファイルを確認し、関係ない変更を混ぜない。
ローカルで開発したコミットは GitHub との差分が残らないように、ユーザーから別指示がない限り `git push origin master` まで実行する。push 前後に `git status -sb` を確認し、完了時は `## master...origin/master` のように ahead/behind 表示がない状態にする。

## 規約
- UI文言・コードコメントはすべて日本語。利用者とのやり取りも日本語。
- 正規実装はPhaser/Viteに一本化する。Godot、Pixi、旧Canvas実行系は復活させない。
- `localStorage` / `sessionStorage` は使わない。
- バランス調整はデータ駆動。ロジック内に数値を散らさず、`src/gameCore.js` の定数ブロックと各テーブルの値を変える。
- 既存の数値バランス、種別名、48pxセル、11x16盤面、4フレーム、8方向、6アクション素材仕様を維持する。
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
- 下位種は遅めに直接増殖する。上位種は直接増殖せず、同種上位2体が接触している時に低確率で卵を作り、卵は時間経過で孵化する。
- 魔物は自分より序列（`rank`）が低い隣接魔物を一定確率で捕食する。序列差が大きいほど捕食されやすく、捕食した個体はHPを回復する。
- 魔物は発生地点をホームとして持ち、遠くへ行きすぎると戻りやすい。掘った場所が防衛線になる。
- 遠距離攻撃（魔法使い・毒吐き・タランチュラ）は敵味方とも壁を貫通しない（`hasLOS`）。
- 勇者は最下層のコアへ経路探索し、塞がれると壁を掘り、コアマス上でのみコアを攻撃する。コアHPが0で敗北。
