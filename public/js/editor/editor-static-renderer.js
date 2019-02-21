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
    row.find(".editor-scene-static-channel-label").html(editor.getChannelLabel(universe, $(e.target).val()))
  })

  /**
   * On edit static universe
   */
  $("#editor-scene-editor").on("change", ".editor-scene-static-universe", (e) => {
    $(".editor-scene-static-channel").trigger("change")
  })

  /**
   * On select static universe channel
   */
  $("#editor-scene-editor").on("click", ".editor-scene-static-channel-select", (e) => {
    $(e.currentTarget).closest(".editor-scene-static-channel-container").find(".editor-scene-static-channel").val($(e.currentTarget).attr("editor-scene-static-channel-select-address")).change()
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

    let channelOptions = ""

    for (let device of app.socket.devices) {
      if (device.universe == val.universe) {
        channelOptions += `<button class="dropdown-item disabled" type="button">${device.label}</button>`

        for(let i = 0 ; i < device.channels.length; i++){
          channelOptions += `<button class="dropdown-item editor-scene-static-channel-select" type="button" editor-scene-static-channel-select-address="${device.address + i}">${editor.getFriendlyChannelName(device.channels[i])}</button>`
        }

        channelOptions += `<div role="separator" class="dropdown-divider"></div>`
      }
    }

    return `
          <div class="editor-scene-static-row mb-3 row">
            <div class="col-sm-3 col-xl-2">
              <select class="editor-scene-static-universe form-control">
                ${universeOptions}
              </select>
            </div>
            <div class="col-sm-3 col-xl-5">
              <div class="input-group editor-scene-static-channel-container">
                <input type="text" class="form-control w-25 editor-scene-static-channel" value="${val.channel}"></input>
                <div class="input-group-append w-75">
                  <button class="truncate btn text-left btn-block btn-outline-secondary btn-light" type="button" data-toggle="dropdown"><i class="fas fa-caret-down mr-2"></i><span class="editor-scene-static-channel-label">${editor.getChannelLabel(val.universe, val.channel)}</span></button>
                  <div class="dropdown-menu dropdown-menu-right">
                    ${channelOptions}
                  </div>
                </div>
              </div>
            </div>
            <div class="col-sm-2 col-xl-2">
              <input type="text" class="form-control editor-scene-static-transition col-sm-12" value="${val.transition || 0}"></input>
            </div>
            <div class="col-sm-2 col-xl-2">
              <input type="text" class="form-control editor-scene-static-value col-sm-12" value="${val.value}"></input>
            </div>
            <div class="col-sm-2 col-xl-1">
              <button class="btn btn-danger btn-block editor-scene-static-row-remove"><i class="fas force-parent-lh fa-trash-alt"></i></button>
            </div>
          </div>`
  }

  return this
}
