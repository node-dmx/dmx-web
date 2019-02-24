const socketio = require('socket.io');

class SocketHandler {
  constructor(app) {
    this.app = app;

    const io = socketio.listen(app.server);

    /**
     * On socket connect
     */
    io.sockets.on('connection', this.onConnection.bind(this));

    return io
  }

  onConnection(socket) {
    /**
     * Send config on initial connection
     */
    socket.emit('config', this.app.getClientConfigData());

    for (const universe in this.app.dmx.universes) {
      socket.emit('update-dmx', universe, this.app.dmx.universeToObject(universe));
    }

    /**
     * Send whole refresh
     */
    socket.on('request_refresh', () => {
      socket.emit('config', this.app.getClientConfigData());

      for (const universe in this.app.dmx.universes) {
        socket.emit('update-dmx', universe, this.app.dmx.universeToObject(universe));
      }
    });

    /**
     * On update dmx command
     */
    socket.on('update-dmx', (universe, update) => {
      this.app.dmx.update(universe, update);
    });

    /*
     * On update scene command
     */
    socket.on('update-scene', (data) => {
      this.app.scenes.updateScene(data)
    });

    /*
     * On data request command
     */
    socket.on('data-request', (packet) => {
      this.onDataRequest(socket, packet)
    })
  }

  onDataRequest(socket, packet) {
    switch (packet.type) {

      /**
       * On user get scene data
       */
      case "get-scene":
        socket.emit("data-response", {
          uuid: packet.uuid,
          response: this.app.scenes.getSceneById(packet.data.sceneId) || {}
        })
        break;

      /**
       * On user save/update scene
       */
      case "save-scene":

        if (!this.app.config.allowEditing) {
          return socket.emit("data-response", {
            uuid: packet.uuid,
            response: {
              success: false
            }
          })
        }

        this.app.scenes.saveScene(packet.data)

        socket.emit("data-response", {
          uuid: packet.uuid,
          response: {
            success: true
          }
        })
        break;

      /**
       * On user delete scene
       */
      case "delete-scene":

        if (!this.app.config.allowEditing) {
          return socket.emit("data-response", {
            uuid: packet.uuid,
            response: {
              success: false
            }
          })
        }

        this.app.scenes.deleteScene(packet.data.sceneId)

        socket.emit("data-response", {
          uuid: packet.uuid,
          response: {
            success: true
          }
        })
        break;

      /**
       * On user save/update device
       */
      case "save-device":

        if (!this.app.config.allowEditing) {
          return socket.emit("data-response", {
            uuid: packet.uuid,
            response: {
              success: false
            }
          })
        }

        this.app.devices.saveDevice(packet.data)

        socket.emit("data-response", {
          uuid: packet.uuid,
          response: {
            success: true
          }
        })
        break;

      /**
       * On user delete device
       */
      case "delete-device":

        if (!this.app.config.allowEditing) {
          return socket.emit("data-response", {
            uuid: packet.uuid,
            response: {
              success: false
            }
          })
        }

        this.app.devices.deleteDevice(packet.data)

        socket.emit("data-response", {
          uuid: packet.uuid,
          response: {
            success: true
          }
        })
        break;

      default:
        console.log("Warning! Invalid data-request type received!")
        break;
    }
  }
}

module.exports = SocketHandler