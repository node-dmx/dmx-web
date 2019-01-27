const DmxSocket = function(app) {

    this.init = () => {

        this.requests = {};

        this.socket = io();

        this.bindListeners()

        this.socket.emit('request_refresh');
    }

    /**
     * Send DMX data
     */
    this.update = (universe, data) => {
        this.socket.emit("update-dmx", universe, data)
    }

    this.setScene = (sceneId) => {
        this.socket.emit("update-scene", {sceneId})
    }

    this.getScene = (sceneId, callback) => {
        this.socketRequest("get-scene", {sceneId}, callback)
    }

    this.socketRequest = (type, data, callback) => {
      const uuid = this.generateRequestId()

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

    this.generateRequestId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }

    this.bindListeners = () => {

        /**
         * Load/Reload config
         */
        this.socket.on('config', (msg) => {
            const setup = msg.setup
            const devices = msg.devices
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