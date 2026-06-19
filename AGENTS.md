# AGENTS.md

破壊神ダンジョン — Godot CLI / Web export運用の地下防衛ゲーム（日本語UI・モバイル向け）。地中を掘って鉱脈から魔物を出し、少数精鋭の魔物と卵繁殖で最下層の魔王コアを勇者の襲来から守る。

## ファイル構成
- `hakaishin_dungeon.html` — 旧HTML版。移行後は仕様参照と互換確認用として扱う。
- `hakaishin_dungeon.css` — 画面レイアウトと見た目。
- `hakaishin_dungeon.js` — ゲームロジックとCanvas描画。
- `godot/` — Godot 4.6.3 Standard / GDScript 版。正規実装。
- `godot/project.godot` — Godotプロジェクト設定。
- `godot/scenes/Main.tscn` — Godot版のメインシーン。
- `godot/scripts/` — Godot版の状態・ルール・描画・UIスクリプト。
- `godot/assets/fonts/` — Godot Web版の日本語UI用フォント。Web環境のシステムフォントには依存しない。
- `godot/test/` — GUT製のGodot版仕様テスト。
- `test/hakaishin_dungeon.test.js` — 旧HTML版のVitest製互換テスト。新規仕様テストは原則GUTへ追加する。
- `test_hakaishin_dungeon.js` — 旧Node製テスト互換ランナー。移行中の回帰確認として残す。

## 実行・検証
正規実装はGodot版。`godot/` を Godot 4.6.3 Standard で開くかCLIで実行する。
変更を入れたら、正規実装であるGodot版について必ず以下を実行し「エラー0・全テスト通過」を確認すること：

```bash
# Godot CLI確認（Godot 4.6.3 Standard）
godot --version
godot --headless --path godot --import
godot -d -s --headless --path godot addons/gut/gut_cmdln.gd -gdir=res://test -gexit
godot --headless --path godot --export-release Web ../dist/index.html
```

旧HTML版を触った場合のみ、互換確認として以下も実行する：

```bash
node --check hakaishin_dungeon.js
node --check test_hakaishin_dungeon.js
npm test
node test_hakaishin_dungeon.js hakaishin_dungeon.html
```

機能を追加したら、Godot版は `godot/test/` のGUTテストへ対応セクションを足す。旧HTML版を触る場合のみ、必要に応じて `__GAME__` フックも更新する。
変更を入れて検証が通ったら、ユーザーから別指示がない限り、その変更を毎回 Git commit する。コミット前に `git status --short` で対象ファイルを確認し、関係ない変更を混ぜない。
ローカルで開発したコミットは GitHub との差分が残らないように、ユーザーから別指示がない限り `git push origin master` まで実行する。push 前後に `git status -sb` を確認し、完了時は `## master...origin/master` のように ahead/behind 表示がない状態にする。

## 規約
- UI文言・コードコメントはすべて日本語。利用者とのやり取りも日本語。
- 外部ランタイム依存なし。`<head>` の Web フォント参照を除き、ローカルファイルだけで動く構成を維持。
- `localStorage` / `sessionStorage` は使わない。
- ファイルが大きいので編集はピンポイントで行う。
- バランス調整はデータ駆動。ロジック内に数値を散らさず、`<script>` 冒頭の定数ブロックと各テーブルの値を変える。
- Godot版の初回移行では既存の数値バランス、種別名、48pxセル、11x16盤面、4フレーム、8方向、6アクション素材仕様を維持する。
- Godot版はC#を使わずGDScriptに統一する。テストはGUTを使い、`GameRules.update(ms)` を直接呼べる形を維持する。
- 版権に注意：実在ゲームの名称・固有表現を入れない（オリジナルを維持）。

## どこに何があるか（`hakaishin_dungeon.js` 内）
- **調整用定数（冒頭）**：`MONSTER_CAP` / `BREED_LIMIT` / `MAX_HEROES` / `WAVE_INTERVAL` / `FIRST_GRACE` / `HERO_STAGGER` / `DIG_COST` / `START_NUT` / `CORE_MAX` / `VEIN_CAP` / `EGG_HATCH`・`EGG_CHECK`・`EGG_CHANCE`・`EGG_KIND_CAP` / `EAT_CHECK`・`EAT_CHANCE_STEP` / `EFFECT_CAP` / `DIG_BREAK`・`DIG_CD` / `EVO_TIME`（鉱脈の熟成時間）/ `BORN_ANIM`。
- **`KINDS`** — 魔物テーブル（hp/atk/range/rank/breedEvery/breedCap…）。通常種＋上位種（`eliteOf`＝元スプライト, `tint`＝色替えフィルタ）。
- **`VEIN`** — 鉱脈の種別 → `kind`（通常種）・`evoKind`（上位種）・`touchNeed`・色・解禁ウェーブ。
- **`HERO_CLASSES`** — 戦士/盾/魔法/僧侶。勇者のHP・攻撃スケーリングは `spawnHero()`、1ウェーブの人数は `startWave()`。
- **`update(dt)`** — メインループ：ウェーブ発生／鉱脈の熟成／下位種増殖／卵の孵化／上位種の卵繁殖／捕食・魔物AI・戦闘／勇者AI・経路・壁掘り／コアへのダメージ。
- **`draw()`** — Canvas描画。各スプライト関数と `drawEffect`。
- **補助関数**：`tryDig`（採掘）/ `spawnMonster`・`spawnHero`・`spawnEgg` / `updateEggs` / `updateEliteEggBreeding` / `tryEatLower` / `heroStep`（重み付きダイクストラ）/ `hasLOS`（ブレゼンハムの視線判定）/ `openNeighbors` / エフェクト群（`toast`/`popDmg`/`banner`/`slash`/`shoot`）。

## 現在のゲーム仕様（要点）
- 土をタップで採掘（固定の `DIG_COST=1` 消費）。開始栄養は `START_NUT=25`。色付きの鉱脈を掘ると対応する魔物が1体出て、跡は通路になる。
- 鉱脈は隣接した魔物の接触回数が `touchNeed` に達すると上位鉱脈になる。後半の強い鉱脈ほど必要接触数が多い。上位鉱脈を掘ると上位種が1体出る。
- 自然湧き・盤面養分・個体進化はない。栄養は採掘用のグローバル資源で、時間経過と勇者撃破報酬で増える。
- 下位種は遅めに直接増殖する。上位種は直接増殖せず、同種上位2体が接触している時に低確率で卵を作り、卵は時間経過で孵化する。
- 魔物は自分より序列（`rank`）が低い隣接魔物を一定確率で捕食する。序列差が大きいほど捕食されやすく、捕食した個体はHPを回復する。
- 魔物は発生地点をホームとして持ち、遠くへ行きすぎると戻りやすい。掘った場所が防衛線になる。
- 遠距離攻撃（魔法使い・毒吐き・タランチュラ）は敵味方とも壁を貫通しない（`hasLOS`）。
- 勇者は最下層のコアへ経路探索し、塞がれると壁を掘り、コアマス上でのみコアを攻撃する。コアHPが0で敗北。次の勇者／襲来までの残り時間は入口の上に表示。
