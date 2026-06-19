extends "res://addons/gut/test.gd"

var state: GameState
var rules: GameRules

func before_each() -> void:
	state = GameState.new()
	state.reset(1)
	rules = GameRules.new(state)

func carve_all() -> void:
	for r in range(GameState.ROWS):
		for c in range(GameState.COLS):
			state.grid[r][c] = {"t": "tunnel", "sub": null, "shade": 0.0}
	state.grid[0][GameState.ENTRANCE_COL].t = "surface"
	state.grid[GameState.CORE_ROW][GameState.CORE_COL].t = "core"

func make_hero(cls: String, col: int, row: int, extra := {}) -> Dictionary:
	var c: Dictionary = GameState.HERO_CLASSES[cls]
	var h := {
		"id": 1000 + state.heroes.size(), "cls": cls, "col": col, "row": row,
		"px": state.cx(col), "py": state.cy(row), "face_dir": "s",
		"hp": 60, "max_hp": 100, "atk": 10, "range": c.range, "wave": 5,
		"move_cd": roundi(720 * c.move_mul), "atk_cd": 0.0, "core_cd": 0.0,
		"act_cd": 999999.0, "heal_cd": 999999.0, "blocked_ms": 0.0,
		"action_type": "idle", "action_time": 0.0, "move_anim": 0.0
	}
	for key in extra.keys():
		h[key] = extra[key]
	return h

func test_initial_board_shape() -> void:
	assert_eq(state.grid.size(), GameState.ROWS)
	assert_eq(state.grid[0].size(), GameState.COLS)
	assert_eq(state.grid[0][GameState.ENTRANCE_COL].t, "surface")
	assert_eq(state.grid[GameState.CORE_ROW][GameState.CORE_COL].t, "core")
	assert_eq(state.nutrients, float(GameState.START_NUT))

func test_hud_uses_embedded_japanese_font() -> void:
	var hud := HudView.new()
	add_child_autofree(hud)
	hud.setup(state)
	assert_not_null(hud.ui_font)
	assert_eq(hud.core_label.get_theme_font("font"), hud.ui_font)
	assert_eq(hud.core_label.text, "魔王コア 150/150")
	state.game_state = "dead"
	hud.update_view()
	assert_false(hud.start_panel.visible)
	assert_true(hud.dead_panel.visible)

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

func test_vein_evolves_only_by_monster_touch() -> void:
	carve_all()
	var c := 5
	var r := 5
	state.grid[r][c] = {"t": "earth", "sub": "moss", "shade": 0.0, "evo": false, "evo_touch": 0, "evo_touching": {}}
	for p in [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]:
		state.grid[p[1]][p[0]].t = "tunnel"
	rules.update(100.0)
	assert_false(state.grid[r][c].evo)
	assert_eq(state.grid[r][c].evo_touch, 0)
	for p in [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]:
		rules.spawn_monster("slime", p[0], p[1])
	rules.update(100.0)
	assert_true(state.grid[r][c].evo)
	assert_gte(state.grid[r][c].evo_touch, GameState.VEIN.moss.touch_need)

func test_later_veins_need_more_touch_to_evolve() -> void:
	assert_lt(GameState.VEIN.moss.touch_need, GameState.VEIN.meat.touch_need)
	assert_lt(GameState.VEIN.meat.touch_need, GameState.VEIN.venom.touch_need)
	assert_lt(GameState.VEIN.venom.touch_need, GameState.VEIN.stone.touch_need)
	assert_lt(GameState.VEIN.stone.touch_need, GameState.VEIN.ember.touch_need)

func test_no_monster_spawns_without_digging() -> void:
	for i in range(70):
		rules.update(1000.0)
	assert_eq(state.monsters.size(), 0)

func test_lower_monster_breeds_directly() -> void:
	carve_all()
	rules.spawn_monster("slime", 5, 5)
	state.monsters[0].breed_cd = 0.0
	rules.update(100.0)
	assert_eq(state.monsters.size(), 2)
	assert_true(state.monsters.all(func(m): return m.kind == "slime"))

func test_elite_monster_does_not_breed_directly() -> void:
	carve_all()
	rules.spawn_monster("superslime", 5, 5)
	state.monsters[0].breed_cd = 0.0
	rules.update(1000.0)
	assert_eq(state.monsters.size(), 1)
	assert_eq(state.eggs.size(), 0)

func test_adjacent_elites_can_create_eggs() -> void:
	carve_all()
	rules.spawn_monster("superslime", 5, 5)
	rules.spawn_monster("superslime", 6, 5)
	for i in range(40):
		state.monsters[0].egg_cd = 0.0
		state.monsters[1].egg_cd = 0.0
		rules.update(GameState.EGG_CHECK)
		if state.eggs.size() > 0:
			break
	assert_eq(state.eggs.size(), 1)
	assert_eq(state.eggs[0].kind, "superslime")

func test_egg_hatches_into_same_elite_kind() -> void:
	carve_all()
	assert_true(rules.spawn_egg("superslime", 5, 5))
	rules.update(GameState.EGG_HATCH)
	assert_eq(state.eggs.size(), 0)
	assert_true(state.monsters.any(func(m): return m.kind == "superslime"))

func test_egg_is_not_hero_attack_target() -> void:
	carve_all()
	assert_true(rules.spawn_egg("superslime", 5, 5))
	state.heroes.append(make_hero("warrior", 5, 6, {"atk_cd": 0.0}))
	rules.update(500.0)
	assert_eq(state.eggs.size(), 1)

func test_priest_heals_with_heal_action() -> void:
	carve_all()
	var priest := make_hero("priest", 5, 5, {"heal_cd": 0.0})
	var warrior := make_hero("warrior", 6, 5, {"hp": 20, "max_hp": 80})
	state.heroes.append(priest)
	state.heroes.append(warrior)
	rules.update(100.0)
	assert_eq(priest.action_type, "heal")
	assert_eq(priest.face_dir, "e")
	assert_gt(warrior.hp, 20)

func test_higher_rank_monster_eats_lower_rank_and_heals() -> void:
	carve_all()
	rules.spawn_monster("carniv", 5, 5)
	var eater: Dictionary = state.monsters[0]
	eater.hp = 10
	rules.spawn_monster("slime", 5, 6)
	for i in range(80):
		eater.eat_cd = 0.0
		rules.update(100.0)
		if state.monsters.size() == 1:
			break
	assert_eq(state.monsters.size(), 1)
	assert_gt(eater.hp, 10)
	assert_eq(eater.action_type, "eat")
	assert_true(state.effects.any(func(e): return e.type == "bite"))

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

func test_ranged_attack_is_blocked_by_wall_los() -> void:
	carve_all()
	rules.spawn_monster("spitter", 2, 5)
	state.heroes.append(make_hero("warrior", 4, 5, {"hp": 60, "atk_cd": 999999.0}))
	state.grid[5][3].t = "earth"
	state.monsters[0].atk_cd = 0.0
	rules.update(100.0)
	assert_eq(state.heroes[0].hp, 60)

func test_melee_attack_does_not_hit_non_adjacent_target() -> void:
	carve_all()
	rules.spawn_monster("slime", 2, 5)
	state.heroes.append(make_hero("warrior", 4, 5, {"hp": 60, "atk_cd": 999999.0}))
	state.monsters[0].atk_cd = 0.0
	rules.update(100.0)
	assert_eq(state.heroes[0].hp, 60)

func test_entities_do_not_attack_targets_that_are_still_moving() -> void:
	carve_all()
	rules.spawn_monster("slime", 5, 5)
	var hero := make_hero("warrior", 5, 6, {"hp": 60, "move_anim": GameState.MOVE_ANIM, "move_max": GameState.MOVE_ANIM, "move_from_x": state.cx(5), "move_from_y": state.cy(7), "move_to_x": state.cx(5), "move_to_y": state.cy(6)})
	state.heroes.append(hero)
	state.monsters[0].atk_cd = 0.0
	rules.update(100.0)
	assert_eq(hero.hp, 60)

func test_hero_keeps_moving_when_adjacent_monster_is_not_attackable() -> void:
	carve_all()
	rules.spawn_monster("slime", GameState.CORE_COL + 1, GameState.CORE_ROW - 3)
	state.monsters[0].move_anim = GameState.MOVE_ANIM
	state.monsters[0].move_max = GameState.MOVE_ANIM
	state.monsters[0].move_from_x = state.cx(GameState.CORE_COL + 2)
	state.monsters[0].move_from_y = state.cy(GameState.CORE_ROW - 3)
	state.monsters[0].move_to_x = state.cx(GameState.CORE_COL + 1)
	state.monsters[0].move_to_y = state.cy(GameState.CORE_ROW - 3)
	var hero := make_hero("warrior", GameState.CORE_COL, GameState.CORE_ROW - 3, {"act_cd": 0.0})
	state.heroes.append(hero)
	rules.update(100.0)
	assert_eq(hero.col, GameState.CORE_COL)
	assert_eq(hero.row, GameState.CORE_ROW - 2)
	assert_gt(hero.move_anim, 0.0)

func test_hero_attacks_once_and_does_not_move_in_same_tick() -> void:
	carve_all()
	rules.spawn_monster("slime", 5, 6)
	var hero := make_hero("warrior", 5, 5, {"atk": 1, "atk_cd": 0.0, "act_cd": 0.0})
	state.heroes.append(hero)
	rules.update(100.0)
	assert_eq(hero.col, 5)
	assert_eq(hero.row, 5)
	assert_eq(state.monsters[0].hp, GameState.KINDS.slime.hp - 1)

func test_hero_can_continue_to_core_when_no_adjacent_monster() -> void:
	carve_all()
	var hero := make_hero("warrior", GameState.CORE_COL, GameState.CORE_ROW - 3, {"act_cd": 0.0})
	state.heroes.append(hero)
	rules.update(100.0)
	assert_eq(hero.col, GameState.CORE_COL)
	assert_eq(hero.row, GameState.CORE_ROW - 2)
	assert_gt(hero.move_anim, 0.0)

func test_hero_reaches_and_attacks_core_on_open_path() -> void:
	carve_all()
	var hero := make_hero("warrior", GameState.CORE_COL, 1, {"act_cd": 0.0, "atk": 7, "core_cd": 0.0})
	state.heroes.append(hero)
	var before := state.core_hp
	for i in range(80):
		rules.update(250.0)
		if state.core_hp < before:
			break
	assert_eq(hero.col, GameState.CORE_COL)
	assert_eq(hero.row, GameState.CORE_ROW)
	assert_lt(state.core_hp, before)

func test_monster_does_not_move_into_occupied_hero_tile() -> void:
	carve_all()
	rules.spawn_monster("slime", 5, 5)
	var hero := make_hero("warrior", 5, 6, {"act_cd": 999999.0, "atk_cd": 999999.0})
	state.heroes.append(hero)
	state.monsters[0].move_cd = 0.0
	rules.update(100.0)
	assert_false(state.monsters[0].col == hero.col and state.monsters[0].row == hero.row)

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

func test_hero_class_unlock_rules() -> void:
	state.wave = 1
	for i in range(20):
		state.heroes.clear()
		rules.spawn_hero()
		assert_eq(state.heroes[0].cls, "warrior")
	state.wave = 10
	var seen := {}
	for i in range(80):
		state.heroes.clear()
		rules.spawn_hero()
		seen[state.heroes[0].cls] = true
	for cls in seen.keys():
		assert_lte(GameState.HERO_CLASSES[cls].unlock, 10)
	assert_gte(seen.keys().size(), 3)

func test_hero_attacks_core_only_on_core_tile() -> void:
	carve_all()
	var hero := make_hero("warrior", GameState.CORE_COL, GameState.CORE_ROW, {"atk": 11, "core_cd": 0.0})
	state.heroes.append(hero)
	var before := state.core_hp
	rules.update(100.0)
	assert_eq(state.core_hp, before - 11)
	assert_true(state.effects.any(func(e): return e.type == "corehit"))

func test_wave_spawn_queue_respects_max_heroes() -> void:
	for i in range(GameState.MAX_HEROES):
		state.heroes.append(make_hero("warrior", 1 + i % 9, 1 + int(floor(float(i) / 9.0))))
	rules.start_wave()
	assert_gt(state.spawn_queue.size(), 0)
	for i in range(20):
		rules.update(GameState.HERO_STAGGER)
	assert_eq(state.heroes.size(), GameState.MAX_HEROES)

func test_hero_kill_reward_is_four_plus_wave() -> void:
	var hero := make_hero("warrior", 5, 5, {"hp": 1, "max_hp": 1, "wave": 5})
	state.heroes.append(hero)
	var before := state.nutrients
	rules.kill_hero(hero)
	assert_eq(state.nutrients, before + 9)

func test_long_simulation_does_not_exceed_caps() -> void:
	state.game_state = "playing"
	for i in 360:
		rules.update(1000.0)
	assert_lte(state.monsters.size() + state.eggs.size(), GameState.MONSTER_CAP)
	assert_lte(state.heroes.size(), GameState.MAX_HEROES)
