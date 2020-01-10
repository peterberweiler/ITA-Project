import { gl } from "../Global";

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
		return (this.albedoRoughness & 0xFF) / 255.0;
	}
}

export default class Layers {
	layerOrder: number[] = [];
	weightMapCurrent: WebGLTexture;
	weightMapNext: WebGLTexture;
	private activeLayers: boolean[] = [];
	private layerMaterials: Material[] = [];

	constructor() {
		for (let i = 0; i < MAX_LAYERS; ++i) {
			this.layerMaterials.push(new Material());
			this.layerOrder.push(i);
			this.activeLayers.push(false);
		}

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
		gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA16F, WEIGHT_MAP_RESOLUTION, WEIGHT_MAP_RESOLUTION, MAX_LAYERS / 4);

		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.weightMapNext);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA16F, WEIGHT_MAP_RESOLUTION, WEIGHT_MAP_RESOLUTION, MAX_LAYERS / 4);
	}

	swapWeightMaps() {
		const temp = this.weightMapCurrent;
		this.weightMapCurrent = this.weightMapNext;
		this.weightMapNext = temp;
	}

	getLayerMaterial(layerId: number) {
		return this.layerMaterials[layerId];
	}

	setLayerActive(layerId: number, active: boolean) {
		this.activeLayers[layerId] = active;
	}

	getLayerActive(layerId: number) {
		return this.activeLayers[layerId];
	}
}
