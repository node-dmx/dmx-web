const uuid = require("uuid/v4")

class Scenes {
	constructor(dmx, presets, scenesFileLocation) {
		this.dmx = dmx
		this.scenes = []

		this.currentSceneComponenets = []

		this.loadFromPresets(presets)
	}

	loadFromPresets(presets) {
		if(presets == null || presets == undefined){
			return
		}

		console.warn("Warning! using presets in your config file is deprecated! Use a scenes file instead!")

		for(let  i = 0 ; i < presets.length; i++){
			const scene = {
				id: uuid(),
				type: "full",
				values : []
			}

			scene.label = presets[i].label

			const universes = Object.keys(presets[i].values)

			for(const u of universes){
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

	getObject() {
		return this.scenes;
	}

	getSceneById(sceneId){
		for(const scene of this.scenes){
			if(scene.id == sceneId) {
				return scene;
			}
		}
	}

	clearAllComponents() {
		for(let i = this.currentSceneComponenets.length - 1 ; i >= 0 ; i--) {
			
			if(this.currentSceneComponenets[i].type === "animation"){
				this.currentSceneComponenets[i].animation.stop()
			}

			this.currentSceneComponenets.splice(i, 1)
		}
	}

	addScene(scene) {
		for(const param of scene.values){
			if(param.type === "static"){
				this.currentSceneComponenets.push(param)
				
				const packet = {}

				packet[param.channel] = param.value

				this.dmx.update(param.universe, packet)
			}
		}
	}

	updateScene(data) {
		const newScene = this.getSceneById(data.sceneId)

		if(newScene.type === "full"){
			this.clearAllComponents()
		}

		this.addScene(newScene)
	}
}

module.exports = Scenes