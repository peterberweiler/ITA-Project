import Global from "../Global";
import Renderer from "../Renderer";
import Shader from "../Shader";
import { MAX_LAYERS } from "./Layers";
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
	private uLayerWeightTexture: WebGLUniformLocation;
	private uAlphaBlendingEnabledLocation: WebGLUniformLocation;
	private uActiveLayersLocation: WebGLUniformLocation;
	private uLayerOrderLocation: WebGLUniformLocation[];
	private uMaterialLocation: number;

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
		this.uLayerWeightTexture = this.terrainShader.getUniformLocation("uLayerWeightTexture");
		this.uAlphaBlendingEnabledLocation = this.terrainShader.getUniformLocation("uAlphaBlendingEnabled");
		this.uActiveLayersLocation = this.terrainShader.getUniformLocation("uActiveLayers");
		this.uLayerOrderLocation = [];
		for (let i: number = 0; i < MAX_LAYERS / 4; i += 1) {
			this.uLayerOrderLocation[i] = this.terrainShader.getUniformLocation("uLayerOrder[" + i + "]");
		}
		this.uMaterialLocation = gl.getUniformBlockIndex(this.terrainShader.getId(), "MATERIAL_BUFFER");
		Renderer.checkGLError();
	}

	draw(drawParams: TerrainDrawParams) {
		const drawMode = gl.TRIANGLES;

		this.terrainShader.use();

		this.terrainShader.setUniformMat4(this.uTransformLocation, drawParams.viewProjection);
		this.terrainShader.setUniformF(this.uTexelSizeInMetersLocation, drawParams.texelSizeInMeters);
		this.terrainShader.setUniformF(this.uHeightScaleInMetersLocation, drawParams.heightScaleInMeters);
		this.terrainShader.setUniformVec3(this.uCamPosLocation, drawParams.camPos);
		this.terrainShader.setUniformUi(this.uAlphaBlendingEnabledLocation, drawParams.enableAlphaBlending ? 1 : 0);
		this.terrainShader.setUniformUi(this.uActiveLayersLocation, drawParams.activeLayers);

		for (let i: number = 0; i < MAX_LAYERS / 4; i += 1) {
			let values: number[] = [];
			for (let j: number = 0; j < 4; j += 1) {
				values[j] = drawParams.layerOrder[(i * 4) + j];
			}
			this.terrainShader.setUniformUvec4(this.uLayerOrderLocation[i], values);
		}

		Renderer.checkGLError();
		gl.uniformBlockBinding(this.terrainShader.getId(), this.uMaterialLocation, 0);
		gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, drawParams.materialUBO);
		Renderer.checkGLError();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.heightMap);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, drawParams.shadowMap);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, drawParams.weightMap);

		//TODO: this.surface.types[0].albedomap.texture.id

		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.terrainShader.setUniformI(this.uHeightmapTexture, 0);
		this.terrainShader.setUniformI(this.uShadowmapTexture, 1);
		this.terrainShader.setUniformI(this.uLayerWeightTexture, 2);
		this.terrainShader.setUniformI(this.uGridResolutionLocation, GRID_RESOLUTION);
		Renderer.checkGLError();
		gl.drawArrays(drawMode, 0, GRID_RESOLUTION * GRID_RESOLUTION * 6);
		Renderer.checkGLError();
	}
}
