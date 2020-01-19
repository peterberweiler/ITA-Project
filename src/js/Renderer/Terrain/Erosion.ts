import { gl } from "../Global";
import Renderer from "../Renderer";
import Shader from "../Shader";

const RESOLUTION: number = 1024;
const fullscreenTriangleVertSource = require("../../Shader/fullscreenTriangle.vs").default;
const fluxFragSource = require("../../Shader/erosionWaterOutflowFlux.fs").default;
const erosionFragSource = require("../../Shader/erosionSuspensionDeposition.fs").default;
const advectionFragSource = require("../../Shader/erosionSedimentAdvection.fs").default;

export default class TerrainShadows {
	private fluxShader: Shader;
	private uStateTextureLocation0: WebGLUniformLocation;
	private uWaterOutflowFluxTextureLocation0: WebGLUniformLocation;
	private uDeltaTimeLocation0: WebGLUniformLocation;
	private uRainRateLocation0: WebGLUniformLocation;
	private uPipeCrossSectionAreaLocation0: WebGLUniformLocation;
	private uPipeLengthLocation0: WebGLUniformLocation;

	private erosionShader: Shader;
	private uStateTextureLocation1: WebGLUniformLocation;
	private uWaterOutflowFluxTextureLocation1: WebGLUniformLocation;
	private uDeltaTimeLocation1: WebGLUniformLocation;
	private uPipeLengthLocation1: WebGLUniformLocation;
	private uSedimentCapacityLocation1: WebGLUniformLocation;
	private uMaxErosionDepthLocation1: WebGLUniformLocation;
	private uSuspensionRateLocation1: WebGLUniformLocation;
	private uDepositionRateLocation1: WebGLUniformLocation;
	private uSedimentSofteningRateLocation1: WebGLUniformLocation;
	private uEvaporationRateLocation1: WebGLUniformLocation;

	private advectionShader: Shader;
	private uStateTextureLocation2: WebGLUniformLocation;
	private uVelocityTextureLocation2: WebGLUniformLocation;
	private uDeltaTimeLocation2: WebGLUniformLocation;
	private uTexelSizeInMetersLocation2: WebGLUniformLocation;

	//private fbo0: WebGLFramebuffer | null;
	//private fbo1: WebGLFramebuffer | null;
	//private stateTexture0: Texture;
	//private stateTexture1: Texture;
	//private fluxTexture0: Texture;
	//private fluxTexture1: Texture;
	//private velocityTexture: Texture;

	constructor() {
		this.fluxShader = new Shader(fullscreenTriangleVertSource, fluxFragSource);
		this.uStateTextureLocation0 = this.fluxShader.getUniformLocation("uStateTexture");
		this.uWaterOutflowFluxTextureLocation0 = this.fluxShader.getUniformLocation("uWaterOutflowFluxTexture");
		this.uDeltaTimeLocation0 = this.fluxShader.getUniformLocation("uDeltaTime");
		this.uRainRateLocation0 = this.fluxShader.getUniformLocation("uRainRate");
		this.uPipeCrossSectionAreaLocation0 = this.fluxShader.getUniformLocation("uPipeCrossSectionArea");
		this.uPipeLengthLocation0 = this.fluxShader.getUniformLocation("uPipeLength");

		this.erosionShader = new Shader(fullscreenTriangleVertSource, erosionFragSource);
		this.uStateTextureLocation1 = this.erosionShader.getUniformLocation("uStateTexture");
		this.uWaterOutflowFluxTextureLocation1 = this.erosionShader.getUniformLocation("uWaterOutflowFluxTexture");
		this.uDeltaTimeLocation1 = this.erosionShader.getUniformLocation("uDeltaTime");
		this.uPipeLengthLocation1 = this.erosionShader.getUniformLocation("uPipeLength");
		this.uSedimentCapacityLocation1 = this.erosionShader.getUniformLocation("uSedimentCapacity");
		this.uMaxErosionDepthLocation1 = this.erosionShader.getUniformLocation("uMaxErosionDepth");
		this.uSuspensionRateLocation1 = this.erosionShader.getUniformLocation("uSuspensionRate");
		this.uDepositionRateLocation1 = this.erosionShader.getUniformLocation("uDepositionRate");
		this.uSedimentSofteningRateLocation1 = this.erosionShader.getUniformLocation("uSedimentSofteningRate");
		this.uEvaporationRateLocation1 = this.erosionShader.getUniformLocation("uEvaporationRate");

		this.advectionShader = new Shader(fullscreenTriangleVertSource, advectionFragSource);
		this.uStateTextureLocation2 = this.advectionShader.getUniformLocation("uStateTexture");
		this.uVelocityTextureLocation2 = this.advectionShader.getUniformLocation("uVelocityTexture");
		this.uDeltaTimeLocation2 = this.advectionShader.getUniformLocation("uDeltaTime");
		this.uTexelSizeInMetersLocation2 = this.advectionShader.getUniformLocation("uTexelSizeInMeters");

		Renderer.checkGLError();
	}

	update(heightMap: WebGLTexture | null) {
		const deltaTime = 0.02;
		const rainRate = 0.012;
		const pipeCrossSectionArea = 20.0;
		const pipeLength = 1.0;
		const sedimentCapacity = 1.0;
		const maxErosionDepth = 10.0;
		const suspensionRate = 0.5;
		const depositionRate = 1.0;
		const sedimentSofteningRate = 5.0;
		const evaporationRate = 0.015;

		gl.viewport(0, 0, RESOLUTION, RESOLUTION);

		// copy terrain height and water height to state
		{
			// TODO
		}

		// compute water flux
		{
			//gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo1);
			gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

			this.fluxShader.use();
			this.fluxShader.setUniformI(this.uStateTextureLocation0, 0);
			this.fluxShader.setUniformI(this.uWaterOutflowFluxTextureLocation0, 1);
			this.fluxShader.setUniformF(this.uDeltaTimeLocation0, deltaTime);
			this.fluxShader.setUniformF(this.uRainRateLocation0, rainRate);
			this.fluxShader.setUniformF(this.uPipeCrossSectionAreaLocation0, pipeCrossSectionArea);
			this.fluxShader.setUniformF(this.uPipeLengthLocation0, pipeLength);

			this.uStateTextureLocation0 = this.fluxShader.getUniformLocation("uStateTexture");
			this.uWaterOutflowFluxTextureLocation0 = this.fluxShader.getUniformLocation("uWaterOutflowFluxTexture");
			this.uDeltaTimeLocation0 = this.fluxShader.getUniformLocation("uDeltaTime");
			this.uRainRateLocation0 = this.fluxShader.getUniformLocation("uRainRate");
			this.uPipeCrossSectionAreaLocation0 = this.fluxShader.getUniformLocation("uPipeCrossSectionArea");
			this.uPipeLengthLocation0 = this.fluxShader.getUniformLocation("uPipeLength");

			gl.activeTexture(gl.TEXTURE0);
			//gl.bindTexture(gl.TEXTURE_2D, this.stateTexture0.id);

			gl.activeTexture(gl.TEXTURE1);
			//gl.bindTexture(gl.TEXTURE_2D, this.fluxTexture0.id); // TODO : proper cycling

			Renderer.checkGLError();
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			Renderer.checkGLError();
		}

		// compute sediment suspension and deposition
		{
			//gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo0);
			gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT2]);

			this.erosionShader.use();
			this.erosionShader.setUniformI(this.uStateTextureLocation1, 0);
			this.erosionShader.setUniformI(this.uWaterOutflowFluxTextureLocation1, 1);
			this.erosionShader.setUniformF(this.uDeltaTimeLocation1, deltaTime);
			this.erosionShader.setUniformF(this.uPipeLengthLocation1, pipeLength);
			this.erosionShader.setUniformF(this.uSedimentCapacityLocation1, sedimentCapacity);
			this.erosionShader.setUniformF(this.uMaxErosionDepthLocation1, maxErosionDepth);
			this.erosionShader.setUniformF(this.uSuspensionRateLocation1, suspensionRate);
			this.erosionShader.setUniformF(this.uDepositionRateLocation1, depositionRate);
			this.erosionShader.setUniformF(this.uSedimentSofteningRateLocation1, sedimentSofteningRate);
			this.erosionShader.setUniformF(this.uEvaporationRateLocation1, evaporationRate);

			gl.activeTexture(gl.TEXTURE0);
			//gl.bindTexture(gl.TEXTURE_2D, this.stateTexture1.id);

			gl.activeTexture(gl.TEXTURE1);
			//gl.bindTexture(gl.TEXTURE_2D, this.fluxTexture1.id); // TODO : proper cycling

			Renderer.checkGLError();
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			Renderer.checkGLError();
		}

		// displace sediment
		{
			//gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo1);
			gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

			this.advectionShader.use();
			this.advectionShader.setUniformI(this.uStateTextureLocation2, 0);
			this.advectionShader.setUniformI(this.uVelocityTextureLocation2, 1);
			this.advectionShader.setUniformF(this.uDeltaTimeLocation2, deltaTime);
			this.advectionShader.setUniformF(this.uTexelSizeInMetersLocation2, pipeLength);

			gl.activeTexture(gl.TEXTURE0);
			//gl.bindTexture(gl.TEXTURE_2D, this.stateTexture0.id);

			gl.activeTexture(gl.TEXTURE1);
			//gl.bindTexture(gl.TEXTURE_2D, this.velocityTexture.id); // TODO : proper cycling

			Renderer.checkGLError();
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			Renderer.checkGLError();
		}

		// copy terrain and water height from state texture
		{
			// TODO
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
}
