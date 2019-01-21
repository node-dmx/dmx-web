const DmxSocket = function(app) {

    this.init = () => {
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
        this.socket.on('update-dmx', function(universe, update) {
            for (let channel in update) {
                app.sliderController.setSliderValue(universe, channel, update[channel])
            }
        });
    }

    return this
}