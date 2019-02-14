const EditorRenderer = function(editor, app) {

  /**
   * On add static row
   */
  $("#editor-scene-add-static").on("click", (e) => {
    $("#editor-scene-static").append(this.generateStaticEditorRowHtml({
      universe: Object.keys(app.socket.config.universes)[0],
      channel: 1,
      value: 0,
      transition: 0
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
      universe: Object.keys(app.socket.config.universes)[0],
      label: "New Animation",
      steps: [{
        channels: {
          1: 0
        },
        delay: 1000
      }]
    }))
  })

  /**
   * On add animation value
   */
  $("#editor-scene-editor").on("click", ".editor-scene-animation-step-add-row", (e) => {
    const step = $(e.target).closest(".editor-scene-animation-step")
    const universe = step.closest(".editor-scene-animation").attr("editor-scene-animation-universe")
    step.find(".editor-scene-animation-step-values").append(this.generateAnimationStepRowHtml(universe, 1, 0))
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
          1: 0
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

      /**
       * Make universe selector
       */
      let universeOptions = ""

      for (let universeOption of Object.keys(app.socket.config.universes)) {
        universeOptions += `
        <option ${universeOption === universe ? "selected" : ""} editor-universe="${universeOption}">${universeOption}</option>
      `
      }

      container.find(".editor-scene-animation-universe").html(`Universe: <select class="form-control editor-scene-animation-universe-editor">${universeOptions}</select>`)
    } else {

      $(e.currentTarget).html(`<i class="fas fa-edit"></i>`)
      
      const newLabel = container.find(".editor-scene-animation-label-editor").val()
      const newUniverse = container.find(".editor-scene-animation-universe-editor").find("option:selected").attr("editor-universe")

      container.find(".editor-scene-animation-label").text(newLabel)
      container.find(".editor-scene-animation-universe").html(`<span class=" text-secondary badge badge-dark">${newUniverse}</span>`)

      container.closest(".editor-scene-animation")
        .attr("editor-scene-animation-label", newLabel)
        .attr("editor-scene-animation-universe", newUniverse)

      /**
       * Trigger animation input changes to reload labels
       */
      $(".editor-scene-animation-step-channel").trigger("change")
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
    const stepUUID = stepElem.attr("editor-scene-animation-step-uuid")

    $("#editor-scene-step-editor-modal").attr("editor-scene-animation-step-count", stepCount).attr("editor-scene-animation-step-uuid", stepUUID)
    $("#editor-scene-step-editor-modal-delay").val(delay)
  })

  /**
   * On save step
   */
  $("#editor-scene-step-editor-modal-save").on("click", (e) => {
    const delay = $("#editor-scene-step-editor-modal-delay").val()
    const count = $("#editor-scene-step-editor-modal").attr("editor-scene-animation-step-count")
    const stepUUID = $("#editor-scene-step-editor-modal").attr("editor-scene-animation-step-uuid")

    $(`.editor-scene-animation-step[editor-scene-animation-step-uuid="${stepUUID}"]`).attr("editor-scene-animation-step-delay", delay)

    $(`.editor-scene-animation-step[editor-scene-animation-step-uuid="${stepUUID}"]`)
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

    editor.setScene(scene)
  })

  /**
   * On edit static channel
   */
  $("#editor-scene-editor").on("change keyup paste", ".editor-scene-static-channel", (e) => {
    const row = $(e.target).closest(".editor-scene-static-row");
    const universe = row.find(".editor-scene-static-universe").find("option:selected").attr("editor-universe")
    row.find(".editor-scene-static-channel-label").text(this.getChannelLabel(universe, $(e.target).val()))
  })

  /**
   * On edit static universe
   */
  $("#editor-scene-editor").on("change", ".editor-scene-static-universe", (e) => {
    $(".editor-scene-static-channel").trigger("change")
  })

  /**
   * On edit animation channel
   */
  $("#editor-scene-editor").on("change keyup paste", ".editor-scene-animation-step-channel", (e) => {
    const row = $(e.target).closest(".editor-scene-animation-step-row");
    const universe = row.closest(".editor-scene-animation").attr("editor-scene-animation-universe")

    row.find(".editor-scene-animation-step-channel-label").text(this.getChannelLabel(universe, $(e.target).val()))
  })

  this.getChannelLabel = (universe, channel) => {
    for(let device of app.socket.devices){
      if(device.universe == universe && device.address <= channel && device.address + device.channels.length > channel) {
        return device.label + ": " + device.channels[channel - device.address]
      }
    }

    return "Unknown"
  }

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

      html += this.generateAnimationEditorStepHtml(val.universe, count, step)
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

  this.generateAnimationEditorStepHtml = (universe, count, step) => {
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
          <div class="card-body editor-scene-animation-step" editor-scene-animation-step-count=${count} editor-scene-animation-step-delay="${step.delay}" editor-scene-animation-step-uuid="${app.socket.generateUUID()}">

          <div class="mb-3 row">
            <div class="col-md-8">
              Channel
            </div>
            <div class="col-md-2">
              Value
            </div>
            <div class="col-md-1"></div>
          </div>

          <div class="mb-3 editor-scene-animation-step-values">
      `

    for (const channel of Object.keys(step.channels)) {
      html += this.generateAnimationStepRowHtml(universe, channel, step.channels[channel])
    }

    html += `
          </div>

          <button class="btn btn-secondary btn-block editor-scene-animation-step-add-row">Add Value</button>

        </div>
      </div>
      `

    return html
  }

  this.generateAnimationStepRowHtml = (universe, channel, value) => {
    return `
          <div class="editor-scene-animation-step-row mb-3 row">
            <div class="col-md-8">
              <div class="input-group">
                <input type="text" class="form-control editor-scene-animation-step-channel col-sm-12" value="${channel}"></input>
                <div class="input-group-append w-75">
                  <span class="input-group-text w-100">
                    <span class="truncate editor-scene-animation-step-channel-label">${this.getChannelLabel(universe, channel)}</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="col-md-2">
                <input type="text" class="form-control editor-scene-animation-step-channel-value" value="${value}"></input>
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
    let universeOptions = ""

    for (let universe of Object.keys(app.socket.config.universes)) {
      universeOptions += `
        <option ${universe === val.universe ? "selected='selected'" : ""} editor-universe="${universe}">${universe}</option>
      `
    }

    return `
          <div class="editor-scene-static-row mb-3 row">
            <div class="col-md-3">
              <select class="editor-scene-static-universe form-control">
                ${universeOptions}
              </select>
            </div>
            <div class="col-md-3">
              <div class="input-group">
                <input type="text" class="form-control w-25 editor-scene-static-channel" value="${val.channel}"></input>
                <div class="input-group-append w-75">
                  <span class="input-group-text w-100">
                    <span class="truncate editor-scene-static-channel-label">${this.getChannelLabel(val.universe, val.channel)}</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <input type="text" class="form-control editor-scene-static-transition col-sm-12" value="${val.transition || 0}"></input>
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
