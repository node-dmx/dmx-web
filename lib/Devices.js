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

  /**
   * Load devices from devices file
   */
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

      if ("type" in device) {
        device = {...device,
          ...this.dmx.devices[device.type]
        }
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

  /**
   * Save devices to file
   */
  saveToFile() {
    if (this.devicesFileLocation == null || this.devicesFileLocation == undefined) {
      console.warn("Warning! No devicesFileLocation file specified in config")
      return
    }

    fs.writeFileSync(this.devicesFileLocation, JSON.stringify(this.devices, null, 2))
  }

  /**
   * get object with all devices in
   */
  getObject() {
    return this.devices;
  }

  /**
   * Get a device by its ID
   */
  getDeviceById(deviceId) {
    for (const device of this.devices) {
      if (device.id == deviceId) {
        return device;
      }
    }

    return null
  }

  /**
   * Overwrite an existing device
   */
  overwriteDevice(id, device) {
    for (let i = 0; i < this.devices.length; i++) {
      if (this.devices[i].id === id) {
        this.devices[i] = device
        this.saveToFile()
        return
      }
    }

    console.log("Warning! Failed to overwrite device!")
  }

  /**
   * Add a new device and save
   */
  addNewDevice(device) {
    if ("type" in device) {
      device = {...device,
        ...this.dmx.devices[device.type]
      }
    }

    this.devices.push(device)
    this.saveToFile()
  }

  /**
   * Save device, overwrites or adds new device
   */
  saveDevice(device) {
    if (this.getDeviceById(device.id) === null) {
      this.addNewDevice(device)
      return
    }

    this.overwriteDevice(device.id, device)
  }

  /**
   * Delete a device by its ID
   */
  deleteDevice(deviceId) {
    this.devices = this.devices.filter((device) => {
      return device.id !== deviceId
    })

    this.saveToFile()
  }

}

module.exports = Devices