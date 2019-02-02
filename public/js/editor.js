const EditorController = function(app) {

  this.currentScene = null

  /**
   * On select scene
   */
  $(".editor-scene-selector").on("click", (e) => {
    app.socket.getScene($(e.target).attr("scene_id"), (scene) => {
      $("#editor-scene-help").hide()
      $("#editor-scene-editor").show()

      console.log(scene)

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
    $("#editor-scene-static").append(this.generateStaticEditorRowHtml({
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

  /**
   * On add animation row
   */
  $("#editor-scene-add-animation").on("click", (e) => {
    $("#editor-scene-animations").append(this.generateAnimationEditorRowHtml({
      universe: "",
      label: "New Animation",
      steps: [{
        channels: {
          0: 0
        },
        delay: 1000
      }]
    }))
  })

  /**
   * On add animation value
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-step-add-row", (e) => {
    $(e.target).closest(".editor-scene-animation-step").find(".editor-scene-animation-step-values").append(this.generateAnimationStepRowHtml(0, 0))
  })

  /**
   * On add animation step
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-add-step", (e) => {
    const container = $(e.target).closest(".editor-scene-animation").find(".editor-scene-animation-step-container")
    const count = container.children().length + 1

    container.append(
      this.generateAnimationEditorStepHtml(count, {
        channels: {
          0: 0
        },
        delay: 1000
      }))
  })

  $("#editor-scene-editor").on("click", ".editor-scene-animation-step-row-remove", (e) => {
    $(e.target).closest(".editor-scene-animation-step-row").remove()
  })

  /**
   * Compile scene and send to server
   */
  this.saveScene = () => {
    const scene = this.currentScene

    scene.values = []

    scene.values.push(...this.compileStaticScenes())
    scene.values.push(...this.compileAnimationScenes())

    console.log(scene)

    app.socket.saveScene(scene)
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
          delay: $(se).attr("editor-scene-animation-delay"),
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

    $("#editor-scene-static").html(this.generateStaticEditorHtml(scene))
    $("#editor-scene-animations").html(this.generateAnimationEditorHtml(scene))
  }

  this.generateAnimationEditorHtml = (scene) => {
    let animationValuesHtml = ""

    moment.relativeTimeThreshold('ss', 0);

    for (const val of scene.values) {
      if (val.type === "animation") {

        animationValuesHtml += this.generateAnimationEditorRowHtml(val)

      }
    }

    return animationValuesHtml
  }

  this.generateAnimationEditorRowHtml = (val) => {
    let html = ""

    html += `
          <div class="card bg-secondary text-white editor-scene-animation" editor-scene-animation-label="${val.label}" editor-scene-animation-universe="${val.universe}">
            <div class="card-header">
              <h5>${val.label}</h5>
            </div>
            <div class="card-body">
              <div class="editor-scene-animation-step-container">
        `

    let count = 0;

    for (const step of val.steps) {

      count++

      html += this.generateAnimationEditorStepHtml(count, step)
    }

    html += `
              </div>
            <button class="btn btn-dark btn-block editor-scene-animation-add-step">Add Step</button>
            </div>
          </div>
          <br>
        `

    return html
  }

  this.generateAnimationEditorStepHtml = (count, step) => {
    let html = ""

    html += `
        <div class="card bg-dark text-white mb-3">
          <div class="card-header">
            <h5>Step ${count} (Delay: ${step.delay}ms)</h5>
          </div>
          <div class="card-body editor-scene-animation-step" editor-scene-animation-delay="${step.delay}">

          <div class="mb-3 row">
            <div class="col-md-6">
              Channel
            </div>
            <div class="col-md-53">
              Value
            </div>
            <div class="col-md-1"></div>
          </div>

          <div class="mb-3 editor-scene-animation-step-values">
      `

    for (const channel of Object.keys(step.channels)) {
      html += this.generateAnimationStepRowHtml(channel, step.channels[channel])
    }

    html += `
          </div>

          <button class="btn btn-secondary btn-block editor-scene-animation-step-add-row">Add Value</button>

        </div>
      </div>
      `

    return html
  }

  this.generateAnimationStepRowHtml = (channel, value) => {
    return `
          <div class="editor-scene-animation-step-row mb-3 row">
            <div class="col-md-6">
              <input type="text" class="form-control editor-scene-animation-step-channel col-sm-12" value="${channel}"></input>
            </div>
            <div class="col-md-5">
              <input type="text" class="form-control editor-scene-animation-step-channel-value col-sm-12" value="${value}"></input>
            </div>
            <div class="col-md-1">
              <button class="btn btn-danger btn-block editor-scene-animation-step-row-remove"><span aria-hidden="true">&times;</span></button>
            </div>
          </div>`
  }

  this.generateStaticEditorHtml = (scene) => {
    let staticValuesHtml = ""

    /**
     * Build static
     */
    for (const val of scene.values) {
      if (val.type === "static") {
        staticValuesHtml += this.generateStaticEditorRowHtml(val)
      }
    }

    return staticValuesHtml
  }

  this.generateStaticEditorRowHtml = (val) => {
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