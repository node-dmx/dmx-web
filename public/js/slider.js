const SliderController = function(app) {

  $(".dmx-channel").on("input", (e) => {
    const slider = $(e.target)

    const data = {}

    data[slider.attr("channel")] = parseInt(slider.val())

    app.socket.update(slider.attr("universe"), data)
  })

  $("#sliders-scene-modal-save").on("click", (e) => {
    const label = $("#sliders-scene-creator-modal-name").val()
    $("#sliders-scene-creator-modal-name").val("")

    this.saveScene(label)
  })

  this.setSliderValue = (universe, channel, value) => {
    $(".dmx-channel[universe='" + universe + "'][channel='" + channel + "']").val(value)
  }

  this.saveScene = (label) => {
    const id = app.socket.generateUUID()

    const values = []

    $(".dmx-channel").each((i, elem) => {
      const value = Number($(elem).val())

      if (value === 0) {
        return
      }

      values.push({
        type: "static",
        channel: $(elem).attr("channel"),
        value: value,
        universe: $(elem).attr("universe")
      })
    })

    scene = {
      id: id,
      label: label,
      type: "full",
      values: values
    }

    app.socket.saveScene(scene, (response) => {
      window.location.reload(true)
    })
  }

  return this
}