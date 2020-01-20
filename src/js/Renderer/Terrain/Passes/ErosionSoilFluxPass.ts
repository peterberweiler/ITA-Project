import Framebuffer from "../../Framebuffer";
import { erosionParams, gl, TextureBundle } from "../../Global";
import { Pass } from "./Passes";

const fluxFragSource = require("../../../Shader/erosionSoilOutflowFlux.fs").default;

export class ErosionSoilFluxPass extends Pass {
	private uTerrainHeightTextureLocation: WebGLUniformLocation;
	private uSedimentHardnessTextureLocation: WebGLUniformLocation;
	private uDeltaTimeLocation: WebGLUniformLocation;
	private uCellSizeLocation: WebGLUniformLocation;
	private uThermalErosionRateLocation: WebGLUniformLocation;
	private uTalusAngleTangentCoeffLocation: WebGLUniformLocation;
	private uTalusAngleTangentBiasLocation: WebGLUniformLocation;

	constructor() {
		super(fluxFragSource);
		this.uTerrainHeightTextureLocation = this.shader.getUniformLocation("uTerrainHeightTexture");
		this.uSedimentHardnessTextureLocation = this.shader.getUniformLocation("uSedimentHardnessTexture");
		this.uDeltaTimeLocation = this.shader.getUniformLocation("uDeltaTime");
		this.uCellSizeLocation = this.shader.getUniformLocation("uCellSize");
		this.uThermalErosionRateLocation = this.shader.getUniformLocation("uThermalErosionRate");
		this.uTalusAngleTangentCoeffLocation = this.shader.getUniformLocation("uTalusAngleTangentCoeff");
		this.uTalusAngleTangentBiasLocation = this.shader.getUniformLocation("uTalusAngleTangentBias");
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		this.shader.setUniformI(this.uTerrainHeightTextureLocation, 0);
		this.shader.setUniformI(this.uSedimentHardnessTextureLocation, 1);
		this.shader.setUniformF(this.uDeltaTimeLocation, erosionParams.deltaTime);
		this.shader.setUniformF(this.uCellSizeLocation, erosionParams.pipeLength);
		this.shader.setUniformF(this.uThermalErosionRateLocation, erosionParams.thermalErosionRate);
		this.shader.setUniformF(this.uTalusAngleTangentCoeffLocation, erosionParams.talusAngleTangentCoeff);
		this.shader.setUniformF(this.uTalusAngleTangentBiasLocation, erosionParams.talusAngleTangentBias);

		textures.heightMap.current().bind(0);
		textures.sedimentHardnessMap.current().bind(1);

		framebuffer.setColorAttachment(textures.soilFluxPlusMap, 0);
		framebuffer.setColorAttachment(textures.soilFluxCrossMap, 1);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	}

	finalizePass(_framebuffer: Framebuffer) {
		_framebuffer.unsetColorAttachment(0);
		_framebuffer.unsetColorAttachment(1);
	}
}
