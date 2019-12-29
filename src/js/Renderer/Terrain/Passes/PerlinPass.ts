import Framebuffer from "../../Framebuffer";
import { gl, TextureBundle } from "../../Global";
import { Pass } from "./Passes";

const perlinFSSource = require("../../../Shader/perlinPass.fs").default;

export class PerlinPass extends Pass {
	constructor() { super(perlinFSSource); }

	seeds = [1, 200, 300, 0, 10, 800, 3000, 10000];
	amplitudes = [512, 128, 64, 32, 16, 8, 1, 0.5];
	scales = [512, 256, 128, 64, 32, 16, 8, 2];
	offsets = [0, 0];
	ridgeFactor = [1, 0, 1, 0, 1, 1, 0];

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		gl.uniform1fv(this.shader.getUniformLocation("uSeed"), this.seeds);
		gl.uniform1fv(this.shader.getUniformLocation("uAmplitude"), this.amplitudes);
		gl.uniform1fv(this.shader.getUniformLocation("uScale"), this.scales);
		gl.uniform2fv(this.shader.getUniformLocation("uOffset"), this.offsets);
		gl.uniform1fv(this.shader.getUniformLocation("uRidgeFactor"), this.ridgeFactor);
		gl.uniform1i(this.shader.getUniformLocation("uLayerCount"), this.seeds.length);

		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		framebuffer.setColorAttachment(textures.heightMap.next());
	}
}
