const EditorScriptRenderer = function(editor, app) {

  this.editors = []

  /**
   * On add script
   */
  $("#editor-scene-add-script").on("click", (e) => {
    const id = app.socket.generateUUID()

    $("#editor-scene-scripts").append(this.generateScriptEditorRowHtml($(".editor-scene-script-row").length + 1, {
      id: id,
      code: "dmx.set('my-universe', 1, 254)"
    }))

    this.editors.push(this.buildEditor(id))

  })

  /**
   * On remove script
   */
  $("#editor-scene-editor").on("click", ".editor-scene-script-remove", (e) => {
    $(e.target).closest(".editor-scene-script-row").remove()
  })

  /**
   * generate html for all scripts in scene
   */
  this.generateScriptEditorHtml = (scene) => {
    let scriptValuesHtml = ""
    let count = 1;

    for (const val of scene.values) {
      if (val.type === "script") {
        const id = app.socket.generateUUID()

        scriptValuesHtml += this.generateScriptEditorRowHtml(count, {
          id: id,
          code: val.code
        })

        count++
      }
    }

    return scriptValuesHtml
  }

  /**
   * Build all ace editors
   */
  this.buildEditors = () => {
    this.editors = []

    for(let editor of $(".editor-scene-script-editor")){
      this.editors.push(this.buildEditor($(editor).attr("editor-script-editor-id")))
    }
  }

  /**
   * Build ace editor
   */
  this.buildEditor = (id) => {
    const editor = ace.edit(`editor-scene-script-editor-${id}`, {
      mode: "ace/mode/javascript",
      selectionStyle: "text"
    })

    editor.setTheme("ace/theme/monokai");
    editor.setShowPrintMargin(false);
    editor.setOptions({
      maxLines: Infinity
    });

    return editor
  }

  this.generateScriptEditorRowHtml = (count, data) => {
    return `
          <div class="editor-scene-script-row mb-3">
            <div class="card bg-secondary">
              <div class="card-header">
                <h5 class="row">
                  <div class="col-sm-8">
                    <span class="editor-scene-script-label">Script ${count}:</span>
                  </div>
                  <div class="col-sm-4 text-right">
                    <button class="float-right btn btn-danger editor-scene-script-remove"><i class="fas fa-trash-alt"></i></button>
                  </div>
                </h5>
              </div>
              <div class="card-body p-0">
                <div class="editor-scene-script-editor" editor-script-editor-id="${data.id}" id="editor-scene-script-editor-${data.id}">${data.code}</div>
              </div>
            </div>
          </div>`
  }

  return this
}