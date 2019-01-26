const App = function () {
	this.socket = new DmxSocket(this)
	this.socket.init()

	this.sliderController = new SliderController(this)
	this.showController = new ShowController(this)
	this.editorController = new EditorController(this)

	return this
}

window.DMX = new App()