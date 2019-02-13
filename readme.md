# node-dmx

Webinterface and HTTP API using [node-dmx](https://github.com/node-dmx/dmx)

## Install

`npm install -g dmx-web`

## Webinterface

### Configuration

The Daemon `dmx-web` looks for a configuration file in `/etc/dmx-web.json`. An alternate location can be passed as a command line argument.

This configuration file consists of these sections:

- `server`
- `universes`
- `scenesFileLocation`
- `devicesFileLocation`

In the Server section you can set the listen port and host.
Under Universes you describe the DMX Universes with details like which output driver to use and which devices are at which address.
`scenesFileLocation` is used to specify a JSON file where scenes should be saved to. 
`devicesFileLocation` is used to specify a JSON file where configured devices should be saved to. 

A example configuration is in the repository by the name `dmx-web-example.conf`

### Run

`dmx-web [-c <full-path to config file>]`

### Run as a service

On MacOS you can run dmx-web as a service by adding a launch script to `/Library/LaunchDaemons`. See the example file.

### HTTP API
There is a HTTP api embded into dmx-web which allows you to set DMX values via http calls

Example request:
```
{
  "1": 255,
  "2": 0,
  "3": 128
} 
```
#### Static
Set dmx values for a universe by posting to: `/state/<universe>`

#### Animations
A List of Channel Transistions can be POSTed to `/animation/<universe>`. Each transistion is a JSON Object with at least the `to` property present. The Value of which also has to be an Object describing the channel end-states.

A duration for this transistion can be given in the `duration` property.
If not specified 0ms is assumed.

Example:

	[
		{"to": {"10": 0, "20": 0}},
		{"to": {"10": 255}, "duration": 2000},
		{"to": {"20": 255}, "duration": 1000}
	]

This sets channels 10 and 20 to zero. Then transistions channel 10 to 255 in 2 seconds. After that channel 20 is faded to 255 in 1 second.


## Community

We're happy to help. Chat with us on IRC in #node-dmx on freenode.
