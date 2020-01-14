import { mat4, vec3 } from "gl-matrix";
import { gl } from "./Global";
import { loadOBJ } from "./Loaders/SimpleOBJLoader";
import Shader from "./Shader";
import Texture from "./Texture";

const fragSource = require("../Shader/decorationObjects.fs").default;
const vertSource = require("../Shader/decorationObjects.vs").default;
const spruceBranchesOBJSource = require("../../data/spruce_tree/spruce_branches.obj").default;
const spruceTrunkOBJSource = require("../../data/spruce_tree/spruce_trunk.obj").default;

export default class DecorationObjects {
	private decorationObjectsShader: Shader;
	private uViewProjectionMatrixLocation: WebGLUniformLocation;
	private uPositionLocation: WebGLUniformLocation;
	private uTexelSizeInMetersLocation: WebGLUniformLocation;
	private uHeightScaleInMetersLocation: WebGLUniformLocation;
	private uHeightmapTextureLocation: WebGLUniformLocation;
	private uCamPosLocation: WebGLUniformLocation;
	private uLightDirLocation: WebGLUniformLocation;
	private uAlbedoTextureLocation: WebGLUniformLocation;
	private treeVao: WebGLBuffer;
	private treeVbo: WebGLBuffer;
	private treeIbo: WebGLBuffer;

	private treeBranchesVertexOffset: number;
	private treeBranchesIndexOffset: number;
	private treeBranchesIndexCount: number;
	private treeTrunkVertexOffset: number;
	private treeTrunkIndexOffset: number;
	private treeTrunkIndexCount: number;
	private treeBranchesTexture: Texture;
	private treeTrunkTexture: Texture;

	private treeCount = 1024 * 4;
	private randomPositions: number[] = [];

	constructor() {
		this.decorationObjectsShader = new Shader(vertSource, fragSource);
		this.uViewProjectionMatrixLocation = this.decorationObjectsShader.getUniformLocation("uViewProjectionMatrix");
		this.uPositionLocation = this.decorationObjectsShader.getUniformLocation("uPosition");
		this.uTexelSizeInMetersLocation = this.decorationObjectsShader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation = this.decorationObjectsShader.getUniformLocation("uHeightScaleInMeters");
		this.uHeightmapTextureLocation = this.decorationObjectsShader.getUniformLocation("uHeightmapTexture");
		this.uCamPosLocation = this.decorationObjectsShader.getUniformLocation("uCamPos");
		this.uLightDirLocation = this.decorationObjectsShader.getUniformLocation("uLightDir");
		this.uAlbedoTextureLocation = this.decorationObjectsShader.getUniformLocation("uAlbedoTexture");

		const vertexSize = (3 + 3 + 2);

		// tree model
		{
			let vertexCount = 0;
			let indexCount = 0;
			let treeVertexBuffer: number[] = [];
			let treeIndexBuffer: number[] = [];

			// branches
			{
				this.treeBranchesVertexOffset = vertexCount / vertexSize;
				this.treeBranchesIndexOffset = indexCount;

				const vertexOffset = this.treeBranchesVertexOffset;

				let treeBranchesMesh = loadOBJ(spruceBranchesOBJSource, true, true);

				treeBranchesMesh.vertexBuffer.forEach(function (value) {
					vertexCount++;
					treeVertexBuffer.push(value);
				});
				treeBranchesMesh.indexBuffer.forEach(function (value) {
					indexCount++;
					treeIndexBuffer.push(value + vertexOffset);
				});

				this.treeBranchesIndexCount = indexCount - this.treeBranchesIndexOffset;
			}

			// trunk
			{
				this.treeTrunkVertexOffset = vertexCount / vertexSize;
				this.treeTrunkIndexOffset = indexCount;

				const vertexOffset = this.treeTrunkVertexOffset;

				let treeTrunkMesh = loadOBJ(spruceTrunkOBJSource, true, true);

				treeTrunkMesh.vertexBuffer.forEach(function (value) {
					vertexCount++;
					treeVertexBuffer.push(value);
				});
				treeTrunkMesh.indexBuffer.forEach(function (value) {
					indexCount++;
					treeIndexBuffer.push(value + vertexOffset);
				});

				this.treeTrunkIndexCount = indexCount - this.treeTrunkIndexOffset;
			}

			const vaoBuffer = gl.createVertexArray();
			const vertexBuffer = gl.createBuffer();
			const indexBuffer = gl.createBuffer();

			if (!vertexBuffer || !indexBuffer || !vaoBuffer) { throw new Error("Couldn't create vertex or indexbuffer."); }

			this.treeVao = vaoBuffer;
			this.treeVbo = vertexBuffer;
			this.treeIbo = indexBuffer;

			gl.bindVertexArray(this.treeVao);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.treeVbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(treeVertexBuffer), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.treeIbo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(treeIndexBuffer), gl.STATIC_DRAW);

			// vertex attributes
			gl.enableVertexAttribArray(0);
			gl.enableVertexAttribArray(1);
			gl.enableVertexAttribArray(2);
			gl.vertexAttribPointer(this.decorationObjectsShader.getAttributeLocation("aPosition"), 3, gl.FLOAT, false, vertexSize * 4, 0);
			gl.vertexAttribPointer(this.decorationObjectsShader.getAttributeLocation("aNormal"), 3, gl.FLOAT, false, vertexSize * 4, 3 * 4);
			gl.vertexAttribPointer(this.decorationObjectsShader.getAttributeLocation("aTexCoord"), 2, gl.FLOAT, false, vertexSize * 4, 6 * 4);

			gl.bindVertexArray(null);

			this.treeBranchesTexture = Texture.fromRGBAImage("/data/spruce_tree/spruce_branches.png");
			this.treeTrunkTexture = Texture.fromRGBImage("/data/spruce_tree/spruce_trunk.png");
		}

		for (let i = 0; i < this.treeCount; ++i) {
			this.randomPositions.push(Math.random() * 1024);
			this.randomPositions.push(Math.random() * 1024);
		}
	}

	draw(viewProjection: mat4, texelSizeInMeters: number, heightScaleInMeters: number, camPos: vec3 | number[], sunDir: vec3 | number[], heightMap: WebGLTexture) {
		this.decorationObjectsShader.use();

		this.decorationObjectsShader.setUniformMat4(this.uViewProjectionMatrixLocation, viewProjection);
		this.decorationObjectsShader.setUniformF(this.uTexelSizeInMetersLocation, texelSizeInMeters);
		this.decorationObjectsShader.setUniformF(this.uHeightScaleInMetersLocation, heightScaleInMeters);
		this.decorationObjectsShader.setUniformI(this.uHeightmapTextureLocation, 0);
		this.decorationObjectsShader.setUniformVec3(this.uCamPosLocation, camPos);
		this.decorationObjectsShader.setUniformVec3(this.uLightDirLocation, sunDir);
		this.decorationObjectsShader.setUniformI(this.uAlbedoTextureLocation, 1);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, heightMap);

		gl.bindVertexArray(this.treeVao);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.treeBranchesTexture.id);

		for (let i = 0; i < this.treeCount; ++i) {
			this.decorationObjectsShader.setUniformVec2(this.uPositionLocation, [this.randomPositions[i * 2], this.randomPositions[(i * 2) + 1]]);
			gl.drawElements(gl.TRIANGLES, this.treeBranchesIndexCount, gl.UNSIGNED_INT, this.treeBranchesIndexOffset * 4);
		}

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.treeTrunkTexture.id);

		for (let i = 0; i < this.treeCount; ++i) {
			this.decorationObjectsShader.setUniformVec2(this.uPositionLocation, [this.randomPositions[i * 2], this.randomPositions[(i * 2) + 1]]);
			gl.drawElements(gl.TRIANGLES, this.treeTrunkIndexCount, gl.UNSIGNED_INT, this.treeTrunkIndexOffset * 4);
		}

		gl.bindVertexArray(null);
	}
}
