const EditorController = function(app) {

  this.renderer = new EditorRenderer(app)

  this.currentScene = null

  /**
   * On select scene
   */
  $(".editor-scene-selector").on("click", (e) => {
    app.socket.getScene($(e.target).attr("scene_id"), (scene) => {
      this.currentScene = scene
      this.renderer.drawSceneEditor(this.currentScene)
    })
  })

  /**
   * On save scene
   */
  $("#editor-scene-save").on("click", (e) => {
    this.saveScene()
  })

  /**
   * On delete scene
   */
  $("#editor-scene-delete").on("click", (e) => {
    app.socket.deleteScene(this.currentScene.id, () => {
      window.location.reload(true)
    })
  })

  /**
   * Compile scene and send to server
   */
  this.saveScene = () => {
    const scene = this.currentScene

    scene.values = []

    scene.values.push(...this.compileStaticScenes())
    scene.values.push(...this.compileAnimationScenes())

    app.socket.saveScene(scene, (response) => {
      window.location.reload(true)
    })
  }

  /**
   * Read HTML and turn into scene values
   */
  this.compileAnimationScenes = () => {
    const values = []

    $("#editor-scene-animations").find(".editor-scene-animation").each((i, e) => {
      const animation = {
        type: "animation",
        label: $(e).attr("editor-scene-animation-label"),
        universe: $(e).attr("editor-scene-animation-universe"),
        steps: []
      }

      $(e).find(".editor-scene-animation-step-container").find(".editor-scene-animation-step").each((si, se) => {

        const step = {
          delay: $(se).attr("editor-scene-animation-step-delay"),
          channels: {}
        }

        $(se).find(".editor-scene-animation-step-row").each((svi, sv) => {
          step.channels[$(sv).find(".editor-scene-animation-step-channel").val()] = $(sv).find(".editor-scene-animation-step-channel-value").val()
        })

        animation.steps.push(step)
      })

      values.push(animation)
    })

    return values
  }

  /**
   * Read HTML and turn into scene values
   */
  this.compileStaticScenes = () => {
    const values = []

    $("div.editor-scene-static-row").each((i, e) => {
      const channel = $(e).find(".editor-scene-static-channel").val()
      const value = $(e).find(".editor-scene-static-value").val()
      const universe = $(e).find(".editor-scene-static-universe").find("option:selected").attr("editor-universe")

      values.push({
        type: "static",
        channel,
        value,
        universe
      })
    })

    return values
  }

  this.setScene = (scene) => {
    this.currentScene = scene
    this.renderer.drawSceneEditor(this.currentScene)
  }

  return this
}