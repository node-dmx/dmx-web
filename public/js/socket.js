const DmxSocket = function(app) {

  this.init = () => {

    this.config = {};
    this.devices = {};
    this.scenes = {};

    this.requests = {};

    this.socket = io();

    this.bindListeners()
  }

  /**
   * Send DMX data
   */
  this.update = (universe, data) => {
    this.socket.emit("update-dmx", universe, data)
  }

  this.setScene = (sceneId) => {
    this.socket.emit("update-scene", {
      sceneId
    })
  }

  this.getScene = (sceneId, callback) => {
    this.socketRequest("get-scene", {
      sceneId
    }, callback)
  }

  this.saveScene = (scene, callback) => {
    this.socketRequest("save-scene", scene, callback)
  }

  this.deleteScene = (sceneId, callback) => {
    this.socketRequest("delete-scene", {
      sceneId
    }, callback)
  }

  this.saveDevice = (device, callback) => {
    this.socketRequest("save-device", device, callback)
  }

  this.socketRequest = (type, data, callback) => {
    const uuid = this.generateUUID()

    this.requests[uuid] = callback

    this.socket.emit("data-request", {
      uuid,
      type,
      data
    })
  }

  this.handleDataResponse = (packet) => {
    this.requests[packet.uuid](packet.response)
  }

  this.generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  this.bindListeners = () => {

    /**
     * Load/Reload config
     */
    this.socket.on('config', (res) => {
      this.config = res.config
      this.devices = res.devices
      this.scenes = res.scenes
    });

    /**
     * Recieve dmx updates and update ui
     */
    this.socket.on('update-dmx', (universe, update) => {
      for (let channel in update) {
        app.sliderController.setSliderValue(universe, channel, update[channel])
      }
    });

    /**
     * Handle responses to data requests
     */
    this.socket.on('data-response', this.handleDataResponse)
  }

  return this
}