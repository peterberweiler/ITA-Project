import Framebuffer from "../../Framebuffer";
import { gl, TextureBundle } from "../../Global";
import { Pass } from "./Passes";

const layerBrushFSSource = require("../../../Shader/layerBrushPass.fs").default;

export type LayerBrushPassData = {
	points: number[],
	type: number,
	radius: number,
	strength: number,
	minSlope: number,
	maxSlope: number,
}

export class LayerBrushPass extends Pass {
	private dataQueue: LayerBrushPassData[] = [];
	private readonly uPoints: WebGLUniformLocation;
	private readonly uHeightmapTexture: WebGLUniformLocation;
	private readonly uSurfaceMapTexture: WebGLUniformLocation;
	private readonly uPointCount: WebGLUniformLocation;
	private readonly uType: WebGLUniformLocation;
	private readonly uRadius: WebGLUniformLocation;
	private readonly uStrength: WebGLUniformLocation;
	private readonly uMinSlope: WebGLUniformLocation;
	private readonly uMaxSlope: WebGLUniformLocation;

	constructor() {
		super(layerBrushFSSource);
		this.uHeightmapTexture = this.shader.getUniformLocation("uHeightmapTexture");
		this.uSurfaceMapTexture = this.shader.getUniformLocation("uSurfaceMapTexture");
		this.uType = this.shader.getUniformLocation("uType");
		this.uRadius = this.shader.getUniformLocation("uRadius");
		this.uStrength = this.shader.getUniformLocation("uStrength");
		this.uPoints = this.shader.getUniformLocation("uPoints");
		this.uPointCount = this.shader.getUniformLocation("uPointCount");
		this.uMinSlope = this.shader.getUniformLocation("uMinSlope");
		this.uMaxSlope = this.shader.getUniformLocation("uMaxSlope");
	}

	initalizePass(textures: TextureBundle, _framebuffer: Framebuffer) {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.uHeightmapTexture, 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, textures.layers.weightMapCurrent);
		this.shader.setUniformI(this.uSurfaceMapTexture, 1);
		const data = this.dataQueue.shift();
		if (data) {
			if (data.points.length >= 100) {
				console.error("Too much points for LayerBrushPass");
			}
			this.shader.setUniformVec2(this.uPoints, data.points);
			this.shader.setUniformI(this.uPointCount, data.points.length / 2);
			this.shader.setUniformI(this.uType, data.type);
			this.shader.setUniformF(this.uRadius, data.radius);
			this.shader.setUniformF(this.uStrength, data.strength);
			this.shader.setUniformF(this.uMinSlope, data.minSlope);
			this.shader.setUniformF(this.uMaxSlope, data.maxSlope);
		}
		else {
			this.shader.setUniformF(this.shader.getUniformLocation("uPointCount"), 0);
		}
		gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, textures.layers.weightMapNext, 0, 0);
		gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, textures.layers.weightMapNext, 0, 1);
		textures.layers.swapWeightMaps();
		gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	}

	finalizePass(framebuffer: Framebuffer) {
		framebuffer.unsetColorAttachment(1);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
	}

	queueData(data: LayerBrushPassData) {
		this.dataQueue.push(data);
	}
}
