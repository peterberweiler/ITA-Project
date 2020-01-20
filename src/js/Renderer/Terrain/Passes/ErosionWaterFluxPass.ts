import Framebuffer from "../../Framebuffer";
import { erosionParams, gl, TextureBundle } from "../../Global";
import { Pass } from "./Passes";

const fluxFragSource = require("../../../Shader/erosionWaterOutflowFlux.fs").default;

export class ErosionWaterFluxPass extends Pass {
	private uTerrainHeightTextureLocation0: WebGLUniformLocation;
	private uWaterHeightTextureLocation0: WebGLUniformLocation;
	private uWaterOutflowFluxTextureLocation0: WebGLUniformLocation;
	private uDeltaTimeLocation0: WebGLUniformLocation;
	private uRainRateLocation0: WebGLUniformLocation;
	private uPipeCrossSectionAreaLocation0: WebGLUniformLocation;
	private uPipeLengthLocation0: WebGLUniformLocation;

	constructor() {
		super(fluxFragSource);
		this.uTerrainHeightTextureLocation0 = this.shader.getUniformLocation("uTerrainHeightTexture");
		this.uWaterHeightTextureLocation0 = this.shader.getUniformLocation("uWaterHeightTexture");
		this.uWaterOutflowFluxTextureLocation0 = this.shader.getUniformLocation("uWaterOutflowFluxTexture");
		this.uDeltaTimeLocation0 = this.shader.getUniformLocation("uDeltaTime");
		this.uRainRateLocation0 = this.shader.getUniformLocation("uRainRate");
		this.uPipeCrossSectionAreaLocation0 = this.shader.getUniformLocation("uPipeCrossSectionArea");
		this.uPipeLengthLocation0 = this.shader.getUniformLocation("uPipeLength");
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		this.shader.setUniformI(this.uTerrainHeightTextureLocation0, 0);
		this.shader.setUniformI(this.uWaterHeightTextureLocation0, 1);
		this.shader.setUniformI(this.uWaterOutflowFluxTextureLocation0, 2);
		this.shader.setUniformF(this.uDeltaTimeLocation0, erosionParams.deltaTime);
		this.shader.setUniformF(this.uRainRateLocation0, erosionParams.rainRate);
		this.shader.setUniformF(this.uPipeCrossSectionAreaLocation0, erosionParams.pipeCrossSectionArea);
		this.shader.setUniformF(this.uPipeLengthLocation0, erosionParams.pipeLength);

		textures.heightMap.current().bind(0);
		textures.waterHeightMap.current().bind(1);
		textures.waterFluxMap.current().bind(2);

		framebuffer.setColorAttachment(textures.waterHeightMap.next(), 0);
		framebuffer.setColorAttachment(textures.waterFluxMap.next(), 1);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	}

	finalizePass(_framebuffer: Framebuffer) {
		_framebuffer.unsetColorAttachment(0);
		_framebuffer.unsetColorAttachment(1);
	}
}
