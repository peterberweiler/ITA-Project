import Global from "../Global";
import Shader from "../Shader";
import TerrainDrawParams from "./TerrainDrawParams";

let gl: WebGL2RenderingContext;
const GRID_RESOLUTION: number = 1024;
const fragSource = require("../../Shader/terrain.fs").default;
const vertSource = require("../../Shader/terrainGrid.vs").default;

export default class TerrainUniformGridMesh {
	private terrainShader: Shader;
	private uTransformLocation: WebGLUniformLocation;
	private uTexelSizeInMetersLocation: WebGLUniformLocation;
	private uHeightScaleInMetersLocation: WebGLUniformLocation;
	private uGridResolutionLocation: WebGLUniformLocation;
	private uCamPosLocation: WebGLUniformLocation;
	private uHeightmapTexture: WebGLUniformLocation;
	private uShadowmapTexture: WebGLUniformLocation;
	private uSurfacemapTexture: WebGLUniformLocation;

	constructor() {
		gl = Global.gl;

		this.terrainShader = new Shader(vertSource, fragSource);
		this.uTransformLocation = this.terrainShader.getUniformLocation("uTransform");
		this.uTexelSizeInMetersLocation = this.terrainShader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation = this.terrainShader.getUniformLocation("uHeightScaleInMeters");
		this.uGridResolutionLocation = this.terrainShader.getUniformLocation("uGridResolution");
		this.uCamPosLocation = this.terrainShader.getUniformLocation("uCamPos");
		this.uHeightmapTexture = this.terrainShader.getUniformLocation("uHeightmapTexture");
		this.uShadowmapTexture = this.terrainShader.getUniformLocation("uShadowmapTexture");
		this.uSurfacemapTexture = this.terrainShader.getUniformLocation("uSurfacemapTexture");
	}

	draw(drawParams: TerrainDrawParams) {
		const drawMode = gl.TRIANGLES;

		this.terrainShader.use();

		this.terrainShader.setUniformMat4(this.uTransformLocation, drawParams.viewProjection);
		this.terrainShader.setUniformF(this.uTexelSizeInMetersLocation, drawParams.texelSizeInMeters);
		this.terrainShader.setUniformF(this.uHeightScaleInMetersLocation, drawParams.heightScaleInMeters);
		this.terrainShader.setUniformVec3(this.uCamPosLocation, drawParams.camPos);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.heightMap);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.shadowMap);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.weightMap);

		//TODO: this.surface.types[0].albedomap.texture.id

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.terrainShader.setUniformI(this.uHeightmapTexture, 0);
		this.terrainShader.setUniformI(this.uShadowmapTexture, 1);
		this.terrainShader.setUniformI(this.uSurfacemapTexture, 2);
		this.terrainShader.setUniformI(this.uGridResolutionLocation, GRID_RESOLUTION);

		gl.drawArrays(drawMode, 0, GRID_RESOLUTION * GRID_RESOLUTION * 6);
	}
}
