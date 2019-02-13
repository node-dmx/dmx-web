#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const body = require('body-parser');
const express = require('express');
const program = require('commander');
const _ = require('underscore');
const DMX = require('../dmx');
const Scenes = require("./lib/Scenes.js")
const Devices = require("./lib/Devices.js")
const SocketHandler = require("./lib/SocketHandler.js")

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
     * Get the config
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
     * Get state of a universe
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
    
  }

  /**
   * Broadcast dmx updates with debounce to not kill low power clients
   */
  this.handleDmxUpdates = () => {
    let dmxUpdates = {}

    /**
     * Send updated dmx values to client (with limit)
     */
    const sendUpdate = _.throttle(() => {
      for(let universe in dmxUpdates){
        io.emit('update-dmx', universe, dmxUpdates[universe]);
      }

      dmxUpdates = {}
    }, 50)


    dmx.on('update', (universe, update) => {
      
      if(!(universe in dmxUpdates)){
        dmxUpdates[universe] = update
      }else{
        for(let channel in update){
          dmxUpdates[universe][channel] = update[channel]
        }
      }

      sendUpdate()
    });

  }

  const config = JSON.parse(fs.readFileSync(program.config, 'utf8'));
  const dmx = this.getDMX()
  const devices = new Devices(dmx, config.devicesFileLocation)
  const scenes = new Scenes(this, dmx, config.universes, config.presets, config.scenesFileLocation)
  const app = this.makeApp();
  const server = this.makeServer()
  const io = new SocketHandler(this, server, config, dmx, devices, scenes)

  this.handleDmxUpdates()
}



DMXWeb();