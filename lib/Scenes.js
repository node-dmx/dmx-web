const uuid = require("uuid/v4")
const fs = require("fs")
const DMX = require('dmx');

class Scenes {
  constructor(app, presets, scenesFileLocation) {
    this.app = app
    this.scenes = []
    this.scenesFileLocation = scenesFileLocation
    this.currentSceneComponenets = []

    this.addBlackoutScene()
    this.loadFromFile()
    this.loadFromOldPresets(presets)
  }

  loadFromOldPresets(presets) {
    if (presets == null || presets == undefined) {
      return
    }

    console.warn("Warning! Using presets in your config file is deprecated! Use a scenes file instead!")

    for (let i = 0; i < presets.length; i++) {
      const newId = `deprecated-presets-${presets[i].label}`

      if(this.getSceneById(newId) !== null){
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

  saveToFile() {
    if (this.scenesFileLocation == null || this.scenesFileLocation == undefined) {
      console.warn("Warning! No scenesFileLocation file specified in config")
      return
    }

    fs.writeFileSync(this.scenesFileLocation, JSON.stringify(this.scenes.filter((scene) => {
      return !scene.hidden && !scene.legacy
    }), null, 2))
  }

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

  getObject() {
    return this.scenes;
  }

  getSceneById(sceneId) {
    for (const scene of this.scenes) {
      if (scene.id == sceneId) {
        return scene;
      }
    }

    return null
  }

  clearAllComponents() {

    /**
     * Universes for clearing down
     * @type {Array}
     */
    const universes = []

    /**
     * Get active universes
     */
    for (let i = this.currentSceneComponenets.length - 1; i >= 0; i--) {
      if (universes.indexOf(this.currentSceneComponenets[i].universe) === -1) {
        universes.push(this.currentSceneComponenets[i].universe)
      }
    }

    /**
     * Loop over active segments and stop and remove
     */
    for (let i = this.currentSceneComponenets.length - 1; i >= 0; i--) {

      if (this.currentSceneComponenets[i].type === "animation") {
        this.currentSceneComponenets[i].animation.stop()
      }

      this.currentSceneComponenets.splice(i, 1)
    }

    /**
     * Zero out universes
     */
    for (let i = 0; i < universes.length; i++) {
      const packet = []

      for (let k = 0; k < 512; k++) {
        packet[k + 1] = 0
      }

      this.app.dmx.update(universes[i], packet)
    }

  }

  runScene(scene) {
    for (const param of scene.values) {

      /**
       * Add static param
       */
      if (param.type === "static") {
        this.currentSceneComponenets.push(param)

        const packet = {}

        packet[param.channel] = param.value

        this.app.dmx.update(param.universe, packet)

        /**
         * Add animation param
         */
      } else if (param.type === "animation") {

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
    }
  }

  updateScene(data) {
    const newScene = this.getSceneById(data.sceneId)

    if (!newScene) {
      console.warn(`Invalid scene id: ${data.sceneId}`)
      return
    }

    if (newScene.type === "full") {
      this.clearAllComponents()
    }

    this.runScene(newScene)
  }

  overwriteScene(id, scene) {
    for(let i = 0 ; i < this.scenes.length; i++){
      if(this.scenes[i].id === id){
        this.scenes[i] = scene
        this.saveToFile()
        return
      }
    }

    console.log("Warning! Failed to overwrite scene!")
  }

  addNewScene(scene){
    this.scenes.push(scene)
    this.saveToFile()
  }

  saveScene(scene) {
    if (this.getSceneById(scene.id) === null) {
      this.addNewScene(scene)
      return
    }

    this.overwriteScene(scene.id, scene)
  }

  deleteScene(sceneId){
    this.scenes = this.scenes.filter((scene) => {
      return scene.id !== sceneId
    })

    this.saveToFile()
  }
}

module.exports = Scenes