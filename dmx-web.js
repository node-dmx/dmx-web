#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const body = require('body-parser');
const express = require('express');
const socketio = require('socket.io');
const program = require('commander');
const DMX = require('../dmx');
const Scenes = require("./lib/Scenes.js")
const Devices = require("./lib/Devices.js")

program
  .version('0.0.1')
  .option('-c, --config <file>', 'Read config from file [/etc/dmx-web.json]', '/etc/dmx-web.json')
  .parse(process.argv);

const DMXWeb = () => {

  this.makeServer = () => {
    const listenPort = config.server.listen_port || 8080;
    const listenHost = config.server.listen_host || '::';

    const server = http.createServer(app);

    server.listen(listenPort, listenHost, null, () => {
      if (config.server.uid && config.server.gid) {
        try {
          process.setuid(config.server.uid);
          process.setgid(config.server.gid);
        } catch (err) {
          console.log(err);
          process.exit(1);
        }
      }
    });

    return server
  }

  this.getDMX = () => {
    const dmx = new DMX(config);

    for (const universe in config.universes) {
      dmx.addUniverse(
        universe,
        config.universes[universe].output.driver,
        config.universes[universe].output.device,
        config.universes[universe].output.options
      );
    }

    return dmx;
  }

  this.makeApp = () => {
    const app = express();

    app.use(body.json());

    app.set('view engine', 'pug')
    app.use(express.static('public'))

    app.get('/', (req, res) => {
      res.render('index', {
        scenes: scenes.getObject(),
        config: config,
        devices: devices.getObject(),
        deviceTypes: dmx.devices
      })
    });

    /**
     * Get config
     */
    app.get('/config', (req, res) => {
      const response = {
        'devices': dmx.devices,
        'universes': {}
      };

      Object.keys(config.universes).forEach(key => {
        response.universes[key] = config.universes[key].devices;
      });

      res.json(response);
    });

    /**
     * get state of universe
     */
    app.get('/state/:universe', (req, res) => {
      if (!(req.params.universe in dmx.universes)) {
        res.status(404).json({
          'error': 'universe not found'
        });
        return;
      }

      res.json({
        'state': dmx.universeToObject(req.params.universe)
      });
    });

    /**
     * Set state of universe. 
     * @deprecated Setting the state of a universe this way is deprecated! Use scenes instead!
     */
    app.post('/state/:universe', (req, res) => {
      if (!(req.params.universe in dmx.universes)) {
        res.status(404).json({
          'error': 'universe not found'
        });
        return;
      }

      dmx.update(req.params.universe, req.body);
      res.json({
        'state': dmx.universeToObject(req.params.universe)
      });
    });

    /**
     * Run animation in universe
     * @deprecated Setting the state of a universe this way is deprecated! Use scenes instead!
     */
    app.post('/animation/:universe', (req, res) => {
      try {
        const universe = dmx.universes[req.params.universe];

        // preserve old states
        const old = dmx.universeToObject(req.params.universe);

        const animation = new DMX.Animation();

        for (const step in req.body) {
          animation.add(
            req.body[step].to,
            req.body[step].duration || 0,
            req.body[step].options || {}
          );
        }
        animation.add(old, 0);
        animation.run(universe);
        res.json({
          'success': true
        });
      } catch (e) {
        console.log(e);
        res.json({
          'error': String(e)
        });
      }
    });

    return app;
  }

  this.getClientConfigData = () => {
    return {
      devices: devices.getObject(),
      scenes: scenes.getObject(),
      config: config
    }
  }

  this.makeSocketServer = () => {
    const io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

      /**
       * Send config on initial connection
       */
      socket.emit('config', this.getClientConfigData());

      for (const universe in dmx.universes) {
        socket.emit('update-dmx', universe, dmx.universeToObject(universe));
      }

      /**
       * Send whole refresh
       */
      socket.on('request_refresh', () => {
        socket.emit('config', this.getClientConfigData());

        for (const universe in dmx.universes) {
          socket.emit('update-dmx', universe, dmx.universeToObject(universe));
        }
      });

      /**
       * On update dmx command
       */
      socket.on('update-dmx', (universe, update) => {
        dmx.update(universe, update);
      });

      /*
       * On update scene command
       */
      socket.on('update-scene', (data) => {
        scenes.updateScene(data)
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
              response: scenes.getSceneById(packet.data.sceneId) || {}
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

            scenes.saveScene(packet.data)

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

            scenes.deleteScene(packet.data.sceneId)

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

            devices.saveDevice(packet.data)

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
      });

      /**
       * Send updated dmx values to client
       */
      dmx.on('update', (universe, update) => {
        socket.emit('update-dmx', universe, update);
      });
    });
  }


  const config = JSON.parse(fs.readFileSync(program.config, 'utf8'));
  const dmx = this.getDMX()
  const devices = new Devices(dmx, config.devicesFileLocation)
  const scenes = new Scenes(this, config.presets, config.scenesFileLocation)
  const app = this.makeApp();
  const server = this.makeServer()
  const io = this.makeSocketServer()
}



DMXWeb();