const vm = require("vm")
const util = require("util")

class UserScriptRunner {
  constructor() {
    this.setupEnvironment()

    console.log("Running user script")

    process.on('message', (message) => {
      this.handleMessage(message)
    })
  }

  handleMessage(rawMessage) {
    const message = JSON.parse(rawMessage)

    if (message.type === "user_code") {
      const context = this.getContext()
      vm.runInContext(message.data.user_code, context)
    }
  }

  getContext() {
    const context = {
      ...global,
      ...this.getAddedContext(),
      ... {
        dmx: {
          set: this.setDmxValue.bind(this)
        }
      }
    }

    vm.createContext(context);

    return context
  }

  getAddedContext() {
    return {
      console,
      require
    }
  }

  setDmxValue(universe, channel, value) {
    this.sendMessage({
      type: "send_dmx",
      data: {
        universe,
        channel,
        value
      }
    })
  }

  sendMessage(message) {
    process.send(JSON.stringify(message))
  }

  setupEnvironment() {
    global.console.log = (...messages) => {
      for (let message of messages) {
        this.sendMessage({
          type: "log",
          data: {
            message
          }
        })
      }
    }
  }
}

const userScript = new UserScriptRunner()