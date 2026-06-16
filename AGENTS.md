# AGENTS.md

破壊神ダンジョン — HTML5 地下防衛ゲーム（日本語UI・モバイル向け）。地中を掘って鉱脈から魔物を出し、少数精鋭の魔物と卵繁殖で最下層の魔王コアを勇者の襲来から守る。

## ファイル構成
- `hakaishin_dungeon.html` — ゲーム本体のHTML。CSS / JS を読み込む。ビルド不要、ブラウザで開けば動く。
- `hakaishin_dungeon.css` — 画面レイアウトと見た目。
- `hakaishin_dungeon.js` — ゲームロジックとCanvas描画。
- `test_hakaishin_dungeon.js` — Node 製テスト。HTML からゲーム用 `<script>` を辿り、DOM/Canvas をスタブ化し、`__GAME__` フック経由でロジックを検証する。

## 実行・検証
ビルド工程はなし。プレイは HTML をブラウザで開くだけ。
変更を入れたら、必ず以下2つを実行し「エラー0・全テスト通過」を確認すること：

```bash
# ゲーム側の構文チェック
node --check hakaishin_dungeon.js

# テスト側の構文チェック
node --check test_hakaishin_dungeon.js

# テスト実行（例: "33 passed, 0 failed" のように全通過すること）
node test_hakaishin_dungeon.js hakaishin_dungeon.html
```

機能を追加したら、テストファイルに対応セクションを足し、新しい内部関数・値はテスト先頭の `__GAME__` フックに公開する。
変更を入れて検証が通ったら、ユーザーから別指示がない限り、その変更を毎回 Git commit する。コミット前に `git status --short` で対象ファイルを確認し、関係ない変更を混ぜない。

## 規約
- UI文言・コードコメントはすべて日本語。利用者とのやり取りも日本語。
- 外部ランタイム依存なし。`<head>` の Web フォント参照を除き、ローカルファイルだけで動く構成を維持。
- `localStorage` / `sessionStorage` は使わない。
- ファイルが大きいので編集はピンポイントで行う。
- バランス調整はデータ駆動。ロジック内に数値を散らさず、`<script>` 冒頭の定数ブロックと各テーブルの値を変える。
- 版権に注意：実在ゲームの名称・固有表現を入れない（オリジナルを維持）。

## どこに何があるか（`hakaishin_dungeon.js` 内）
- **調整用定数（冒頭）**：`MONSTER_CAP` / `BREED_LIMIT` / `MAX_HEROES` / `WAVE_INTERVAL` / `FIRST_GRACE` / `HERO_STAGGER` / `DIG_COST` / `START_NUT` / `CORE_MAX` / `VEIN_CAP` / `EGG_HATCH`・`EGG_CHECK`・`EGG_CHANCE`・`EGG_KIND_CAP` / `EAT_CHECK`・`EAT_CHANCE_STEP` / `EFFECT_CAP` / `DIG_BREAK`・`DIG_CD` / `EVO_TIME`（鉱脈の熟成時間）/ `BORN_ANIM`。
- **`KINDS`** — 魔物テーブル（hp/atk/range/rank/breedEvery/breedCap…）。通常種＋上位種（`eliteOf`＝元スプライト, `tint`＝色替えフィルタ）。
- **`VEIN`** — 鉱脈の種別 → `kind`（通常種）・`evoKind`（上位種）・`evoChance`・色・解禁ウェーブ。
- **`HERO_CLASSES`** — 戦士/盾/魔法/僧侶。勇者のHP・攻撃スケーリングは `spawnHero()`、1ウェーブの人数は `startWave()`。
- **`update(dt)`** — メインループ：ウェーブ発生／鉱脈の熟成／下位種増殖／卵の孵化／上位種の卵繁殖／捕食・魔物AI・戦闘／勇者AI・経路・壁掘り／コアへのダメージ。
- **`draw()`** — Canvas描画。各スプライト関数と `drawEffect`。
- **補助関数**：`tryDig`（採掘）/ `spawnMonster`・`spawnHero`・`spawnEgg` / `updateEggs` / `updateEliteEggBreeding` / `tryEatLower` / `heroStep`（重み付きダイクストラ）/ `hasLOS`（ブレゼンハムの視線判定）/ `openNeighbors` / エフェクト群（`toast`/`popDmg`/`banner`/`slash`/`shoot`）。

## 現在のゲーム仕様（要点）
- 土をタップで採掘（固定の `DIG_COST=1` 消費）。開始栄養は `START_NUT=25`。色付きの鉱脈を掘ると対応する魔物が1体出て、跡は通路になる。
- 鉱脈は `EVO_TIME` 放置で熟成判定され、低確率で上位鉱脈になる。上位鉱脈を掘ると上位種が1体出る。
- 自然湧き・盤面養分・個体進化はない。栄養は採掘用のグローバル資源で、時間経過と勇者撃破報酬で増える。
- 下位種は遅めに直接増殖する。上位種は直接増殖せず、同種上位2体が接触している時に低確率で卵を作り、卵は時間経過で孵化する。
- 魔物は自分より序列（`rank`）が低い隣接魔物を一定確率で捕食する。序列差が大きいほど捕食されやすく、捕食した個体はHPを回復する。
- 魔物は発生地点をホームとして持ち、遠くへ行きすぎると戻りやすい。掘った場所が防衛線になる。
- 遠距離攻撃（魔法使い・毒吐き・タランチュラ）は敵味方とも壁を貫通しない（`hasLOS`）。
- 勇者は最下層のコアへ経路探索し、塞がれると壁を掘り、コアマス上でのみコアを攻撃する。コアHPが0で敗北。次の勇者／襲来までの残り時間は入口の上に表示。
