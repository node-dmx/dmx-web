const DmxSocket = function(app) {

    this.init = () => {
        this.socket = io();

        this.socket.on('init', (msg) => {
            const setup = msg.setup
            const devices = msg.devices
        });

        this.bindListeners()

        this.socket.emit('request_refresh');
    }

    /**
     * Send DMX data
     */
    this.update = (universe, data) => {
        this.socket.emit("update", universe, data)
    }

    this.bindListeners = () => {
        /**
         * recieve updates and update ui
         */
        this.socket.on('update', function(universe, update) {
            for (let channel in update) {
                app.sliderController.setSliderValue(universe, channel, update[channel])
            }
        });
    }

    return this
}