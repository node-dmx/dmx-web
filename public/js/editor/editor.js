const EditorController = function(app) {

  this.staticRenderer = new EditorStaticRenderer(this, app)
  this.animationRenderer = new EditorAnimationRenderer(this, app)

  this.currentScene = null

  /**
   * On select scene
   */
  $(".editor-scene-selector").on("click", (e) => {
    app.socket.getScene($(e.target).attr("scene_id"), (scene) => {
      this.currentScene = scene
      this.drawSceneEditor(this.currentScene)
    })
  })

  /**
   * On save scene
   */
  $("#editor-scene-save").on("click", (e) => {
    this.saveScene()
  })

  /**
   * On save device
   */
  $("#editor-device-modal-save").on("click", (e) => {
    const id = app.socket.generateUUID()
    const label = $("#editor-add-device-modal-name").val()
    const address = Number($("#editor-add-device-modal-address").val())
    const universe = $("#editor-add-device-modal-universe").find("option:selected").text()
    const type = $("#editor-add-device-modal-type").find("option:selected").text()

    $("#editor-add-device-modal-name").val("")
    $("#editor-add-device-modal-address").val(1)
    $("#editor-add-device-modal-universe").find("option").removeAttr("selected")
    $("#editor-add-device-modal-type").find("option").removeAttr("selected")

    app.socket.saveDevice({
      id,
      label,
      universe,
      address,
      type
    }, (result) => {
      window.location.reload(true)
    })
  })

  /**
   * On delete device
   */
  $(".editor-device-delete").on("click", (e) => {
    app.socket.deleteDevice($(e.currentTarget).attr("editor-device-id"), (result) => {
      window.location.reload(true)
    })
  })

  /**
   * On delete scene
   */
  $("#editor-scene-delete").on("click", (e) => {
    app.socket.deleteScene(this.currentScene.id, () => {
      window.location.reload(true)
    })
  })

  this.getFriendlyChannelName = (channel) => {
    switch (channel) {
      case "static-color":
        return "Color"
        break
      case "gobo-selector":
        return "Gobo"
        break
      case "dimmer-strobe-combo":
        return "Dimmer/Strobe"
        break
      default:
        // return channel.charAt(0).toUpperCase() + channel.slice(1).replace("-", " ");
        return channel.split("-").map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1)
        }).join(" ");
        break
    }
  }

  this.getChannelLabel = (universe, channel) => {
    for (let device of app.socket.devices) {
      if (device.universe == universe && device.address <= channel && device.address + device.channels.length > channel) {
        const channelName = this.getFriendlyChannelName(device.channels[channel - device.address])
        return `<span class="d-none d-xl-inline">${device.label}: </span>${channelName}`
      }
    }

    return "Unknown"
  }

  this.drawSceneEditor = (scene) => {
    $("#editor-scene-title").text(scene.label)

    $("#editor-scene-static").html(this.staticRenderer.generateStaticEditorHtml(scene))
    $("#editor-scene-animations").html(this.animationRenderer.generateAnimationEditorHtml(scene))

    $("#editor-scene-help").hide()
    $("#editor-scene-editor").show()
  }

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
      const transition = $(e).find(".editor-scene-static-transition").val()
      const universe = $(e).find(".editor-scene-static-universe").find("option:selected").attr("editor-universe")

      values.push({
        type: "static",
        channel,
        value,
        universe,
        transition
      })
    })

    return values
  }

  this.setScene = (scene) => {
    this.currentScene = scene
    this.drawSceneEditor(this.currentScene)
  }

  return this
}