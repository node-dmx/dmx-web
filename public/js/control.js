const ShowController = function(app) {

  $(".dmx-scene-trigger").on("click", (e) => {
    app.socket.setScene($(e.target).attr("scene_id"))
  })

  this.setActiveScene = (sceneId) => {
  	$(`.dmx-scene-trigger-container .dmx-scene-trigger-control`).removeClass("btn-info").addClass("btn-secondary")
  	$(".dmx-scene-trigger-container").find(`.dmx-scene-trigger-control[scene_id="${sceneId}"]`).addClass("btn-info").removeClass("btn-secondary")
  }

  return this
}