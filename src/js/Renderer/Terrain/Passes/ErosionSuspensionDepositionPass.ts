import Framebuffer from "../../Framebuffer";
import { erosionParams, gl, TextureBundle } from "../../Global";
import Renderer from "../../Renderer";
import { Pass } from "./Passes";

const erosionFragSource = require("../../../Shader/erosionSuspensionDeposition.fs").default;

export class ErosionSuspensionDepositionPass extends Pass {
	private uTerrainHeightTextureLocation1: WebGLUniformLocation;
	private uWaterHeightTextureLocation1: WebGLUniformLocation;
	private uSedimentHardnessTextureLocation1: WebGLUniformLocation;
	private uWaterOutflowFluxTextureLocation1: WebGLUniformLocation;
	private uDeltaTimeLocation1: WebGLUniformLocation;
	private uPipeLengthLocation1: WebGLUniformLocation;
	private uSedimentCapacityLocation1: WebGLUniformLocation;
	private uMaxErosionDepthLocation1: WebGLUniformLocation;
	private uSuspensionRateLocation1: WebGLUniformLocation;
	private uDepositionRateLocation1: WebGLUniformLocation;
	private uSedimentSofteningRateLocation1: WebGLUniformLocation;
	private uEvaporationRateLocation1: WebGLUniformLocation;

	constructor() {
		super(erosionFragSource);
		this.uTerrainHeightTextureLocation1 = this.shader.getUniformLocation("uTerrainHeightTexture");
		this.uWaterHeightTextureLocation1 = this.shader.getUniformLocation("uWaterHeightTexture");
		this.uSedimentHardnessTextureLocation1 = this.shader.getUniformLocation("uSedimentHardnessTexture");
		this.uWaterOutflowFluxTextureLocation1 = this.shader.getUniformLocation("uWaterOutflowFluxTexture");
		this.uDeltaTimeLocation1 = this.shader.getUniformLocation("uDeltaTime");
		this.uPipeLengthLocation1 = this.shader.getUniformLocation("uPipeLength");
		this.uSedimentCapacityLocation1 = this.shader.getUniformLocation("uSedimentCapacity");
		this.uMaxErosionDepthLocation1 = this.shader.getUniformLocation("uMaxErosionDepth");
		this.uSuspensionRateLocation1 = this.shader.getUniformLocation("uSuspensionRate");
		this.uDepositionRateLocation1 = this.shader.getUniformLocation("uDepositionRate");
		this.uSedimentSofteningRateLocation1 = this.shader.getUniformLocation("uSedimentSofteningRate");
		this.uEvaporationRateLocation1 = this.shader.getUniformLocation("uEvaporationRate");
		Renderer.checkGLError();
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		Renderer.checkGLError();
		this.shader.setUniformI(this.uTerrainHeightTextureLocation1, 0);
		this.shader.setUniformI(this.uWaterHeightTextureLocation1, 1);
		this.shader.setUniformI(this.uWaterOutflowFluxTextureLocation1, 2);
		this.shader.setUniformI(this.uSedimentHardnessTextureLocation1, 3);
		this.shader.setUniformF(this.uDeltaTimeLocation1, erosionParams.deltaTime);
		this.shader.setUniformF(this.uPipeLengthLocation1, erosionParams.pipeLength);
		this.shader.setUniformF(this.uSedimentCapacityLocation1, erosionParams.sedimentCapacity);
		this.shader.setUniformF(this.uMaxErosionDepthLocation1, erosionParams.maxErosionDepth);
		this.shader.setUniformF(this.uSuspensionRateLocation1, erosionParams.suspensionRate);
		this.shader.setUniformF(this.uDepositionRateLocation1, erosionParams.depositionRate);
		this.shader.setUniformF(this.uSedimentSofteningRateLocation1, erosionParams.sedimentSofteningRate);
		this.shader.setUniformF(this.uEvaporationRateLocation1, erosionParams.evaporationRate);

		textures.heightMap.current().bind(0);
		textures.waterHeightMap.current().bind(1);
		textures.waterFluxMap.current().bind(2);
		textures.sedimentHardnessMap.current().bind(3);

		Renderer.checkGLError();
		framebuffer.setColorAttachment(textures.heightMap.next(), 0);
		framebuffer.setColorAttachment(textures.waterHeightMap.next(), 1);
		framebuffer.setColorAttachment(textures.waterVelocityMap, 2);
		framebuffer.setColorAttachment(textures.sedimentHardnessMap.next(), 3);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);
		Renderer.checkGLError();
	}

	finalizePass(_framebuffer: Framebuffer) {
		Renderer.checkGLError();
		_framebuffer.unsetColorAttachment(0);
		_framebuffer.unsetColorAttachment(1);
		_framebuffer.unsetColorAttachment(2);
		_framebuffer.unsetColorAttachment(3);
	}
}
