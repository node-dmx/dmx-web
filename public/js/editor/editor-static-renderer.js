const EditorStaticRenderer = function(editor, app) {

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
   * On edit static channel
   */
  $("#editor-scene-editor").on("change keyup paste", ".editor-scene-static-channel", (e) => {
    const row = $(e.target).closest(".editor-scene-static-row");
    const universe = row.find(".editor-scene-static-universe").find("option:selected").attr("editor-universe")
    row.find(".editor-scene-static-channel-label").text(editor.getChannelLabel(universe, $(e.target).val()))
  })

  /**
   * On edit static universe
   */
  $("#editor-scene-editor").on("change", ".editor-scene-static-universe", (e) => {
    $(".editor-scene-static-channel").trigger("change")
  })

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
                    <span class="truncate editor-scene-static-channel-label">${editor.getChannelLabel(val.universe, val.channel)}</span>
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
