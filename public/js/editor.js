const EditorController = function(app) {

  this.currentScene = null

  /**
   * On select scene
   */
  $(".editor-scene-selector").on("click", (e) => {
    app.socket.getScene($(e.target).attr("scene_id"), (scene) => {
      $("#editor-scene-help").hide()
      $("#editor-scene-editor").show()

      this.currentScene = scene
      this.drawSceneEditor(scene)
    })
  })

  /**
   * On save scene
   */
  $("#editor-scene-save").on("click", (e) => {
    this.saveScene()
  })

  /**
   * On add static row
   */
  $("#editor-scene-add-static").on("click", (e) => {
    $("#editor-scene-static").append(this.getStaticEditorRowHtml({
      universe: "",
      channel: "0",
      value: 0,
    }))
  })

  /**
   * On remove static row
   */
  $("#editor-scene-editor").on("click", ".editor-scene-static-row-remove", (e) => {
    $(e.target).closest(".editor-scene-static-row").remove()
  })

  this.saveScene = () => {
    const scene = this.currentScene
    
    scene.values = []

    scene.values.push(...this.compileStaticScenes())

    app.socket.saveScene(scene)
  }

  /**
   * Read HTML and turn into scene values
   */
  this.compileStaticScenes = () => {
    const values = []

    $("div.editor-scene-static-row").each((i, e) => {
      const channel = $(e).find(".editor-scene-static-channel").val()
      const value = $(e).find(".editor-scene-static-value").val()
      const universe = $(e).find(".editor-scene-static-universe").val()

      values.push({
        type: "static",
        channel,
        value,
        universe
      })
    })

    return values
  }

  this.drawSceneEditor = (scene) => {
    $("#editor-scene-title").text(scene.label)

    $("#editor-scene-static").html(this.getStaticEditorHtml(scene))
    $("#editor-scene-animations").html(this.getAnimationEditorHtml(scene))
  }

  this.getAnimationEditorHtml = (scene) => {
    let animationValuesHtml = ""

    moment.relativeTimeThreshold('ss', 0);

    for(const val of scene.values){
      if(val.type === "animation"){
        
        animationValuesHtml += `
          <div class="card bg-secondary text-white">
            <div class="card-header">
              <h5>${val.label}</h5>
            </div>
            <div class="card-body">
        `

        let count = 0;

        for(const step of val.steps){

          count++

          animationValuesHtml += `<div class="card bg-dark text-white mb-3"><div class="card-header"><h5>Step ${count} (Delay: ${step.delay}ms)</h5></div><div class="card-body">`

          for(const channel of Object.keys(step.channels)){
            animationValuesHtml += `
              <div class="input-group mb-1">
                <div class="input-group-prepend ">
                  <span class="input-group-text">${channel}</span>
                </div>
                <input type="text" class="form-control" value="${step.channels[channel]}"></input>
              </div>
              `
          }

          animationValuesHtml += "</div></div>"
        }

        animationValuesHtml += `
            </div>
          </div>
        `

      }
    }

    return animationValuesHtml
  }

  this.getStaticEditorHtml = (scene) => {
    let staticValuesHtml = ""

    /**
     * Build static
     */
    for(const val of scene.values){
      if(val.type === "static"){
        staticValuesHtml += this.getStaticEditorRowHtml(val)
      }
    }

    return staticValuesHtml
  }

  this.getStaticEditorRowHtml = (val) => {
    return `
          <div class="editor-scene-static-row mb-3 row">
            <div class="col-md-4">
              <input type="text" class="form-control editor-scene-static-universe col-sm-12" value="${val.universe}"></input>
            </div>
            <div class="col-md-4">
              <input type="text" class="form-control editor-scene-static-channel col-sm-12" value="${val.channel}"></input>
            </div>
            <div class="col-md-3">
              <input type="text" class="form-control editor-scene-static-value col-sm-12" value="${val.value}"></input>
            </div>
            <div class="col-md-1">
              <button class="btn btn-danger btn-block editor-scene-static-row-remove"><span aria-hidden="true">&times;</span></button>
            </div>
          </div>`
  }

  return this
}