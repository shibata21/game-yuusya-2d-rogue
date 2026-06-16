# AGENTS.md

破壊神ダンジョン — HTML5 地下生態系／防衛ゲーム（日本語UI・モバイル向け）。地中を掘って土壌と養分を露出させ、自然発生する魔物の食物連鎖で最下層の魔王コアを勇者の襲来から守る。

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

# テスト実行（例: "33 passed, 0 failed" のように全通過すること）
node test_hakaishin_dungeon.js hakaishin_dungeon.html
```

機能を追加したら、テストファイルに対応セクションを足し、新しい内部関数・値はテスト先頭の `__GAME__` フックに公開する。

## 規約
- UI文言・コードコメントはすべて日本語。利用者とのやり取りも日本語。
- 外部ランタイム依存なし。`<head>` の Web フォント参照を除き、ローカルファイルだけで動く構成を維持。
- `localStorage` / `sessionStorage` は使わない。
- ファイルが大きいので編集はピンポイントで行う。
- バランス調整はデータ駆動。ロジック内に数値を散らさず、`<script>` 冒頭の定数ブロックと各テーブルの値を変える。
- 版権に注意：実在ゲームの名称・固有表現を入れない（オリジナルを維持）。

## どこに何があるか（`hakaishin_dungeon.js` 内）
- **調整用定数（冒頭）**：`MONSTER_CAP` / `MAX_HEROES` / `WAVE_INTERVAL` / `FIRST_GRACE` / `DIG_COST` / `START_NUT` / `CORE_MAX` / `BASE_NUTRIENT`・`DIG_NUTRIENT`・`CORPSE_NUTRIENT`・`ECO_TICK`・`ECO_SCAN_PER_UPDATE`・`SLIME_EAT_RATE` / `EFFECT_CAP` / `DIG_BREAK`・`DIG_CD` / `EVO_TIME`（土壌の熟成時間）/ `BORN_ANIM`。
- **`KINDS`** — 魔物テーブル（hp/atk/range/breedEvery/breedCap…）。通常種＋進化種（`eliteOf`＝元スプライト, `tint`＝色替えフィルタ）。
- **`SOIL`** — 土壌の種別 → 発生しやすい魔物・色・解禁ウェーブ。
- **`HERO_CLASSES`** — 戦士/盾/魔法/僧侶。勇者のHP・攻撃スケーリングは `spawnHero()`、1ウェーブの人数は `startWave()`。
- **`update(dt)`** — メインループ：ウェーブ発生／土壌の熟成／生態系発生／捕食・魔物AI・戦闘／勇者AI・経路・壁掘り／コアへのダメージ。
- **`draw()`** — Canvas描画。各スプライト関数と `drawEffect`。
- **補助関数**：`tryDig`（採掘）/ `spawnByEcosystem`（土壌・養分による自然発生）/ `addNutrient` / `spawnMonster`・`spawnHero` / `heroStep`（重み付きダイクストラ）/ `hasLOS`（ブレゼンハムの視線判定）/ `openNeighbors` / エフェクト群（`toast`/`popDmg`/`banner`/`slash`/`shoot`）。

## 現在のゲーム仕様（要点）
- 土をタップで採掘（固定の `DIG_COST` 消費）。色付きの土壌を掘ると魔物は即出現せず、通路に土壌影響と養分が残る。
- 土壌は `EVO_TIME` 放置で濃くなり、掘った時に多くの養分を残す。養分・土壌・周囲の魔物密度に応じて `spawnByEcosystem()` が魔物を自然発生させる。
- 食物連鎖：土壌からは基本種だけが自然発生し、上位種は個体進化でのみ出る。スライムは養分、肉食魔物は捕食、毒吐きは戦闘、岩兵は石土周辺での被弾、炎魔は死骸養分で成長する。魔物や勇者の死骸は周囲に養分を戻す。
- 魔物は発生地点をホームとして持ち、遠くへ行きすぎると戻りやすい。掘った場所が防衛線になる。
- 遠距離攻撃（魔法使い・毒吐き・タランチュラ）は敵味方とも壁を貫通しない（`hasLOS`）。
- 勇者は最下層のコアへ経路探索し、塞がれると壁を掘り、コアマス上でのみコアを攻撃する。コアHPが0で敗北。次の勇者／襲来までの残り時間は入口の上に表示。
