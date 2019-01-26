const EditorController = function(app) {

	$(".editor-scene-selector").on("click", (e) => {
		app.socket.getScene($(e.target).attr("scene_id"), (scene) => {
			alert(JSON.stringify(scene))
		})
	})

	return this
}