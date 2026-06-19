class_name BoardView
extends Node2D

var state: GameState
var tiles_texture: Texture2D

func setup(game_state: GameState) -> void:
	state = game_state
	tiles_texture = load("res://assets/pixel/tiles.png")
	queue_redraw()

func _process(_delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	if state == null:
		return
	for r in GameState.ROWS:
		for c in GameState.COLS:
			var tile: Dictionary = state.grid[r][c]
			var key := tile_key(tile)
			var idx := GameState.PIXEL_TILES.find(key)
			var dst := Rect2(c * GameState.TILE, r * GameState.TILE, GameState.TILE, GameState.TILE)
			if tiles_texture != null and idx >= 0:
				var src := Rect2(idx * GameState.TILE, 0, GameState.TILE, GameState.TILE)
				draw_texture_rect_region(tiles_texture, dst, src)
			else:
				draw_rect(dst, fallback_color(key))
			if tile.get("dig", 0.0) > 0.0:
				var p = clamp(tile.dig / GameState.DIG_BREAK, 0.0, 1.0)
				draw_rect(dst.grow(-6), Color(1.0, 0.85, 0.45, 0.22 + p * 0.25), false, 3.0)

func tile_key(tile: Dictionary) -> String:
	if tile.t == "earth" and tile.sub != null:
		return String(tile.sub) + ("_evo" if bool(tile.get("evo", false)) else "")
	return String(tile.t)

func fallback_color(key: String) -> Color:
	match key:
		"tunnel":
			return Color("#241a2b")
		"bedrock":
			return Color("#15101c")
		"surface":
			return Color("#2e2440")
		"core":
			return Color("#61318f")
		_:
			return Color("#5c3d24")

