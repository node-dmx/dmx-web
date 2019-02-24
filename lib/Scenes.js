const uuid = require("uuid/v4")
const fs = require("fs")
const DMX = require('dmx');
const child = require('child_process');
const path = require('path');

class Scenes {
  constructor(app, universes, presets, scenesFileLocation) {
    this.app = app
    this.universes = universes
    this.scenes = []
    this.scenesFileLocation = scenesFileLocation
    
    this.currentSceneComponenets = []
    this.activeScenes = []

    this.currentDmxState = []

    this.addBlackoutScene()
    this.loadFromFile()
    this.loadFromOldPresets(presets)

    this.initCurrentDMXState()

    this.runDefaultScene()
  }

  /**
   * Keep support for presets in the config file. Deprecated!
   */
  loadFromOldPresets(presets) {
    if (presets == null || presets == undefined) {
      return
    }

    console.warn("Warning! Using presets in your config file is deprecated! Use a scenes file instead!")

    for (let i = 0; i < presets.length; i++) {
      const newId = `deprecated-presets-${presets[i].label}`

      if (this.getSceneById(newId) !== null) {
        continue
      }

      const scene = {
        id: newId,
        type: "full",
        legacy: true,
        values: []
      }

      scene.label = presets[i].label

      const universes = Object.keys(presets[i].values)

      for (const u of universes) {
        const channels = Object.keys(presets[i].values[u])

        for (const c of channels) {
          scene.values.push({
            type: "static",
            channel: parseInt(c),
            universe: u,
            value: presets[i].values[u][c]
          })
        }
      }

      this.scenes.push(scene)
    }
  }

  /**
   * Load scenes fromt the scenes file
   */
  loadFromFile(scenesFileLocation) {
    if (this.scenesFileLocation == null || this.scenesFileLocation == undefined) {
      console.warn("Warning! No scenesFileLocation file specified in config")
      return
    }

    if (!fs.existsSync(this.scenesFileLocation)) {
      try {
        this.saveToFile()
      } catch (e) {
        console.error(e.message)
        console.warn(`Warning! Was not able to create scenes file at: ${this.scenesFileLocation}`)
        return
      }

      return
    }

    let scenesContent = []

    try {
      scenesContent = JSON.parse(fs.readFileSync(this.scenesFileLocation, 'utf8'));
    } catch (e) {
      console.error(e.message)
      console.warn(`Warning! Was not able to read contents of ${this.scenesFileLocation}`)
      return
    }

    for (const scene of scenesContent) {
      this.scenes.push(scene)
    }
  }

  initCurrentDMXState() {
    for (let universe in this.universes) {
      this.currentDmxState[universe] = new Array(512).fill(0);
    }
  }

  runDefaultScene() {
    for (let i = 0; i < this.scenes.length; i++) {
      if (this.scenes[i].default) {
        this.runScene(this.scenes[i])
      }
    }
  }

  saveToFile() {
    if (this.scenesFileLocation == null || this.scenesFileLocation == undefined) {
      console.warn("Warning! No scenesFileLocation file specified in config")
      return
    }

    fs.writeFileSync(this.scenesFileLocation, JSON.stringify(this.scenes.filter((scene) => {
      return !scene.hidden && !scene.legacy
    }), null, 2))
  }

  /**
   * Created a hidden scene to be used as our blackout button
   */
  addBlackoutScene() {
    const scene = {
      id: "default-blackout",
      type: "full",
      label: "Blackout",
      hidden: true,
      values: []
    }
    this.scenes.push(scene)
  }

  /**
   * Get all scenes
   */
  getObject() {
    return this.scenes;
  }

  /**
   * Get a scene by its ID
   */
  getSceneById(sceneId) {
    for (const scene of this.scenes) {
      if (scene.id == sceneId) {
        return scene;
      }
    }

    return null
  }

  /**
   * Stop all scenes
   */
  stopAllScenes() {

    /**
     * Loop over active segments and stop and remove
     */
    for (let i = this.currentSceneComponenets.length - 1; i >= 0; i--) {

      if (this.currentSceneComponenets[i].type === "animation") {
        this.currentSceneComponenets[i].animation.stop()
      } else if (this.currentSceneComponenets[i].type === "script") {
        this.currentSceneComponenets[i].script.kill('SIGINT')
      }

      this.currentSceneComponenets.splice(i, 1)
    }

    /**
     * Zero out universes
     */
    for (let universe in this.universes) {
      const packet = []

      for (let k = 0; k < 512; k++) {
        packet[k + 1] = 0
      }

      this.app.dmx.update(universe, packet)
    }

  }

  /**
   * Run a scene
   * Easy for static scenes, also starts animations
   */
  runScene(scene) {
    for (const param of scene.values) {
      if (param.type === "static") {
        this.runStaticScene(param)
      } else if (param.type === "animation") {
        this.runAnimationScene(param)
      } else if (param.type === "script") {
        this.runScriptScene(param)
      }
    }

    this.activeScenes.push(scene.id)
  }

  runScriptScene(param) {
    const script = child.fork(path.join(__dirname, 'child/UserScriptRunner.js'))

    script.on("message", (rawMessage) => {
      const message = JSON.parse(rawMessage)

      if (message.type === "send_dmx") {
        const channels = {}

        channels[message.data.channel] = message.data.value

        if(!(message.data.universe in Object.keys(this.app.dmx.universes))){
          return
        }

        this.app.dmx.update(message.data.universe, channels)

      } else if (message.type === "log") {
        console.log(`User Script > ${message.data.message}`)
      }
    })

    script.send(JSON.stringify({
      type: "user_code",
      data: {
        user_code: param.code
      }
    }))

    this.currentSceneComponenets.push({
      type: "script",
      script: script
    })
  }

  runAnimationScene(param) {

    if (!(param.universe in this.app.dmx.universes)) return;

    /**
     * Set channels to last value of animation to fix halting at zero
     */
    const lStep = param.steps[param.steps.length - 1]

    for (const channel of Object.keys(lStep.channels)) {
      const chan = {}
      chan[channel] = lStep.channels[channel]
      this.app.dmx.update(param.universe, chan)
    }


    /**
     * Build and run Animation
     */
    const dmxAnimation = new DMX.Animation()

    for (const step of param.steps) {
      const channels = {}

      for (const channel of Object.keys(step.channels)) {
        channels[channel] = step.channels[channel]
      }

      dmxAnimation.add(channels, !isNaN(step.delay) ? step.delay : 0)
    }

    const anim = {
      universe: param.universe,
      type: "animation",
      animation: dmxAnimation.runLoop(this.app.dmx.universes[param.universe])
    }

    this.currentSceneComponenets.push(anim)
  }

  runStaticScene(param) {

    if (!(param.universe in this.app.dmx.universes)) return;

    /**
     * Instant if no transition is specified
     */
    if (isNaN(param.transition) || param.transition === 0) {
      this.currentSceneComponenets.push(param)

      const packet = {}

      packet[param.channel] = param.value

      this.app.dmx.update(param.universe, packet)
      return
    }

    const dmxAnimation = new DMX.Animation()

    const oldChannels = {}
    oldChannels[param.channel] = this.currentDmxState[param.universe][param.channel]

    dmxAnimation.add(oldChannels, 0)

    const channels = {}
    channels[param.channel] = param.value

    dmxAnimation.add(channels, !isNaN(param.transition) ? param.transition : 0)

    const anim = {
      type: "animation",
      animation: dmxAnimation.run(this.app.dmx.universes[param.universe])
    }

    this.currentSceneComponenets.push(anim)
  }

  /**
   * Add scene into landscape
   */
  updateScene(data) {
    const newScene = this.getSceneById(data.sceneId)

    if (!newScene) {
      console.warn(`Invalid scene id: ${data.sceneId}`)
      return
    }

    /**
     * Save state for transitions
     */
    for (let universe of Object.keys(this.app.dmx.universes)) {
      this.currentDmxState[universe] = this.app.dmx.universeToObject(universe)
    }

    /**
     * If scene is a full scene, zero out everything
     */
    if (newScene.type === "full") {
      this.activeScenes = []
      this.stopAllScenes()
    }

    this.runScene(newScene)

    this.app.io.emit('update-scene', {
      sceneId: newScene.id
    });
  }

  /**
   * Update a scene and save changes
   */
  overwriteScene(id, scene) {
    for (let i = 0; i < this.scenes.length; i++) {
      if (this.scenes[i].id === id) {
        this.scenes[i] = scene
        this.saveToFile()
        return
      }
    }

    console.log("Warning! Failed to overwrite scene!")
  }

  /**
   * Add a new scene and save
   */
  addNewScene(scene) {
    this.scenes.push(scene)
    this.saveToFile()
  }

  /**
   * Used to save scenes, overwrites scene if it already exists
   */
  saveScene(scene) {
    if (this.getSceneById(scene.id) === null) {
      this.addNewScene(scene)
      return
    }

    this.overwriteScene(scene.id, scene)
  }

  /**
   * Delete a scene by its ID and save
   */
  deleteScene(sceneId) {
    this.scenes = this.scenes.filter((scene) => {
      return scene.id !== sceneId
    })

    this.saveToFile()
  }

  getFriendlyChannelName(channel) {
    switch (channel) {
      case "static-color":
        return "Color"
        break
      case "gobo-selector":
        return "Gobo"
        break
      case "dimmer-strobe-combo":
        return "Dimmer/Strobe"
        break
      default:
        // return channel.charAt(0).toUpperCase() + channel.slice(1).replace("-", " ");
        return channel.split("-").map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1)
        }).join(" ");
        break
    }
  }
}

module.exports = Scenes