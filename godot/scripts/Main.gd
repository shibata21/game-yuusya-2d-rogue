extends Node2D

var state := GameState.new()
var rules: GameRules
var board: BoardView
var actors: ActorView
var hud: HudView

func _ready() -> void:
	get_viewport().canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	state.reset(1)
	state.game_state = "title"
	rules = GameRules.new(state)

	board = BoardView.new()
	board.setup(state)
	add_child(board)

	actors = ActorView.new()
	actors.setup(state)
	add_child(actors)

	hud = HudView.new()
	hud.setup(state)
	hud.start_requested.connect(_on_start)
	hud.restart_requested.connect(_on_restart)
	hud.taunt_requested.connect(_on_taunt)
	add_child(hud)

func _process(delta: float) -> void:
	rules.update(delta * 1000.0)

func _input(event: InputEvent) -> void:
	if state.game_state != "playing":
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var col := floori(event.position.x / GameState.TILE)
		var row := floori(event.position.y / GameState.TILE)
		rules.try_dig(col, row)
	if event is InputEventScreenTouch and event.pressed:
		var col := floori(event.position.x / GameState.TILE)
		var row := floori(event.position.y / GameState.TILE)
		rules.try_dig(col, row)

func _on_start() -> void:
	state.game_state = "playing"

func _on_restart() -> void:
	state.reset(1)

func _on_taunt() -> void:
	if state.game_state == "playing" and state.spawn_queue.is_empty() and state.wave_countdown > 3000.0:
		state.wave_countdown = 250.0

