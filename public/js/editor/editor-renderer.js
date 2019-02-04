const EditorRenderer = function(app) {


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
      universe: "Universe Here",
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
    const container = $(e.target).closest(".editor-scene-animation").find(".editor-scene-animation-steps-container")
    const count = container.children().length + 1

    container.append(
      this.generateAnimationEditorStepHtml(count, {
        channels: {
          0: 0
        },
        delay: 1000
      }))
  })

  /**
   * On remove animation step row
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-step-row-remove", (e) => {
    $(e.target).closest(".editor-scene-animation-step-row").remove()
  })

  /**
   * On edit animation
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-edit-label", (e) => {
    const container = $(e.target).closest("h5")

    if (container.find(".editor-scene-animation-label-editor").length === 0) {

      $(e.currentTarget).html(`<i class="fas fa-save"></i>`)

      const label = container.closest(".editor-scene-animation").attr("editor-scene-animation-label")
      const universe = container.closest(".editor-scene-animation").attr("editor-scene-animation-universe")

      container.find(".editor-scene-animation-label").html(`Label: <input type="text" class="form-control editor-scene-animation-label-editor" value="${label}"></input>`)
      container.find(".editor-scene-animation-universe").html(`Universe: <input type="text" class="form-control editor-scene-animation-universe-editor" value="${universe}"></input>`)
    } else {
      const newLabel = container.find(".editor-scene-animation-label-editor").val()
      const newUniverse = container.find(".editor-scene-animation-universe-editor").val()

      container.find(".editor-scene-animation-label").text(newLabel)
      container.find(".editor-scene-animation-universe").html(`<span class=" text-secondary badge badge-dark">${newUniverse}</span>`)

      container.closest(".editor-scene-animation")
        .attr("editor-scene-animation-label", newLabel)
        .attr("editor-scene-animation-universe", newUniverse)
    }

  })

  /**
   * On remove animation
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-remove", (e) => {
    $(e.target).closest(".editor-scene-animation").remove()
  })

  /**
   * On remove animation step
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-step-remove", (e) => {
    $(e.target).closest(".editor-scene-animation-step-container").remove()
  })

  /**
   * On edit animation step
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-step-edit", (e) => {
    const stepElem = $(e.target).closest(".editor-scene-animation-step-container").find(".editor-scene-animation-step")
    const delay = stepElem.attr("editor-scene-animation-step-delay")
    const stepCount = stepElem.attr("editor-scene-animation-step-count")

    $("#editor-scene-step-editor-modal").attr("editor-scene-animation-step-count", stepCount)
    $("#editor-scene-step-editor-modal-delay").val(delay)
  })

  /**
   * On save step
   */
  $("#editor-scene-step-editor-modal-save").on("click", (e) => {
    const delay = $("#editor-scene-step-editor-modal-delay").val()
    const count = $("#editor-scene-step-editor-modal").attr("editor-scene-animation-step-count")

    $(`.editor-scene-animation-step[editor-scene-animation-step-count="${count}"]`).attr("editor-scene-animation-step-delay", delay)

    $(`.editor-scene-animation-step[editor-scene-animation-step-count="${count}"]`)
      .closest(".editor-scene-animation-step-container")
      .find(".editor-scene-animation-step-title")
      .text(`Step ${count} (Delay: ${delay}ms)`)
  })

  /**
   * On create new scene
   */
  $("#editor-scene-modal-save").on("click", (e) => {
    if ($("#editor-scene-creator-modal-name").val() === "") return

    const id = app.socket.generateUUID()

    scene = {
      id: id,
      label: $("#editor-scene-creator-modal-name").val(),
      type: "full",
      values: []
    }

    $("#editor-scene-creator-modal-name").val("")
    
    this.editor.setScene(scene)
  })

  this.drawSceneEditor = (scene) => {
    $("#editor-scene-title").text(scene.label)

    $("#editor-scene-static").html(this.generateStaticEditorHtml(scene))
    $("#editor-scene-animations").html(this.generateAnimationEditorHtml(scene))

    $("#editor-scene-help").hide()
    $("#editor-scene-editor").show()
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
              <h5 class="row">
                <div class="col-sm-8">
                  <span class="editor-scene-animation-label">${val.label}</span>
                  <span class="editor-scene-animation-universe">
                    <span class=" text-secondary badge badge-dark">${val.universe}</span>
                  </span>
                </div>
                <div class="col-sm-4 text-right">
                  <button class="float-right btn btn-danger editor-scene-animation-remove"><i class="fas fa-trash-alt"></i></button>
                  <button class="float-right btn btn-info mr-3 editor-scene-animation-edit-label"><i class="fas fa-edit"></i></button>
                </div>
              </h5>
            </div>
            <div class="card-body">
              <div class="editor-scene-animation-steps-container">
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
        <div class="card bg-dark text-white mb-3 editor-scene-animation-step-container">
          <div class="card-header">
            <h5>
              <span class="editor-scene-animation-step-title">Step ${count} (Delay: ${step.delay}ms)</span>
              <button class="float-right btn btn-md btn-danger btn editor-scene-animation-step-remove"><i class="fas fa-trash-alt"></i></button>
              <button class="float-right btn btn-info btn mr-3 editor-scene-animation-step-edit" data-toggle="modal" data-target="#editor-scene-step-editor-modal"><i class="fas fa-wrench"></i></button>
            </h5>
          </div>
          <div class="card-body editor-scene-animation-step" editor-scene-animation-step-count=${count} editor-scene-animation-step-delay="${step.delay}">

          <div class="mb-3 row">
            <div class="col-md-6">
              Channel
            </div>
            <div class="col-md-5">
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
            <div class="col-md-4">
              <input type="text" class="form-control editor-scene-animation-step-channel-value col-sm-12" value="${value}"></input>
            </div>
            <div class="col-md-2">
              <button class="btn btn-danger btn-block editor-scene-animation-step-row-remove"><i class="fas force-parent-lh fa-trash-alt"></i></button>
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
            <div class="col-md-2">
              <input type="text" class="form-control editor-scene-static-value col-sm-12" value="${val.value}"></input>
            </div>
            <div class="col-md-2">
              <button class="btn btn-danger btn-block editor-scene-static-row-remove"><i class="fas force-parent-lh fa-trash-alt"></i></button>
            </div>
          </div>`
  }

  return this
}