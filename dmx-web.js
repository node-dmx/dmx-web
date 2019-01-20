#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const body = require('body-parser');
const express = require('express');
const socketio = require('socket.io');
const program = require('commander');
const DMX = require('dmx');
const A = DMX.Animation;

program
  .version('0.0.1')
  .option('-c, --config <file>', 'Read config from file [/etc/dmx-web.json]', '/etc/dmx-web.json')
  .parse(process.argv);

const	config = JSON.parse(fs.readFileSync(program.config, 'utf8'));

function DMXWeb() {
  const app = express();
  const server = http.createServer(app);
  const io = socketio.listen(server);

  const dmx = new DMX(config);

  for (const universe in config.universes) {
    dmx.addUniverse(
      universe,
      config.universes[universe].output.driver,
      config.universes[universe].output.device,
      config.universes[universe].output.options
    );
  }

  const listenPort = config.server.listen_port || 8080;
  const listenHost = config.server.listen_host || '::';

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

  app.use(body.json());

  app.set('view engine', 'pug')
  app.use(express.static('public'))

  app.get('/', (req, res) => {
    res.render('index', { title: 'Hey', message: 'Hello there!' })
    // res.sendFile(__dirname + '/index.html');
  });

  io.sockets.on('connection', socket => {
    socket.emit('init', {'devices': dmx.devices, 'setup': config});

    socket.on('request_refresh', () => {
      for (const universe in config.universes) {
        socket.emit('update', universe, dmx.universeToObject(universe));
      }
    });

    socket.on('update', (universe, update) => {
      dmx.update(universe, update);
    });

    dmx.on('update', (universe, update) => {
      socket.emit('update', universe, update);
    });
  });
}

DMXWeb();
