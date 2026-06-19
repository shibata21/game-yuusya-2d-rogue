class_name ActorView
extends Node2D

var state: GameState
var actors_texture: Texture2D
var effects_texture: Texture2D

func setup(game_state: GameState) -> void:
	state = game_state
	actors_texture = load("res://assets/pixel/actors.png")
	effects_texture = load("res://assets/pixel/effects.png")
	queue_redraw()

func _process(_delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	if state == null:
		return
	for e in state.eggs:
		draw_actor("egg_" + String(e.kind), "idle", "s", frame_for_id(e.col + e.row), Vector2(state.cx(e.col), state.cy(e.row) + 8), 0.75)
	var ents := []
	for m in state.monsters:
		ents.append({"z": m.row, "hero": false, "e": m})
	for h in state.heroes:
		ents.append({"z": h.row + 0.5, "hero": true, "e": h})
	ents.sort_custom(func(a, b): return a.z < b.z)
	for o in ents:
		var ent: Dictionary = o.e
		var name: String = ent.cls if o.hero else ent.kind
		draw_actor(name, actor_action(ent), ent.get("face_dir", "s"), frame_for_id(ent.id), Vector2(ent.px, ent.py), 0.75 if o.hero else 0.5)
	for f in state.effects:
		draw_effect(f)

func actor_action(e: Dictionary) -> String:
	var a := String(e.get("action_type", "idle")) if e.get("action_time", 0.0) > 0.0 else "idle"
	return a if GameState.PIXEL_ACTIONS.has(a) else "idle"

func frame_for_id(id_value: int) -> int:
	return int(Time.get_ticks_msec() / 140 + id_value) % GameState.PIXEL_FRAMES

func draw_actor(name: String, action: String, dir: String, frame: int, pos: Vector2, anchor_y: float) -> void:
	if actors_texture == null:
		draw_circle(pos, 10.0, Color.WHITE)
		return
	var row := GameState.PIXEL_ACTORS.find(name)
	var ai := GameState.PIXEL_ACTIONS.find(action)
	var di := GameState.PIXEL_DIRS.find(dir)
	if row < 0:
		return
	ai = max(ai, 0)
	di = max(di, GameState.PIXEL_DIRS.find("s"))
	var x := ((ai * GameState.PIXEL_DIRS.size() + di) * GameState.PIXEL_FRAMES + frame) * GameState.TILE
	var src := Rect2(x, row * GameState.TILE, GameState.TILE, GameState.TILE)
	var dst := Rect2(pos.x - GameState.TILE / 2.0, pos.y - GameState.TILE * anchor_y, GameState.TILE, GameState.TILE)
	draw_texture_rect_region(actors_texture, dst, src)

func draw_effect(f: Dictionary) -> void:
	var name := String(f.type)
	var row := GameState.PIXEL_EFFECTS.find(name)
	if effects_texture == null or row < 0:
		return
	var p = clamp(1.0 - f.life / f.max, 0.0, 1.0)
	var frame := clampi(floori(p * GameState.PIXEL_FRAMES), 0, GameState.PIXEL_FRAMES - 1)
	var src := Rect2(frame * GameState.TILE, row * GameState.TILE, GameState.TILE, GameState.TILE)
	var dst := Rect2(float(f.get("x", 0.0)) - GameState.TILE / 2.0, float(f.get("y", 0.0)) - GameState.TILE / 2.0, GameState.TILE, GameState.TILE)
	draw_texture_rect_region(effects_texture, dst, src)
