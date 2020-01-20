import { gl } from "../Global";
import Renderer from "../Renderer";
import Shader from "../Shader";
import TerrainDrawParams from "./TerrainDrawParams";

const GRID_RESOLUTION: number = 1024;
const fragSource = require("../../Shader/water.fs").default;
const vertSource = require("../../Shader/water.vs").default;

export default class WaterGridMesh {
	private waterShader: Shader;
	private uTransformLocation: WebGLUniformLocation;
	private uTexelSizeInMetersLocation: WebGLUniformLocation;
	private uHeightScaleInMetersLocation: WebGLUniformLocation;
	private uGridResolutionLocation: WebGLUniformLocation;
	private uTerrainHeightTextureLocation: WebGLUniformLocation;
	private uWaterHeightTextureLocation: WebGLUniformLocation;
	private uCamPosLocation: WebGLUniformLocation;
	private uLightDirLocation: WebGLUniformLocation;
	private uTerrainShadowTextureLocation: WebGLUniformLocation;

	constructor() {
		this.waterShader = new Shader(vertSource, fragSource);
		this.uTransformLocation = this.waterShader.getUniformLocation("uTransform");
		this.uTexelSizeInMetersLocation = this.waterShader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation = this.waterShader.getUniformLocation("uHeightScaleInMeters");
		this.uGridResolutionLocation = this.waterShader.getUniformLocation("uGridResolution");
		this.uTerrainHeightTextureLocation = this.waterShader.getUniformLocation("uTerrainHeightTexture");
		this.uWaterHeightTextureLocation = this.waterShader.getUniformLocation("uWaterHeightTexture");
		this.uCamPosLocation = this.waterShader.getUniformLocation("uCamPos");
		this.uLightDirLocation = this.waterShader.getUniformLocation("uLightDir");
		this.uTerrainShadowTextureLocation = this.waterShader.getUniformLocation("uTerrainShadowTexture");

		Renderer.checkGLError();
	}

	draw(drawParams: TerrainDrawParams) {
		const drawMode = gl.TRIANGLES;

		this.waterShader.use();

		this.waterShader.setUniformMat4(this.uTransformLocation, drawParams.viewProjection);
		this.waterShader.setUniformF(this.uTexelSizeInMetersLocation, drawParams.texelSizeInMeters);
		this.waterShader.setUniformF(this.uHeightScaleInMetersLocation, drawParams.heightScaleInMeters);
		this.waterShader.setUniformI(this.uGridResolutionLocation, GRID_RESOLUTION);
		this.waterShader.setUniformI(this.uTerrainHeightTextureLocation, 0);
		this.waterShader.setUniformI(this.uWaterHeightTextureLocation, 1);
		this.waterShader.setUniformI(this.uTerrainShadowTextureLocation, 2);
		this.waterShader.setUniformVec3(this.uCamPosLocation, drawParams.camPos);
		this.waterShader.setUniformVec3(this.uLightDirLocation, drawParams.lightDir);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.heightMap);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.debugTexture);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.shadowMap2);

		Renderer.checkGLError();
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.blendEquation(gl.FUNC_ADD);
		gl.cullFace(gl.FRONT);
		gl.drawArrays(drawMode, 0, (GRID_RESOLUTION + 2) * (GRID_RESOLUTION + 2) * 6);
		gl.disable(gl.BLEND);
		gl.disable(gl.CULL_FACE);
		Renderer.checkGLError();
	}
}
