import Framebuffer from "../../Framebuffer";
import { gl, TextureBundle } from "../../Global";
import Renderer from "../../Renderer";
import { Pass } from "./Passes";

const advectionFragSource = require("../../../Shader/erosionSoilAdvection.fs").default;

export class ErosionSoilAdvectionPass extends Pass {
	private uTerrainHeightTextureLocation: WebGLUniformLocation;
	private uSoilFluxPlusTextureLocation: WebGLUniformLocation;
	private uSoilFluxCrossTextureLocation: WebGLUniformLocation;

	constructor() {
		super(advectionFragSource);
		this.uTerrainHeightTextureLocation = this.shader.getUniformLocation("uTerrainHeightTexture");
		this.uSoilFluxPlusTextureLocation = this.shader.getUniformLocation("uSoilFluxPlusTexture");
		this.uSoilFluxCrossTextureLocation = this.shader.getUniformLocation("uSoilFluxCrossTexture");
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		Renderer.checkGLError();
		this.shader.setUniformI(this.uTerrainHeightTextureLocation, 0);
		this.shader.setUniformI(this.uSoilFluxPlusTextureLocation, 1);
		this.shader.setUniformI(this.uSoilFluxCrossTextureLocation, 2);

		Renderer.checkGLError();
		textures.heightMap.current().bind(0);
		textures.soilFluxPlusMap.bind(1);
		textures.soilFluxCrossMap.bind(2);

		Renderer.checkGLError();
		framebuffer.setColorAttachment(textures.heightMap.next(), 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		Renderer.checkGLError();
	}

	finalizePass(_framebuffer: Framebuffer) {
		Renderer.checkGLError();
		_framebuffer.unsetColorAttachment(0);
		Renderer.checkGLError();
	}
}
