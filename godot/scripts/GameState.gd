class_name GameState
extends RefCounted

const COLS := 11
const ROWS := 16
const TILE := 48
const W := COLS * TILE
const H := ROWS * TILE
const ENTRANCE_COL := 5
const CORE_COL := 5
const CORE_ROW := ROWS - 2

const DIG_COST := 1
const START_NUT := 25
const CORE_MAX := 150
const MONSTER_CAP := 48
const BREED_LIMIT := 3
const MAX_HEROES := 8
const WAVE_INTERVAL := 29000.0
const FIRST_GRACE := 27000.0
const HERO_STAGGER := 2200.0
const VEIN_CAP := 44
const EGG_HATCH := 40000.0
const EGG_CHECK := 10000.0
const EGG_CHANCE := 0.20
const EGG_KIND_CAP := 2
const EAT_CHECK := 2600.0
const EAT_CHANCE_STEP := 0.09
const EFFECT_CAP := 90
const ATK_ANIM := 190.0
const MOVE_ANIM := 220.0
const DIG_BREAK := 140.0
const DIG_CD := 780.0
const BORN_ANIM := 320.0

const OPEN := {"tunnel": true, "core": true, "surface": true}

const KINDS := {
	"slime": {"hp": 10, "atk": 2, "range": 1, "move_cd": 560.0, "atk_cd": 720.0, "aggro": 1, "rank": 1, "breed_every": 14000.0, "breed_cap": 3, "color": Color("#7fbaff")},
	"carniv": {"hp": 26, "atk": 5, "range": 1, "move_cd": 590.0, "atk_cd": 680.0, "aggro": 5, "rank": 3, "breed_every": 36000.0, "breed_cap": 2, "color": Color("#e06b3a")},
	"spitter": {"hp": 16, "atk": 6, "range": 2, "move_cd": 590.0, "atk_cd": 980.0, "aggro": 3, "rank": 2, "breed_every": 43000.0, "breed_cap": 2, "color": Color("#a64dff")},
	"golem": {"hp": 95, "atk": 4, "range": 1, "move_cd": 1100.0, "atk_cd": 1050.0, "aggro": 4, "rank": 4, "breed_every": 0.0, "breed_cap": 1, "color": Color("#6f86c4")},
	"flame": {"hp": 64, "atk": 15, "range": 1, "move_cd": 590.0, "atk_cd": 780.0, "aggro": 5, "rank": 5, "breed_every": 0.0, "breed_cap": 1, "color": Color("#ff8a3a")},
	"superslime": {"hp": 52, "atk": 7, "range": 1, "move_cd": 520.0, "atk_cd": 680.0, "aggro": 1, "rank": 2, "breed_every": 0.0, "breed_cap": 2, "color": Color("#e84a4a"), "name": "スーパースライム"},
	"evolved": {"hp": 90, "atk": 16, "range": 1, "move_cd": 620.0, "atk_cd": 660.0, "aggro": 5, "rank": 6, "breed_every": 0.0, "breed_cap": 1, "color": Color("#9b2f4f"), "name": "進化肉食魔物"},
	"tarantula": {"hp": 62, "atk": 15, "range": 2, "move_cd": 560.0, "atk_cd": 880.0, "aggro": 4, "rank": 4, "breed_every": 0.0, "breed_cap": 1, "color": Color("#ff6b5a"), "name": "タランチュラ"},
	"titan": {"hp": 220, "atk": 13, "range": 1, "move_cd": 1080.0, "atk_cd": 1000.0, "aggro": 4, "rank": 7, "breed_every": 0.0, "breed_cap": 1, "color": Color("#d9b27a"), "name": "タイタン"},
	"infernal": {"hp": 150, "atk": 28, "range": 1, "move_cd": 560.0, "atk_cd": 740.0, "aggro": 5, "rank": 7, "breed_every": 0.0, "breed_cap": 1, "color": Color("#5ab0ff"), "name": "インフェルノ"},
}

const VEIN := {
	"moss": {"kind": "slime", "evo_kind": "superslime", "unlock": 1, "color": Color("#6fcf6f"), "core": Color("#bdf7bd"), "legend": "苔脈→スライム", "evo_name": "上位苔脈", "touch_need": 4},
	"meat": {"kind": "carniv", "evo_kind": "evolved", "unlock": 1, "color": Color("#e63a2c"), "core": Color("#ffb39e"), "legend": "肉脈→肉食魔物", "evo_name": "上位肉脈", "touch_need": 7},
	"venom": {"kind": "spitter", "evo_kind": "tarantula", "unlock": 3, "color": Color("#a64dff"), "core": Color("#e0bcff"), "legend": "毒脈→毒吐き", "evo_name": "上位毒脈", "touch_need": 10, "unlock_msg": "新たな鉱脈『毒脈』 ─ 毒吐きが眠る"},
	"stone": {"kind": "golem", "evo_kind": "titan", "unlock": 6, "color": Color("#6f86c4"), "core": Color("#bcd0ff"), "legend": "石脈→岩兵", "evo_name": "上位石脈", "touch_need": 13, "unlock_msg": "新たな鉱脈『石脈』 ─ 岩兵が眠る"},
	"ember": {"kind": "flame", "evo_kind": "infernal", "unlock": 9, "color": Color("#ffae26"), "core": Color("#ffe39a"), "legend": "火脈→炎魔", "evo_name": "上位火脈", "touch_need": 16, "unlock_msg": "新たな鉱脈『火脈』 ─ 炎魔が眠る"},
}

const HERO_CLASSES := {
	"warrior": {"name": "戦士", "hp_mul": 1.0, "atk_mul": 1.0, "range": 1, "move_mul": 1.0, "atk_cd": 650.0, "weight": 3.0, "unlock": 1},
	"tank": {"name": "盾兵", "hp_mul": 2.4, "atk_mul": 0.6, "range": 1, "move_mul": 1.5, "atk_cd": 800.0, "weight": 1.4, "unlock": 3, "msg": "重装の盾兵が現れた ─ 非常に硬い"},
	"mage": {"name": "魔法使い", "hp_mul": 0.55, "atk_mul": 1.5, "range": 3, "move_mul": 1.0, "atk_cd": 900.0, "weight": 1.3, "unlock": 5, "msg": "魔法使いが現れた ─ 遠くから魔物を撃つ"},
	"priest": {"name": "僧侶", "hp_mul": 0.85, "atk_mul": 0.35, "range": 1, "move_mul": 1.0, "atk_cd": 1000.0, "weight": 1.0, "unlock": 7, "heal": true, "heal_cd": 1500.0, "heal_range": 2, "msg": "僧侶が現れた ─ 仲間を癒やす"},
}

const PIXEL_ACTORS := ["slime", "carniv", "evolved", "spitter", "golem", "flame", "superslime", "tarantula", "titan", "infernal", "warrior", "tank", "mage", "priest", "egg_superslime", "egg_evolved", "egg_tarantula", "egg_titan", "egg_infernal"]
const PIXEL_TILES := ["earth", "tunnel", "bedrock", "surface", "core", "moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo"]
const PIXEL_EFFECTS := ["slash", "shot", "bite", "birth", "puff"]
const PIXEL_DIRS := ["e", "se", "s", "sw", "w", "nw", "n", "ne"]
const PIXEL_ACTIONS := ["idle", "attack", "cast", "dig", "heal", "eat"]
const PIXEL_FRAMES := 4

var grid: Array = []
var monsters: Array = []
var heroes: Array = []
var eggs: Array = []
var effects: Array = []
var spawn_queue: Array = []
var unlocked := {}
var rng := RandomNumberGenerator.new()

var nutrients: float = START_NUT
var core_hp := CORE_MAX
var wave := 0
var score := 0
var kills := 0
var wave_countdown := FIRST_GRACE
var idc := 0
var game_state := "title"

func reset(seed_value := 1) -> void:
	rng.seed = seed_value
	grid = []
	monsters = []
	heroes = []
	eggs = []
	effects = []
	spawn_queue = []
	unlocked = {"moss": true, "meat": true}
	nutrients = START_NUT
	core_hp = CORE_MAX
	wave = 0
	score = 0
	kills = 0
	wave_countdown = FIRST_GRACE
	idc = 0
	game_state = "playing"
	build_grid()

func cx(col: int) -> float:
	return col * TILE + TILE / 2.0

func cy(row: int) -> float:
	return row * TILE + TILE / 2.0

func in_bounds(col: int, row: int) -> bool:
	return col >= 0 and row >= 0 and col < COLS and row < ROWS

func cheb(a: Dictionary, b: Dictionary) -> int:
	return max(abs(int(a.col) - int(b.col)), abs(int(a.row) - int(b.row)))

func build_grid() -> void:
	for r in ROWS:
		var row := []
		for c in COLS:
			var t := "earth"
			if c == 0 or c == COLS - 1 or r == ROWS - 1:
				t = "bedrock"
			elif r == 0:
				t = "surface" if c == ENTRANCE_COL else "bedrock"
			row.append({"t": t, "sub": null, "shade": rng.randf()})
		grid.append(row)
	seed_type("moss", 8, 2, 9)
	seed_type("meat", 3, 8, ROWS - 3)
	grid[1][ENTRANCE_COL] = {"t": "tunnel", "sub": null, "shade": 0.0}
	grid[2][ENTRANCE_COL] = {"t": "tunnel", "sub": null, "shade": 0.0}
	grid[CORE_ROW][CORE_COL] = {"t": "core", "sub": null, "shade": 0.0}

func vein_count() -> int:
	var n := 0
	for r in ROWS:
		for c in COLS:
			if grid[r][c].sub != null:
				n += 1
	return n

func seed_type(type: String, n: int, r_min: int, r_max: int) -> void:
	var tries := 0
	while n > 0 and tries < 400 and vein_count() < VEIN_CAP:
		tries += 1
		var c := rng.randi_range(1, COLS - 2)
		var r := rng.randi_range(r_min, r_max)
		if not in_bounds(c, r):
			continue
		var tile: Dictionary = grid[r][c]
		if tile.t != "earth" or tile.sub != null:
			continue
		if c == CORE_COL and r == CORE_ROW:
			continue
		if c == ENTRANCE_COL and r <= 2:
			continue
		tile.sub = type
		tile.evo = false
		tile.evo_touch = 0
		tile.evo_touching = {}
		n -= 1
