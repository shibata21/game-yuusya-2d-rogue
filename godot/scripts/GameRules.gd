class_name GameRules
extends RefCounted

var state: GameState

func _init(game_state: GameState) -> void:
	state = game_state

func try_dig(col: int, row: int) -> void:
	if state.game_state != "playing" or not state.in_bounds(col, row):
		return
	var tile: Dictionary = state.grid[row][col]
	if tile.t == "bedrock" or tile.t != "earth":
		return
	var touch := false
	for d in [[1, 0], [-1, 0], [0, 1], [0, -1]]:
		var nc: int = col + d[0]
		var nr: int = row + d[1]
		if state.in_bounds(nc, nr) and GameState.OPEN.has(state.grid[nr][nc].t):
			touch = true
			break
	if not touch or state.nutrients < GameState.DIG_COST:
		return
	state.nutrients -= GameState.DIG_COST
	if tile.sub != null:
		var vein: String = tile.sub
		var rich := bool(tile.get("evo", false))
		var kind: String = GameState.VEIN[vein].evo_kind if rich else GameState.VEIN[vein].kind
		tile.t = "tunnel"
		tile.sub = null
		tile.evo = false
		spawn_monster(kind, col, row)
	else:
		tile.t = "tunnel"
	state.effects.append({"type": "dig", "x": state.cx(col), "y": state.cy(row), "life": 340.0, "max": 340.0})

func spawn_monster(kind: String, col: int, row: int) -> void:
	if state.monsters.size() >= GameState.MONSTER_CAP:
		return
	var k: Dictionary = GameState.KINDS[kind]
	state.idc += 1
	state.monsters.append({
		"id": state.idc, "kind": kind, "col": col, "row": row, "px": state.cx(col), "py": state.cy(row),
		"face_dir": spawn_face_dir(col, row), "home_col": col, "home_row": row,
		"hp": k.hp, "max_hp": k.hp, "atk": k.atk, "range": k.range,
		"move_cd": state.rng.randf_range(0.0, k.move_cd), "atk_cd": 0.0,
		"egg_cd": GameState.EGG_CHECK * state.rng.randf_range(0.7, 1.3),
		"eat_cd": GameState.EAT_CHECK * state.rng.randf_range(0.6, 1.2),
		"breed_cd": k.breed_every * state.rng.randf_range(0.6, 1.2) if k.breed_every > 0.0 else 0.0,
		"breed_left": GameState.BREED_LIMIT if k.breed_every > 0.0 else 0,
		"born_anim": GameState.BORN_ANIM, "action_type": "idle", "action_time": 0.0, "move_anim": 0.0
	})

func spawn_hero() -> void:
	var cls := pick_hero_class()
	var c: Dictionary = GameState.HERO_CLASSES[cls]
	var hp: int = max(12, roundi((26 + state.wave * 8) * c.hp_mul))
	var atk: int = max(1, roundi((4 + state.wave * 1.2) * c.atk_mul))
	state.idc += 1
	state.heroes.append({
		"id": state.idc, "cls": cls, "col": GameState.ENTRANCE_COL, "row": 0,
		"px": state.cx(GameState.ENTRANCE_COL), "py": state.cy(0), "face_dir": "s",
		"hp": hp, "max_hp": hp, "atk": atk, "range": c.range, "wave": state.wave,
		"move_cd": roundi(720 * c.move_mul), "atk_cd": 0.0, "core_cd": 0.0, "act_cd": 300.0,
		"heal_cd": 800.0, "blocked_ms": 0.0, "action_type": "idle", "action_time": 0.0, "move_anim": 0.0
	})

func spawn_egg(kind: String, col: int, row: int) -> bool:
	if state.monsters.size() + state.eggs.size() >= GameState.MONSTER_CAP:
		return false
	if not is_elite(kind) or not state.in_bounds(col, row) or not GameState.OPEN.has(state.grid[row][col].t) or occupied(col, row):
		return false
	state.eggs.append({"kind": kind, "col": col, "row": row, "hatch_cd": GameState.EGG_HATCH, "born_anim": GameState.BORN_ANIM})
	state.effects.append({"type": "birth", "x": state.cx(col), "y": state.cy(row), "life": 380.0, "max": 380.0})
	return true

func update(dt: float) -> void:
	if state.game_state != "playing":
		return
	state.wave_countdown -= dt
	if state.spawn_queue.is_empty() and state.wave_countdown <= 0.0:
		start_wave()
	for i in range(state.spawn_queue.size() - 1, -1, -1):
		state.spawn_queue[i].delay -= dt
		if state.spawn_queue[i].delay <= 0.0:
			if state.heroes.size() < GameState.MAX_HEROES:
				spawn_hero()
				state.spawn_queue.remove_at(i)
			else:
				state.spawn_queue[i].delay = 800.0
	update_vein_touch_evolution()
	update_eggs(dt)
	update_elite_egg_breeding(dt)
	update_lower_breeding(dt)
	state.nutrients += 0.045 * (dt / 1000.0)
	update_monsters(dt)
	update_heroes(dt)
	update_effects(dt)
	if state.core_hp <= 0:
		state.core_hp = 0
		state.game_state = "dead"

func update_lower_breeding(dt: float) -> void:
	for m in state.monsters:
		if is_moving(m):
			continue
		var k: Dictionary = GameState.KINDS[m.kind]
		if k.breed_every <= 0.0 or m.breed_left <= 0:
			continue
		m.breed_cd -= dt
		if m.breed_cd > 0.0:
			continue
		if state.monsters.size() + state.eggs.size() >= GameState.MONSTER_CAP:
			m.breed_cd = k.breed_every * 0.5
			continue
		var local := 0
		for o in state.monsters:
			if o.kind == m.kind and state.cheb(o, m) <= 1:
				local += 1
		if local >= k.breed_cap:
			m.breed_cd = k.breed_every * 0.6
			continue
		var nb := open_free_neighbors(m.col, m.row)
		if nb.is_empty():
			m.breed_cd = k.breed_every * 0.5
			continue
		var d: Dictionary = nb[state.rng.randi_range(0, nb.size() - 1)]
		spawn_monster(m.kind, d.col, d.row)
		m.breed_left -= 1
		m.breed_cd = k.breed_every * state.rng.randf_range(0.9, 1.3)

func update_monsters(dt: float) -> void:
	for m in state.monsters.duplicate():
		if not state.monsters.has(m):
			continue
		var k: Dictionary = GameState.KINDS[m.kind]
		m.atk_cd -= dt
		m.move_cd -= dt
		m.eat_cd -= dt
		update_visual_position(m, dt)
		m.action_time = max(0.0, m.action_time - dt)
		m.born_anim = max(0.0, m.born_anim - dt)
		if is_moving(m):
			continue
		var target: Variant = lowest_hero_in_range(m)
		if target != null:
			if m.atk_cd <= 0.0:
				target.hp -= m.atk
				m.atk_cd = k.atk_cd
				set_action(m, "cast" if m.range >= 2 else "attack", target.px, target.py)
				if target.hp <= 0:
					kill_hero(target)
			continue
		var aggro: Variant = nearest_hero_within(m, k.aggro)
		if aggro == null and m.eat_cd <= 0.0:
			m.eat_cd = GameState.EAT_CHECK * state.rng.randf_range(0.85, 1.25)
			if try_eat_lower(m):
				continue
		if m.move_cd <= 0.0:
			if aggro != null:
				move_entity_toward(m, aggro)
			else:
				wander_home(m)
			m.move_cd = k.move_cd + state.rng.randf_range(-80.0, 120.0)

func update_heroes(dt: float) -> void:
	for h in state.heroes.duplicate():
		if not state.heroes.has(h):
			continue
		var c: Dictionary = GameState.HERO_CLASSES[h.cls]
		h.atk_cd -= dt
		h.act_cd -= dt
		h.core_cd -= dt
		h.heal_cd -= dt
		update_visual_position(h, dt)
		h.action_time = max(0.0, h.action_time - dt)
		if is_moving(h):
			continue
		if c.get("heal", false) and h.heal_cd <= 0.0:
			var heal_target = hero_heal_target(h, c)
			if heal_target != null:
				var amount := roundi(6 + h.wave * 1.5)
				heal_target.hp = min(heal_target.max_hp, heal_target.hp + amount)
				h.heal_cd = c.heal_cd
				set_action(h, "heal", heal_target.px, heal_target.py)
				state.effects.append({"type": "slash", "x": heal_target.px, "y": heal_target.py - 2.0, "life": 220.0, "max": 220.0})
			else:
				h.heal_cd = 300.0
		var target: Variant = lowest_monster_in_range(h)
		if target != null:
			if h.atk_cd <= 0.0:
				target.hp -= h.atk
				h.atk_cd = c.atk_cd
				set_action(h, "cast" if h.range >= 2 else "attack", target.px, target.py)
				if target.hp <= 0:
					kill_monster(target)
			continue
		h.blocked_ms = 0.0
		if h.col == GameState.CORE_COL and h.row == GameState.CORE_ROW:
			if h.core_cd <= 0.0:
				state.core_hp -= h.atk
				h.core_cd = 1100.0
				set_action(h, "attack", state.cx(GameState.CORE_COL), state.cy(GameState.CORE_ROW))
				state.effects.append({"type": "corehit", "x": state.cx(GameState.CORE_COL), "y": state.cy(GameState.CORE_ROW), "life": 260.0, "max": 260.0})
			continue
		if h.act_cd <= 0.0:
			var step: Variant = hero_step(h)
			if step != null:
				if step.tile.t == "earth":
					step.tile.dig = step.tile.get("dig", 0.0) + hero_dig_dmg(h.atk)
					h.act_cd = GameState.DIG_CD
					set_action(h, "dig", state.cx(step.col), state.cy(step.row))
					if step.tile.dig >= GameState.DIG_BREAK:
						step.tile.t = "tunnel"
						step.tile.sub = null
						step.tile.dig = 0.0
				else:
					begin_move(h, step.col, step.row)
					h.act_cd = h.move_cd
			else:
				h.act_cd = 400.0

func start_wave() -> void:
	state.wave += 1
	for key in GameState.VEIN.keys():
		var v: Dictionary = GameState.VEIN[key]
		if v.unlock == state.wave and not state.unlocked.has(key):
			state.unlocked[key] = true
	seed_veins(state.wave)
	var count = min(1 + int(floor(state.wave / 2.0)), 5)
	var room = (GameState.MAX_HEROES + 4) - state.heroes.size() - state.spawn_queue.size()
	count = max(0, min(count, room))
	for i in count:
		state.spawn_queue.append({"delay": i * GameState.HERO_STAGGER})
	state.wave_countdown = GameState.WAVE_INTERVAL

func seed_veins(wv: int) -> void:
	state.seed_type("moss", 3, 2, GameState.ROWS - 3)
	state.seed_type("meat", 1 + (1 if wv >= 5 else 0), 4, GameState.ROWS - 3)
	if wv >= 3:
		state.seed_type("venom", 1 + (1 if wv >= 7 else 0), 3, GameState.ROWS - 3)
	if wv >= 6:
		state.seed_type("stone", 1, 7, GameState.ROWS - 3)
	if wv >= 9:
		state.seed_type("ember", 1, 8, GameState.ROWS - 3)

func open_neighbors(col: int, row: int) -> Array:
	var out := []
	for d in [[1, 0], [-1, 0], [0, 1], [0, -1]]:
		var nc: int = col + d[0]
		var nr: int = row + d[1]
		if state.in_bounds(nc, nr) and GameState.OPEN.has(state.grid[nr][nc].t):
			out.append({"col": nc, "row": nr})
	return out

func open_free_neighbors(col: int, row: int) -> Array:
	var out := []
	for n in open_neighbors(col, row):
		if not occupied(n.col, n.row):
			out.append(n)
	return out

func occupied(col: int, row: int) -> bool:
	for m in state.monsters:
		if m.col == col and m.row == row:
			return true
	for h in state.heroes:
		if h.col == col and h.row == row:
			return true
	for e in state.eggs:
		if e.col == col and e.row == row:
			return true
	return false

func actor_occupied(col: int, row: int) -> bool:
	for m in state.monsters:
		if m.col == col and m.row == row:
			return true
	for h in state.heroes:
		if h.col == col and h.row == row:
			return true
	return false

func spawn_face_dir(col: int, row: int) -> String:
	for d in [[1, 0], [-1, 0], [0, 1], [0, -1]]:
		var nc: int = col + d[0]
		var nr: int = row + d[1]
		if state.in_bounds(nc, nr) and GameState.OPEN.has(state.grid[nr][nc].t):
			return dir_from_delta(d[0], d[1], "s")
	return "s"

func dir_from_delta(dx: float, dy: float, fallback := "s") -> String:
	var sx: float = sign(dx)
	var sy: float = sign(dy)
	if sx > 0 and sy > 0:
		return "se"
	if sx > 0 and sy < 0:
		return "ne"
	if sx < 0 and sy > 0:
		return "sw"
	if sx < 0 and sy < 0:
		return "nw"
	if sx > 0:
		return "e"
	if sx < 0:
		return "w"
	if sy > 0:
		return "s"
	if sy < 0:
		return "n"
	return fallback

func set_action(e: Dictionary, type: String, tx: float, ty: float) -> void:
	e.action_type = type
	e.action_time = GameState.ATK_ANIM
	e.action_max = GameState.ATK_ANIM
	e.face_dir = dir_from_delta(tx - e.px, ty - e.py, e.face_dir)

func begin_move(e: Dictionary, col: int, row: int) -> void:
	if e.col == col and e.row == row:
		return
	e.face_dir = dir_from_delta(col - e.col, row - e.row, e.face_dir)
	e.move_from_x = e.px
	e.move_from_y = e.py
	e.move_to_x = state.cx(col)
	e.move_to_y = state.cy(row)
	e.move_anim = GameState.MOVE_ANIM
	e.move_max = GameState.MOVE_ANIM
	e.col = col
	e.row = row

func update_visual_position(e: Dictionary, dt: float) -> void:
	if e.get("move_anim", 0.0) > 0.0:
		e.move_anim = max(0.0, e.move_anim - dt)
		var p = clamp(1.0 - e.move_anim / e.get("move_max", GameState.MOVE_ANIM), 0.0, 1.0)
		var q = 2.0 * p * p if p < 0.5 else 1.0 - pow(-2.0 * p + 2.0, 2.0) / 2.0
		e.px = lerp(e.move_from_x, e.move_to_x, q)
		e.py = lerp(e.move_from_y, e.move_to_y, q)
	else:
		e.px = state.cx(e.col)
		e.py = state.cy(e.row)

func is_moving(e: Dictionary) -> bool:
	return e.get("move_anim", 0.0) > 0.0

func move_entity_toward(e: Dictionary, t: Dictionary) -> void:
	var nb := open_free_neighbors(e.col, e.row)
	if nb.is_empty():
		return
	var best: Dictionary = nb[0]
	var best_d := state.cheb(best, t)
	for n in nb:
		var d := state.cheb(n, t)
		if d < best_d:
			best = n
			best_d = d
	begin_move(e, best.col, best.row)

func wander_home(m: Dictionary) -> void:
	if state.cheb(m, {"col": m.home_col, "row": m.home_row}) > 3:
		move_entity_toward(m, {"col": m.home_col, "row": m.home_row})
		return
	var nb := open_free_neighbors(m.col, m.row)
	if not nb.is_empty() and state.rng.randf() < 0.82:
		var n: Dictionary = nb[state.rng.randi_range(0, nb.size() - 1)]
		begin_move(m, n.col, n.row)

func has_los(c0: int, r0: int, c1: int, r1: int) -> bool:
	var dx: int = abs(c1 - c0)
	var dy: int = abs(r1 - r0)
	var sx := 1 if c0 < c1 else -1
	var sy := 1 if r0 < r1 else -1
	var err: int = dx - dy
	var c := c0
	var r := r0
	while true:
		if not (c == c0 and r == r0) and not (c == c1 and r == r1):
			if not GameState.OPEN.has(state.grid[r][c].t):
				return false
		if c == c1 and r == r1:
			break
		var e2: int = 2 * err
		var pc := c
		var pr := r
		if e2 > -dy:
			err -= dy
			c += sx
		if e2 < dx:
			err += dx
			r += sy
		if c != pc and r != pr:
			if not state.in_bounds(c, pr) or not state.in_bounds(pc, r):
				return false
			if not GameState.OPEN.has(state.grid[pr][c].t) or not GameState.OPEN.has(state.grid[r][pc].t):
				return false
	return true

func lowest_hero_in_range(m: Dictionary):
	var best = null
	for h in state.heroes:
		if is_moving(h):
			continue
		if state.cheb(h, m) > m.range:
			continue
		if m.range > 1 and not has_los(m.col, m.row, h.col, h.row):
			continue
		if best == null or h.hp < best.hp:
			best = h
	return best

func lowest_monster_in_range(h: Dictionary):
	var best = null
	for m in state.monsters:
		if is_moving(m):
			continue
		if state.cheb(m, h) > h.range:
			continue
		if h.range > 1 and not has_los(h.col, h.row, m.col, m.row):
			continue
		if best == null or m.hp < best.hp:
			best = m
	return best

func nearest_hero_within(m: Dictionary, search_range: int):
	var best = null
	var best_d := 999
	for h in state.heroes:
		if is_moving(h):
			continue
		var d := state.cheb(h, m)
		if d < best_d:
			best = h
			best_d = d
	if best != null and best_d <= search_range:
		return best
	return null

func hero_heal_target(h: Dictionary, c: Dictionary):
	var best = null
	for o in state.heroes:
		if o == h or o.hp >= o.max_hp or state.cheb(o, h) > c.heal_range:
			continue
		if best == null or o.hp < best.hp:
			best = o
	if best == null and h.hp < h.max_hp:
		best = h
	return best

func kill_monster(m: Dictionary) -> void:
	state.monsters.erase(m)
	state.effects.append({"type": "puff", "x": m.px, "y": m.py, "life": 300.0, "max": 300.0})

func kill_hero(h: Dictionary) -> void:
	state.heroes.erase(h)
	var reward := roundi(4 + h.wave)
	state.nutrients += reward
	state.score += 80 * h.wave + 20
	state.kills += 1
	state.effects.append({"type": "puff", "x": h.px, "y": h.py, "life": 340.0, "max": 340.0})

func hero_step(h: Dictionary):
	var n := GameState.COLS * GameState.ROWS
	var dist := []
	var prev := []
	var done := []
	dist.resize(n)
	prev.resize(n)
	done.resize(n)
	for i in n:
		dist[i] = INF
		prev[i] = -1
		done[i] = false
	var s: int = h.row * GameState.COLS + h.col
	var goal := GameState.CORE_ROW * GameState.COLS + GameState.CORE_COL
	dist[s] = 0.0
	while true:
		var u := -1
		var best := INF
		for i in n:
			if not done[i] and dist[i] < best:
				best = dist[i]
				u = i
		if u < 0 or u == goal:
			break
		done[u] = true
		var c := u % GameState.COLS
		var r := int(floor(float(u - c) / float(GameState.COLS)))
		for d in [[0, 1], [1, 0], [-1, 0], [0, -1]]:
			var nc: int = c + d[0]
			var nr: int = r + d[1]
			if not state.in_bounds(nc, nr):
				continue
			var t: String = state.grid[nr][nc].t
			if t == "bedrock":
				continue
			if GameState.OPEN.has(t) and not (nc == GameState.CORE_COL and nr == GameState.CORE_ROW) and occupied(nc, nr):
				continue
			var ni := nr * GameState.COLS + nc
			var nd = dist[u] + (10.0 if t == "earth" else 1.0)
			if nd < dist[ni]:
				dist[ni] = nd
				prev[ni] = u
	if is_inf(dist[goal]):
		return null
	var cur := goal
	var step := goal
	while prev[cur] != -1:
		step = cur
		cur = prev[cur]
	if cur != s:
		return null
	var col := step % GameState.COLS
	var row := int(floor(float(step - col) / float(GameState.COLS)))
	return {"col": col, "row": row, "tile": state.grid[row][col]}

func update_vein_touch_evolution() -> void:
	for r in range(1, GameState.ROWS - 1):
		for c in range(1, GameState.COLS - 1):
			var t: Dictionary = state.grid[r][c]
			if t.t != "earth" or t.sub == null or bool(t.get("evo", false)):
				continue
			var touching := {}
			for m in state.monsters:
				if state.cheb(m, {"col": c, "row": r}) <= 1:
					touching[m.id] = true
					if not t.get("evo_touching", {}).has(m.id):
						t.evo_touch = t.get("evo_touch", 0) + 1
			t.evo_touching = touching
			if t.get("evo_touch", 0) >= GameState.VEIN[t.sub].touch_need:
				t.evo = true
				t.evo_checked = true

func update_eggs(dt: float) -> void:
	for i in range(state.eggs.size() - 1, -1, -1):
		var e: Dictionary = state.eggs[i]
		e.hatch_cd -= dt
		if e.hatch_cd > 0.0:
			continue
		if state.monsters.size() < GameState.MONSTER_CAP and not actor_occupied(e.col, e.row):
			spawn_monster(e.kind, e.col, e.row)
		state.eggs.remove_at(i)

func update_elite_egg_breeding(dt: float) -> void:
	for m in state.monsters:
		if is_elite(m.kind):
			m.egg_cd = m.get("egg_cd", GameState.EGG_CHECK) - dt
	for i in state.monsters.size():
		var a: Dictionary = state.monsters[i]
		if not is_elite(a.kind) or a.egg_cd > 0.0 or egg_count(a.kind) >= GameState.EGG_KIND_CAP:
			continue
		for j in range(i + 1, state.monsters.size()):
			var b: Dictionary = state.monsters[j]
			if b.kind != a.kind or state.cheb(a, b) > 1:
				continue
			a.egg_cd = GameState.EGG_CHECK * state.rng.randf_range(0.9, 1.25)
			b.egg_cd = GameState.EGG_CHECK * state.rng.randf_range(0.9, 1.25)
			if state.rng.randf() < GameState.EGG_CHANCE:
				var spot = egg_spot(a, b)
				if spot != null:
					spawn_egg(a.kind, spot.col, spot.row)
			break

func egg_count(kind: String) -> int:
	var n := 0
	for e in state.eggs:
		if e.kind == kind:
			n += 1
	return n

func egg_spot(a: Dictionary, b: Dictionary):
	var cand := []
	for base in [a, b]:
		for n in open_neighbors(base.col, base.row):
			if not occupied(n.col, n.row):
				cand.append(n)
	if cand.is_empty():
		return null
	return cand[state.rng.randi_range(0, cand.size() - 1)]

func try_eat_lower(m: Dictionary) -> bool:
	var found: Variant = lower_prey_near(m)
	if found == null:
		return false
	var chance = clamp(GameState.EAT_CHANCE_STEP * found.gap, 0.08, 0.55)
	if state.rng.randf() >= chance:
		return false
	var prey: Dictionary = found.prey
	set_action(m, "eat", prey.px, prey.py)
	state.effects.append({"type": "bite", "sx": m.px, "sy": m.py, "tx": prey.px, "ty": prey.py, "life": 260.0, "max": 260.0})
	kill_monster(prey)
	m.hp = min(m.max_hp, m.hp + max(3, roundi(prey.max_hp * 0.18)))
	return true

func lower_prey_near(m: Dictionary):
	var best = null
	var best_gap := 0
	var r := rank_of(m.kind)
	for p in state.monsters:
		if p == m or state.cheb(p, m) > 1:
			continue
		var gap := r - rank_of(p.kind)
		if gap <= 0:
			continue
		if best == null or gap > best_gap or (gap == best_gap and p.hp < best.hp):
			best = p
			best_gap = gap
	if best == null:
		return null
	return {"prey": best, "gap": best_gap}

func rank_of(kind: String) -> int:
	return int(GameState.KINDS[kind].rank)

func is_elite(kind: String) -> bool:
	for key in GameState.VEIN.keys():
		if GameState.VEIN[key].evo_kind == kind:
			return true
	return false

func pick_hero_class() -> String:
	var pool := []
	for key in GameState.HERO_CLASSES.keys():
		var c: Dictionary = GameState.HERO_CLASSES[key]
		if state.wave >= c.unlock:
			for i in roundi(c.weight * 10):
				pool.append(key)
	if pool.is_empty():
		return "warrior"
	return pool[state.rng.randi_range(0, pool.size() - 1)]

func hero_dig_dmg(atk: int) -> float:
	return min(95.0, 30.0 + atk * 1.2)

func update_effects(dt: float) -> void:
	for i in range(state.effects.size() - 1, -1, -1):
		state.effects[i].life -= dt
		if state.effects[i].life <= 0.0:
			state.effects.remove_at(i)
	if state.effects.size() > GameState.EFFECT_CAP:
		state.effects = state.effects.slice(state.effects.size() - GameState.EFFECT_CAP)
