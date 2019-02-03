#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const body = require('body-parser');
const express = require('express');
const socketio = require('socket.io');
const program = require('commander');
const DMX = require('../dmx');
const Scenes = require("./lib/Scenes.js")

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
        scenes: scenes.getObject()
      })
    });

    return app;
  }

  this.makeSocketServer = () => {
    const io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

      /**
       * Send config on initial connection
       */
      socket.emit('config', {
        'devices': dmx.devices,
        'scenes': scenes.getObject()
      });

      for (const universe in dmx.universes) {
        socket.emit('update-dmx', universe, dmx.universeToObject(universe));
      }

      /**
       * Send whole refresh
       */
      socket.on('request_refresh', () => {
        socket.emit('config', {
          'devices': dmx.devices,
          'presets': config.presets
        });

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
        switch(packet.type){

          case "get-scene":
            socket.emit("data-response", {
              uuid: packet.uuid,
              response: scenes.getSceneById(packet.data.sceneId) || {}
            })
          break;

          case "save-scene":

            scenes.saveScene(packet.data)

            socket.emit("data-response", {
              uuid: packet.uuid,
              response: {success: true}
            })
          break;

          case "delete-scene":

            scenes.deleteScene(packet.data.sceneId)

            socket.emit("data-response", {
              uuid: packet.uuid,
              response: {success: true}
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

  this.makeScenes = () => {
    const scenes = new Scenes(dmx, this.universes, config.presets, config.scenesFileLocation)

    return scenes;
  }

  const config = JSON.parse(fs.readFileSync(program.config, 'utf8'));
  const dmx = this.getDMX()
  const scenes = this.makeScenes()
  const app = this.makeApp();
  const server = this.makeServer()
  const io = this.makeSocketServer()
}



DMXWeb();