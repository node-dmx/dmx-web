const EditorController = function(app) {

  this.currentScene = null

  $(".editor-scene-selector").on("click", (e) => {
    app.socket.getScene($(e.target).attr("scene_id"), (scene) => {
      console.log(scene)
      this.currentScene = scene
      this.drawSceneEditor(scene)
    })
  })

  $("#editor-scene-save").on("click", (e) => {
    this.saveScene()
  })

  this.saveScene = () => {
    const scene = this.currentScene
    
    scene.values = []

    scene.values.push(...this.compileStaticScenes())

    console.log(scene)
    app.socket.saveScene(scene)
  }

  this.compileStaticScenes = () => {
    const values = []

    $("div.editor-scene-static-row").each((i, e) => {
      const channel = $(e).find(".editor-scene-static-channel").text()
      const value = $(e).find(".editor-scene-static-value").val()
      const universe = $(e).attr("editor-universe")

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
        staticValuesHtml += `
          <div class="input-group editor-scene-static-row" editor-universe="${val.universe}">
            <div class="input-group-prepend">
              <span class="input-group-text editor-scene-static-channel">${val.channel}</span>
            </div>
            <input type="text" class="form-control editor-scene-static-value" value="${val.value}"></input>
          </div>`
      }
    }

    return staticValuesHtml
  }

  return this
}