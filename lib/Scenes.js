const uuid = require("uuid/v4")
const fs = require("fs")
const DMX = require('dmx');

class Scenes {
  constructor(dmx, universes, presets, scenesFileLocation) {
    this.dmx = dmx
    this.universes = universes
    this.scenes = []

    this.currentSceneComponenets = []

    this.loadFromOldPresets(presets)
    this.loadFromFile(scenesFileLocation);
  }

  loadFromOldPresets(presets) {
    if (presets == null || presets == undefined) {
      return
    }

    console.warn("Warning! Using presets in your config file is deprecated! Use a scenes file instead!")

    for (let i = 0; i < presets.length; i++) {
      const scene = {
        id: `deprecated-presets-${presets[i].label}`,
        type: "full",
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
    if (scenesFileLocation == null || scenesFileLocation == undefined) {
      console.warn("Warning! No scenesFileLocation file specified")
      return
    }

    if (!fs.existsSync(scenesFileLocation)) {
      try {
        fs.writeFileSync(scenesFileLocation, JSON.stringify([]))
      } catch (e) {
        console.error(e.message)
        console.warn(`Warning! Was not able to create scenes file at: ${scenesFileLocation}`)
        return
      }
    }

    let scenesContent = []

    try {
      scenesContent = JSON.parse(fs.readFileSync(scenesFileLocation, 'utf8'));
    } catch (e) {
      console.error(e.message)
      console.warn(`Warning! Was not able to read contents of ${scenesFileLocation}`)
      return
    }

    for (const scene of scenesContent) {
      this.scenes.push(scene)
    }
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

      this.dmx.update(universes[i], packet)
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

        this.dmx.update(param.universe, packet)

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
          animation: dmxAnimation.runLoop(this.universes[param.universe])
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
}

module.exports = Scenes