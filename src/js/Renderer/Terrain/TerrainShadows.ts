import { mat4, vec3 } from "gl-matrix";
import { gl } from "../Global";
import Renderer from "../Renderer";
import Shader from "../Shader";
import Texture from "../Texture";

const GRID_RESOLUTION: number = 1024;
const SHADOW_MAP_RESOLUTION: number = 2048;
const TERRAIN_SHADOW_MAP_RESOLUTION: number = 1024;
const fragSource = require("../../Shader/terrainShadows.fs").default;
const vertSource = require("../../Shader/terrainGrid.vs").default;
const terrainShadowHeightFragSource = require("../../Shader/terrainShadowHeight.fs").default;
const terrainShadowHeightVertSource = require("../../Shader/fullscreenTriangle.vs").default;

export default class TerrainShadows {
	private terrainShadowsShader: Shader;
	private uTransformLocation: WebGLUniformLocation;
	private uTexelSizeInMetersLocation: WebGLUniformLocation;
	private uHeightScaleInMetersLocation: WebGLUniformLocation;
	private uGridResolutionLocation: WebGLUniformLocation;
	private uHeightMapLocation: WebGLUniformLocation;

	private terrainShadowHeightShader: Shader;
	private uTexelSizeInMetersLocation2: WebGLUniformLocation;
	private uHeightScaleInMetersLocation2: WebGLUniformLocation;
	private uHeightMapLocation2: WebGLUniformLocation;
	private uShadowMapLocation2: WebGLUniformLocation;
	private uShadowMatrixLocation2: WebGLUniformLocation;

	private shadowMatrix: mat4;

	private fbo: WebGLFramebuffer | null;
	private depthAttachment: Texture;
	private shadowMapAttachment: Texture;

	private shadowHeightFbo: WebGLFramebuffer | null;
	private shadowHeightMapAttachment: Texture;

	constructor() {
		this.terrainShadowsShader = new Shader(vertSource, fragSource);
		this.uTransformLocation = this.terrainShadowsShader.getUniformLocation("uTransform");
		this.uTexelSizeInMetersLocation = this.terrainShadowsShader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation = this.terrainShadowsShader.getUniformLocation("uHeightScaleInMeters");
		this.uGridResolutionLocation = this.terrainShadowsShader.getUniformLocation("uGridResolution");
		this.uHeightMapLocation = this.terrainShadowsShader.getUniformLocation("uHeightmapTexture");

		this.terrainShadowHeightShader = new Shader(terrainShadowHeightVertSource, terrainShadowHeightFragSource);
		this.uTexelSizeInMetersLocation2 = this.terrainShadowHeightShader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation2 = this.terrainShadowHeightShader.getUniformLocation("uHeightScaleInMeters");
		this.uHeightMapLocation2 = this.terrainShadowHeightShader.getUniformLocation("uHeightMap");
		this.uShadowMapLocation2 = this.terrainShadowHeightShader.getUniformLocation("uShadowMap");
		this.uShadowMatrixLocation2 = this.terrainShadowHeightShader.getUniformLocation("uShadowMatrix");

		// shadow map rendering fbo
		{
			this.fbo = gl.createFramebuffer();
			this.depthAttachment = new Texture();
			this.depthAttachment.bind(0);
			gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, SHADOW_MAP_RESOLUTION, SHADOW_MAP_RESOLUTION);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.GREATER);

			this.shadowMapAttachment = new Texture();
			this.shadowMapAttachment.bind(0);
			gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, SHADOW_MAP_RESOLUTION, SHADOW_MAP_RESOLUTION);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthAttachment.id, 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowMapAttachment.id, 0);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}

		// shadow height fbo
		{
			this.shadowHeightFbo = gl.createFramebuffer();
			this.shadowHeightMapAttachment = new Texture();
			this.shadowHeightMapAttachment.bind(0);
			gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, TERRAIN_SHADOW_MAP_RESOLUTION, TERRAIN_SHADOW_MAP_RESOLUTION);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowHeightFbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowHeightMapAttachment.id, 0);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}

		Renderer.checkGLError();

		this.shadowMatrix = mat4.identity(mat4.create());
	}

	update(transform: mat4, texelSizeInMeters: number, heightScaleInMeters: number, lightDir: vec3, heightMap: WebGLTexture | null) {
		// update shadow matrix
		{
			let viewMatrix = mat4.create();
			let lightPos = vec3.create();
			let distance = texelSizeInMeters * GRID_RESOLUTION;
			let center = vec3.clone([texelSizeInMeters * GRID_RESOLUTION * 0.5, 0.0, texelSizeInMeters * GRID_RESOLUTION * 0.5]);
			vec3.multiply(lightPos, lightDir, [distance, distance, distance]);
			vec3.add(lightPos, lightPos, center);
			mat4.lookAt(viewMatrix, lightPos, center, [0, 1, 0]);
			let projectionMatrix = mat4.create();
			let orthoExtent = texelSizeInMeters * GRID_RESOLUTION * 0.8;
			mat4.ortho(projectionMatrix, -orthoExtent, orthoExtent, -orthoExtent, orthoExtent, 0.01, texelSizeInMeters * GRID_RESOLUTION * 5);
			mat4.multiply(this.shadowMatrix, projectionMatrix, viewMatrix);
		}

		// draw shadow map
		{
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
			gl.viewport(0, 0, SHADOW_MAP_RESOLUTION, SHADOW_MAP_RESOLUTION);
			gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
			gl.clearBufferfv(gl.DEPTH, 0, [1.0]);
			gl.clearBufferfv(gl.COLOR, 0, [1.0, 0.0, 0.0, 1.0]);

			this.terrainShadowsShader.use();

			this.terrainShadowsShader.setUniformMat4(this.uTransformLocation, this.shadowMatrix);
			this.terrainShadowsShader.setUniformF(this.uTexelSizeInMetersLocation, texelSizeInMeters);
			this.terrainShadowsShader.setUniformF(this.uHeightScaleInMetersLocation, heightScaleInMeters);
			this.terrainShadowsShader.setUniformI(this.uHeightMapLocation, 0);
			this.terrainShadowsShader.setUniformI(this.uGridResolutionLocation, GRID_RESOLUTION);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, heightMap);

			Renderer.checkGLError();
			gl.enable(gl.CULL_FACE);
			gl.cullFace(gl.FRONT);
			gl.drawArrays(gl.TRIANGLES, 0, (GRID_RESOLUTION + 2) * (GRID_RESOLUTION + 2) * 6);
			gl.disable(gl.CULL_FACE);
			Renderer.checkGLError();
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}

		// generate terrain shadow height map
		{
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowHeightFbo);
			gl.viewport(0, 0, TERRAIN_SHADOW_MAP_RESOLUTION, TERRAIN_SHADOW_MAP_RESOLUTION);
			gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

			this.terrainShadowHeightShader.use();

			this.terrainShadowHeightShader.setUniformMat4(this.uShadowMatrixLocation2, this.shadowMatrix);
			this.terrainShadowHeightShader.setUniformF(this.uTexelSizeInMetersLocation2, texelSizeInMeters);
			this.terrainShadowHeightShader.setUniformF(this.uHeightScaleInMetersLocation2, heightScaleInMeters);
			this.terrainShadowHeightShader.setUniformI(this.uHeightMapLocation2, 0);
			this.terrainShadowHeightShader.setUniformI(this.uShadowMapLocation2, 1);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, heightMap);

			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.shadowMapAttachment.id);

			Renderer.checkGLError();
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			Renderer.checkGLError();
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	}

	getShadowMap() {
		return this.shadowHeightMapAttachment;
	}

	getShadowMatrix() {
		return this.shadowMatrix;
	}
}
