import Global from "../Global";

export const MAX_LAYERS: number = 8;
const WEIGHT_MAP_RESOLUTION: number = 1024;

export class Material {
	albedoRoughness: number = 0x7F;

	setColor(color: number[]) {
		color[0] = Math.min(Math.max(0.0, color[0]), color[0], 1.0);
		color[1] = Math.min(Math.max(0.0, color[1]), color[1], 1.0);
		color[2] = Math.min(Math.max(0.0, color[2]), color[2], 1.0);

		this.albedoRoughness &= 0xFF;
		this.albedoRoughness |= ((color[0] * 255) << 24) & 0xFFFFFFFF;
		this.albedoRoughness |= ((color[1] * 255) << 16) & 0xFFFFFFFF;
		this.albedoRoughness |= ((color[2] * 255) << 8) & 0xFFFFFFFF;
	}

	setRoughness(roughness: number) {
		roughness = Math.min(Math.max(0.0, roughness), roughness, 1.0);
		this.albedoRoughness &= ~0xFF;
		this.albedoRoughness |= (roughness * 255) & 0xFF;
	}

	getColor() {
		return [((this.albedoRoughness >> 24) & 0xFF) / 255.0, ((this.albedoRoughness >> 16) & 0xFF) / 255.0, ((this.albedoRoughness >> 8) & 0xFF) / 255.0];
	}

	getRoughness() {
		return (this.albedoRoughness & 0xFF) * 255.0;
	}
}

export default class Layers {
	layerOrder: number[] = [];
	weightMapCurrent: WebGLTexture;
	weightMapNext: WebGLTexture;
	private layerMaterials: Material[] = [];
	private layerCount = 0;
	private freeLayerIndices: number[] = [];

	constructor() {
		for (let i = 0; i < MAX_LAYERS; ++i) {
			this.freeLayerIndices.push(MAX_LAYERS - i - 1);
			this.layerMaterials.push(new Material());
			this.layerOrder.push(0);
		}

		let gl = Global.gl;

		const idCurrent = gl.createTexture();
		if (!idCurrent) { throw new Error("Couldn't create texture."); }
		this.weightMapCurrent = idCurrent;
		const idNext = gl.createTexture();
		if (!idNext) { throw new Error("Couldn't create texture."); }
		this.weightMapNext = idNext;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.weightMapCurrent);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, WEIGHT_MAP_RESOLUTION, WEIGHT_MAP_RESOLUTION, MAX_LAYERS / 4);

		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.weightMapNext);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, WEIGHT_MAP_RESOLUTION, WEIGHT_MAP_RESOLUTION, MAX_LAYERS / 4);
	}

	swapWeightMaps() {
		const temp = this.weightMapCurrent;
		this.weightMapCurrent = this.weightMapNext;
		this.weightMapNext = temp;
	}

	getLayerMaterial(layerIndex: number) {
		return this.layerMaterials[layerIndex];
	}

	getRemainingFreeLayers() {
		return MAX_LAYERS - this.layerCount;
	}

	getAllocatedLayerCount() {
		return this.layerCount;
	}

	allocateLayer() {
		let index = this.freeLayerIndices.pop();
		if (index !== undefined) {
			this.layerCount += 1;
			return index;
		}
		return -1;
	}

	freeLayer(layerIndex: number) {
		for (let i = 0; i < this.freeLayerIndices.length; ++i) {
			if (this.freeLayerIndices[i] === layerIndex) {
				throw new Error("Tried to double free the same layer index!");
			}
		}
		if (layerIndex >= MAX_LAYERS || layerIndex < 0) {
			throw new Error("Tried to free invalid layer index!");
		}
		this.freeLayerIndices.push(layerIndex);
		this.layerCount -= 1;
	}
}
