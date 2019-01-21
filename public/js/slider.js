const SliderController = function(app) {

	$(".dmx-channel").on("input", (e) => {
		const slider = $(e.target)

		const data = {}

		data[slider.attr("channel")] = parseInt(slider.val())

		app.socket.update(slider.attr("universe"), data)
	})

	this.setSliderValue = (universe, channel, value) => {
		$(".dmx-channel[universe='" + universe + "'][channel='" + channel + "']").val(value)
	}

	return this
}