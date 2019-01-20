const App = function () {
	this.socket = new DmxSocket(this)
	this.socket.init()

	this.sliderController = new SliderController(this)

	return this
}

window.DMX = new App()