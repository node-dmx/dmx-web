const App = function() {

  this.sliderController = new SliderController(this)
  this.showController = new ShowController(this)
  this.editorController = new EditorController(this)

  this.socket = new DmxSocket(this)
  this.socket.init()

  return this
}

window.DMX = new App()