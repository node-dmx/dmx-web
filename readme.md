# node-dmx

Webinterface and HTTP API using node-dmx

## Install

`npm install`

## Webinterface

### Configuration

The Daemon `dmx-web` looks for a configuration file in `/etc/dmx-web.json`. An alternate location can be passed as a command line argument.

This configuration file consists of three sections:

- Server
- Universes
- Presets

In the Server section you can set the listen port and host.
Under Universes you describe the DMX Universes with details like which output driver to use and which devices are at which address.
The presets section allows you to specify a state some channels should be set when the preset is called.

A example configuration is in the repository by the name `dmx-web-example.conf`

### Run

`dmx-web [-c <full-path to config file>]`

### Run as a service

On MacOS you can run dmx-web as a service by adding a launch script to `/Library/LaunchDaemons`. See the example file.

### Animation HTTP API

A List of Channel Transistions can be POSTed to `/animation/&lt;universe&gt;`. Each transistion is a JSON Object with at least the `to` property present. The Value of which also has to be an Object describing the channel end-states.

A duration for this transistion can be given in the `duration` property.
If not specified 0ms is assumed.

Example:

	[
		{"to": {"10": 0, "20": 0}},
		{"to": {"10": 255}, "duration": 2000},
		{"to": {"20": 255}, "duration": 1000}
	]

This sets channels 10 and 20 to zero. Then transistions channel 10 to 255 in 2 seconds. After that channel 20 is faded to 255 in 1 second.

## Library API

	var DMX = require('@node-dmx/dmx-library')

### Class DMX

#### new DMX()

Create a new DMX instance. This class is used to tie multiple universes together.

#### dmx.registerDriver(name, module)

- `name` - String
- `module` - Object implementing the Driver API


Register a new DMX Driver module by its name.
These drivers are currently registered by default:

- null: a development driver that prints the universe to stdout
- artnet: driver for EnttecODE
- bbdmx: driver for [BeagleBone-DMX](https://github.com/boxysean/beaglebone-DMX)
- dmx4all: driver for DMX4ALL devices like the "NanoDMX USB Interface"
- enttec-usb-dmx-pro: a driver for devices using a Enttec USB DMX Pro chip like the "DMXKing ultraDMX Micro".
- enttec-open-usb-dmx: driver for "Enttec Open DMX USB". This device is NOT recommended, there are known hardware limitations and this driver is not very stable. (If possible better obtain a device with the "pro" chip)
- dmxking-utra-dmx-pro: driver for the DMXKing Ultra DMX pro interface. This driver support multiple universe specify the options with Port = A or B

#### dmx.addUniverse(name, driver, device_id, options)

- `name` - String
- `driver` - String, referring a registered driver
- `device_id` - Number or Object
- `options` - Object, driver specific options

Add a new DMX Universe with a name, driver and an optional device_id used by the driver to identify the device.
For enttec-usb-dmx-pro and enttec-open-usb-dmx device_id is the path the the serial device. For artnet it is the target ip.

#### dmx.update(universe, channels)

- `universe` - String, name of the universe
- `channels` - Object, keys are channel numbers, values the values to set that channel to

Update one or multiple channels of a universe. Also emits a `update` Event with the same information.


#### DMX.devices

A JSON Object describing some Devices and how many channels they use.
Currently not many devices are in there but more can be added to the `devices.js` file. Pull requests welcome ;-)

The following Devices are known:

- generic - a one channel dimmer
- showtec-multidim2 - 4 channel dimmer with 4A per channel
- eurolite-led-bar - Led bar with 3 RGB color segments and some programms
- stairville-led-par-56 - RGB LED Par Can with some programms

### Class DMX.Animation

#### new DMX.Animation()

Create a new DMX Animation instance. This can be chained similar to jQuery.

#### animation.add(to, duration, options)

- `to` - Object, keys are channel numbers, values the values to set that channel to
- `duration` - Number, duration in ms
- `options` - Object

Add an animation Step.
The options Object takes an `easing` key which allows to set a easing function from the following list:

- linear (default)
- inQuad
- outQuad
- inOutQuad
- inCubic
- outCubic
- inOutCubic
- inQuart
- outQuart
- inOutQuart
- inQuint
- outQuint
- inOutQuint
- inSine
- outSine
- inOutSine
- inExpo
- outExpo
- inOutExpo
- inCirc
- outCirc
- inOutCirc
- inElastic
- outElastic
- inOutElastic
- inBack
- outBack
- inOutBack
- inBounce
- outBounce
- inOutBounce

Returns a Animation object with the animation step added.


#### animation.delay(duration)

- `duration` - Number, duration in ms

Delay the next animation step for duration.
Returns a Animation object with the delay step added.


#### animation.run(universe, onFinish)

- `universe` - Object, reference to the universe driver
- `onFinish` - Function, called when the animation is done

Run the Animation on the specified universe.


## Community

We're happy to help. Chat with us on IRC in #node-dmx on freenode.
