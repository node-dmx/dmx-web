const socketio = require('socket.io');

class SocketHandler {
  constructor(app, server, config, dmx, devices, scenes) {
    this.app = app;
    this.config = config;
    this.dmx = dmx;
    this.devices = devices;
    this.scenes = scenes;

    const io = socketio.listen(server);

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

    for (const universe in this.dmx.universes) {
      socket.emit('update-dmx', universe, this.dmx.universeToObject(universe));
    }

    /**
     * Send whole refresh
     */
    socket.on('request_refresh', () => {
      socket.emit('config', this.app.getClientConfigData());

      for (const universe in this.dmx.universes) {
        socket.emit('update-dmx', universe, this.dmx.universeToObject(universe));
      }
    });

    /**
     * On update dmx command
     */
    socket.on('update-dmx', (universe, update) => {
      this.dmx.update(universe, update);
    });

    /*
     * On update scene command
     */
    socket.on('update-scene', (data) => {
      this.scenes.updateScene(data)
    });

    /*
     * On data request command
     */
    socket.on('data-request', (packet) => {
      switch (packet.type) {

        /**
         * On user get scene data
         */
        case "get-scene":
          socket.emit("data-response", {
            uuid: packet.uuid,
            response: this.scenes.getSceneById(packet.data.sceneId) || {}
          })
          break;

          /**
           * On user save/update scene
           */
        case "save-scene":

          if (!config.allowEditing) {
            return socket.emit("data-response", {
              uuid: packet.uuid,
              response: {
                success: false
              }
            })
          }

          this.scenes.saveScene(packet.data)

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

          if (!config.allowEditing) {
            return socket.emit("data-response", {
              uuid: packet.uuid,
              response: {
                success: false
              }
            })
          }

          this.scenes.deleteScene(packet.data.sceneId)

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

          if (!config.allowEditing) {
            return socket.emit("data-response", {
              uuid: packet.uuid,
              response: {
                success: false
              }
            })
          }

          this.devices.saveDevice(packet.data)

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

          if (!config.allowEditing) {
            return socket.emit("data-response", {
              uuid: packet.uuid,
              response: {
                success: false
              }
            })
          }

          this.devices.deleteDevice(packet.data)

          socket.emit("data-response", {
            uuid: packet.uuid,
            response: {
              success: true
            }
          })
          break;

        default:
          console.log("Warning! Invalid data-request type received!")
      }
    })
  }
}

module.exports = SocketHandler