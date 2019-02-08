const uuid = require("uuid/v4")
const fs = require("fs")

class Devices {
  constructor(dmx, devicesFileLocation) {
    this.devices = []
    this.dmx = dmx
    this.devicesFileLocation = devicesFileLocation

    this.currentSceneComponenets = []

    this.loadFromFile()
  }

  loadFromFile(devicesFileLocation) {
    if (this.devicesFileLocation == null || this.devicesFileLocation == undefined) {
      console.warn("Warning! No devicesFileLocation file specified in config")
      return
    }

    if (!fs.existsSync(this.devicesFileLocation)) {
      try {
        this.saveToFile()
      } catch (e) {
        console.error(e.message)
        console.warn(`Warning! Was not able to create devices file at: ${this.devicesFileLocation}`)
        return
      }

      return
    }

    let devicesContent = []

    try {
      devicesContent = JSON.parse(fs.readFileSync(this.devicesFileLocation, 'utf8'));
    } catch (e) {
      console.error(e.message)
      console.warn(`Warning! Was not able to read contents of ${this.devicesFileLocation}`)
      return
    }

    /**
     * Turn fixture type into channels using devices from the dmx library
     */
    for (let device of devicesContent) {

      if("type" in device){
        device = {...device, ...this.dmx.devices[device.type]}
      }

      this.devices.push(device)
    }

    /**
     * Sort in address order
     */
    this.devices = this.devices.sort((a, b) => {
      return a.address - b.address
    })

  }

  saveToFile() {
    if (this.devicesFileLocation == null || this.devicesFileLocation == undefined) {
      console.warn("Warning! No devicesFileLocation file specified in config")
      return
    }

    fs.writeFileSync(this.devicesFileLocation, JSON.stringify(this.devices, null, 2))
  }

  getObject() {
    return this.devices;
  }

  getDeviceById(deviceId) {
    for (const device of this.devices) {
      if (device.id == deviceId) {
        return device;
      }
    }

    return null
  }

}

module.exports = Devices