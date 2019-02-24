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
    const listenPort = this.config.server.listen_port || 8080;
    const listenHost = this.config.server.listen_host || '::';

    const server = http.createServer(this.app);

    server.listen(listenPort, listenHost, null, () => {
      if (this.config.server.uid && this.config.server.gid) {
        try {
          process.setuid(this.config.server.uid);
          process.setgid(this.config.server.gid);
        } catch (err) {
          console.log(err);
          process.exit(1);
        }
      }
    });

    return server
  }

  this.getDMX = () => {
    const dmx = new DMX(this.config);

    for (const universe in this.config.universes) {
      dmx.addUniverse(
        universe,
        this.config.universes[universe].output.driver,
        this.config.universes[universe].output.device,
        this.config.universes[universe].output.options
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
        scenes: this.scenes.getObject(),
        scenesController: this.scenes,
        config: this.config,
        devices: this.devices.getObject(),
        deviceTypes: this.dmx.devices
      })
    });

    /**
     * Get the config
     */
    app.get('/config', (req, res) => {
      const response = {
        'devices': this.dmx.devices,
        'universes': {}
      };

      Object.keys(this.config.universes).forEach(key => {
        response.universes[key] = this.config.universes[key].devices;
      });

      res.json(response);
    });

    /**
     * Get state of a universe
     */
    app.get('/state/:universe', (req, res) => {
      if (!(req.params.universe in this.dmx.universes)) {
        res.status(404).json({
          'error': 'universe not found'
        });
        return;
      }

      res.json({
        'state': this.dmx.universeToObject(req.params.universe)
      });
    });

    /**
     * Set state of universe. 
     */
    app.post('/state/:universe', (req, res) => {
      if (!(req.params.universe in this.dmx.universes)) {
        res.status(404).json({
          'error': 'universe not found'
        });
        return;
      }

      this.dmx.update(req.params.universe, req.body);
      res.json({
        'state': this.dmx.universeToObject(req.params.universe)
      });
    });

    /**
     * Run animation in universe
     */
    app.post('/animation/:universe', (req, res) => {
      try {
        const universe = this.dmx.universes[req.params.universe];

        // preserve old states
        const old = this.dmx.universeToObject(req.params.universe);

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

    /**
     * Set scene 
     */
    app.post('/scene/:sceneId', (req, res) => {
      req.params.sceneId

      scenes.updateScene({
        sceneId: req.params.sceneId
      })

      res.json({
        'success': true
      });
    });

    return app;
  }

  this.getClientConfigData = () => {
    return {
      devices: this.devices.getObject(),
      scenes: this.scenes.getObject(),
      activeScenes: this.scenes.activeScenes,
      config: this.config
    }
  }

  this.makeSocketServer = () => {
    
  }

  /**
   * Broadcast this.dmx updates with debounce to not kill low power clients
   */
  this.handleDmxUpdates = () => {
    let dmxUpdates = {}

    /**
     * Send updated this.dmx values to client (with limit)
     */
    const sendUpdate = _.throttle(() => {
      for(let universe in dmxUpdates){
        this.io.emit('update-dmx', universe, dmxUpdates[universe]);
      }

      dmxUpdates = {}
    }, 50)


    this.dmx.on('update', (universe, update) => {
      
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

  this.config = JSON.parse(fs.readFileSync(program.config, 'utf8'));
  this.dmx = this.getDMX()
  this.devices = new Devices(this, this.config.devicesFileLocation)
  this.scenes = new Scenes(this, this.config.universes, this.config.presets, this.config.scenesFileLocation)
  this.app = this.makeApp();
  this.server = this.makeServer()
  this.io = new SocketHandler(this)

  this.handleDmxUpdates()
}



DMXWeb();