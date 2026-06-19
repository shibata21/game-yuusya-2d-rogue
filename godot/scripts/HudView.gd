class_name HudView
extends Control

signal start_requested
signal taunt_requested
signal restart_requested

var state: GameState
var core_label: Label
var nut_label: Label
var wave_label: Label
var mon_label: Label
var score_label: Label
var timer_label: Label
var start_panel: PanelContainer
var dead_panel: PanelContainer
var ui_font: Font

func setup(game_state: GameState) -> void:
	state = game_state
	ui_font = load("res://assets/fonts/NotoSansCJK-Regular.ttc")
	anchor_left = 0
	anchor_top = 0
	anchor_right = 0
	anchor_bottom = 0
	size = Vector2(GameState.W, GameState.H)
	mouse_filter = Control.MOUSE_FILTER_PASS
	build_ui()
	update_view()

func build_ui() -> void:
	var top := HBoxContainer.new()
	top.position = Vector2(8, 8)
	top.size = Vector2(GameState.W - 16, 38)
	add_child(top)
	core_label = make_label()
	nut_label = make_label()
	wave_label = make_label()
	mon_label = make_label()
	score_label = make_label()
	core_label.custom_minimum_size.x = 138
	for label in [core_label, nut_label, wave_label, mon_label, score_label]:
		top.add_child(label)

	timer_label = make_label()
	timer_label.position = Vector2(12, GameState.H - 42)
	timer_label.size = Vector2(220, 32)
	add_child(timer_label)

	var taunt := Button.new()
	taunt.text = "すぐ襲来"
	apply_font(taunt, 15)
	taunt.position = Vector2(GameState.W - 128, GameState.H - 48)
	taunt.size = Vector2(116, 36)
	taunt.pressed.connect(func(): taunt_requested.emit())
	add_child(taunt)

	start_panel = make_overlay("地底に君臨せよ", "侵略を開始する", func(): start_requested.emit())
	add_child(start_panel)
	dead_panel = make_overlay("魔王コア、陥落", "再び君臨する", func(): restart_requested.emit())
	dead_panel.visible = false
	add_child(dead_panel)

func make_label() -> Label:
	var label := Label.new()
	apply_font(label, 15)
	label.add_theme_color_override("font_color", Color("#f3e7c0"))
	label.custom_minimum_size = Vector2(82, 28)
	return label

func make_overlay(title: String, button_text: String, callback: Callable) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.position = Vector2(48, 210)
	panel.size = Vector2(GameState.W - 96, 250)
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(box)
	var label := Label.new()
	label.text = title
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	apply_font(label, 28)
	label.add_theme_color_override("font_color", Color("#f3e7c0"))
	box.add_child(label)
	var desc := Label.new()
	desc.text = "土を掘り、鉱脈から魔物を出し、最下層の魔王コアを守れ。"
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	apply_font(desc, 15)
	desc.add_theme_color_override("font_color", Color("#d8c59a"))
	box.add_child(desc)
	var button := Button.new()
	button.text = button_text
	button.custom_minimum_size = Vector2(220, 42)
	apply_font(button, 16)
	button.pressed.connect(callback)
	box.add_child(button)
	return panel

func apply_font(control: Control, font_size: int) -> void:
	if ui_font != null:
		control.add_theme_font_override("font", ui_font)
	control.add_theme_font_size_override("font_size", font_size)

func _process(_delta: float) -> void:
	update_view()

func update_view() -> void:
	if state == null or core_label == null:
		return
	core_label.text = "魔王コア %d/%d" % [state.core_hp, GameState.CORE_MAX]
	nut_label.text = "栄養 %d" % floori(state.nutrients)
	wave_label.text = "波 %d" % state.wave
	mon_label.text = "魔物 %d" % state.monsters.size()
	score_label.text = "点 %d" % state.score
	timer_label.text = "次の襲来 %.1f秒" % max(0.0, state.wave_countdown / 1000.0)
	start_panel.visible = state.game_state == "title"
	dead_panel.visible = state.game_state == "dead"
