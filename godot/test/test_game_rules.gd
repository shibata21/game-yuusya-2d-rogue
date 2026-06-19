extends "res://addons/gut/test.gd"

var state: GameState
var rules: GameRules

func before_each() -> void:
	state = GameState.new()
	state.reset(1)
	rules = GameRules.new(state)

func test_initial_board_shape() -> void:
	assert_eq(state.grid.size(), GameState.ROWS)
	assert_eq(state.grid[0].size(), GameState.COLS)
	assert_eq(state.grid[0][GameState.ENTRANCE_COL].t, "surface")
	assert_eq(state.grid[GameState.CORE_ROW][GameState.CORE_COL].t, "core")
	assert_eq(state.nutrients, float(GameState.START_NUT))

func test_dig_vein_spawns_monster_and_costs_nutrient() -> void:
	state.grid[3][GameState.ENTRANCE_COL] = {"t": "earth", "sub": "moss", "shade": 0.0, "evo": false}
	state.grid[2][GameState.ENTRANCE_COL] = {"t": "tunnel", "sub": null, "shade": 0.0}
	rules.try_dig(GameState.ENTRANCE_COL, 3)
	assert_eq(state.grid[3][GameState.ENTRANCE_COL].t, "tunnel")
	assert_eq(state.monsters.size(), 1)
	assert_eq(state.monsters[0].kind, "slime")
	assert_eq(state.nutrients, float(GameState.START_NUT - GameState.DIG_COST))

func test_evolved_vein_spawns_elite() -> void:
	state.grid[3][GameState.ENTRANCE_COL] = {"t": "earth", "sub": "moss", "shade": 0.0, "evo": true}
	state.grid[2][GameState.ENTRANCE_COL] = {"t": "tunnel", "sub": null, "shade": 0.0}
	rules.try_dig(GameState.ENTRANCE_COL, 3)
	assert_eq(state.monsters.size(), 1)
	assert_eq(state.monsters[0].kind, "superslime")

func test_los_blocks_diagonal_wall_corners() -> void:
	for r in GameState.ROWS:
		for c in GameState.COLS:
			state.grid[r][c] = {"t": "tunnel", "sub": null, "shade": 0.0}
	assert_true(rules.has_los(2, 2, 5, 5))
	state.grid[3][2].t = "earth"
	assert_false(rules.has_los(2, 2, 5, 5))
	state.grid[3][2].t = "tunnel"
	state.grid[2][3].t = "earth"
	assert_false(rules.has_los(2, 2, 5, 5))

func test_hero_wall_dig_is_not_one_hit() -> void:
	for r in GameState.ROWS:
		for c in GameState.COLS:
			state.grid[r][c] = {"t": "bedrock", "sub": null, "shade": 0.0}
	state.grid[0][GameState.ENTRANCE_COL] = {"t": "surface", "sub": null, "shade": 0.0}
	state.grid[1][GameState.ENTRANCE_COL] = {"t": "earth", "sub": null, "shade": 0.0}
	for r in range(2, GameState.CORE_ROW + 1):
		state.grid[r][GameState.ENTRANCE_COL] = {"t": "tunnel", "sub": null, "shade": 0.0}
	state.grid[GameState.CORE_ROW][GameState.CORE_COL] = {"t": "core", "sub": null, "shade": 0.0}
	rules.spawn_hero()
	var hero: Dictionary = state.heroes[0]
	hero.act_cd = 0.0
	rules.update(10.0)
	assert_eq(state.grid[1][GameState.ENTRANCE_COL].t, "earth")
	assert_gt(state.grid[1][GameState.ENTRANCE_COL].dig, 0.0)

func test_long_simulation_does_not_exceed_caps() -> void:
	state.game_state = "playing"
	for i in 360:
		rules.update(1000.0)
	assert_lte(state.monsters.size() + state.eggs.size(), GameState.MONSTER_CAP)
	assert_lte(state.heroes.size(), GameState.MAX_HEROES)
