const ShowController = function(app) {

	$(".dmx-scene-trigger").on("click", (e) => {
		app.socket.setScene($(e.target).attr("scene_id"))

		console.log("dsfsfd")
	})

	return this
}