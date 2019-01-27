const App = function () {

	this.sliderController = new SliderController(this)
	this.showController = new ShowController(this)

	this.socket = new DmxSocket(this)
	this.socket.init()
	
	return this
}

window.DMX = new App()