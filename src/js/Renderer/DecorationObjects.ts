import { mat4, vec3 } from "gl-matrix";
import { gl } from "./Global";
import { loadOBJ } from "./Loaders/SimpleOBJLoader";
import Shader from "./Shader";

const fragSource = require("../Shader/decorationObjects.fs").default;
const vertSource = require("../Shader/decorationObjects.vs").default;
const spruceBranchesOBJSource = require("../../data/spruce_tree/spruce_branches.obj").default;
const spruceTrunkOBJSource = require("../../data/spruce_tree/spruce_trunk.obj").default;

export default class DecorationObjects {
	private decorationObjectsShader: Shader;
	private uViewProjectionMatrixLocation: WebGLUniformLocation;
	private uTexelSizeInMetersLocation: WebGLUniformLocation;
	private uHeightScaleInMetersLocation: WebGLUniformLocation;
	private uHeightmapTextureLocation: WebGLUniformLocation;
	private uCamPosLocation: WebGLUniformLocation;
	private uLightDirLocation: WebGLUniformLocation;
	private uAlbedoTextureLocation: WebGLUniformLocation;
	private uTerrainShadowTextureLocation: WebGLUniformLocation;
	private treeVao: WebGLBuffer;
	private treeVbo: WebGLBuffer;
	private treeIbo: WebGLBuffer;
	private treePositionsVbo: WebGLBuffer;

	private treeBranchesVertexOffset: number;
	private treeBranchesIndexOffset: number;
	private treeBranchesIndexCount: number;
	private treeTrunkVertexOffset: number;
	private treeTrunkIndexOffset: number;
	private treeTrunkIndexCount: number;
	//private treeBranchesTexture: Texture;
	//private treeTrunkTexture: Texture;
	private treeBranchesTexture2: WebGLTexture | null;
	private treeTrunkTexture2: WebGLTexture | null;

	private treeCount = 0;

	constructor() {
		this.decorationObjectsShader = new Shader(vertSource, fragSource);
		this.uViewProjectionMatrixLocation = this.decorationObjectsShader.getUniformLocation("uViewProjectionMatrix");
		this.uTexelSizeInMetersLocation = this.decorationObjectsShader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation = this.decorationObjectsShader.getUniformLocation("uHeightScaleInMeters");
		this.uHeightmapTextureLocation = this.decorationObjectsShader.getUniformLocation("uHeightmapTexture");
		this.uCamPosLocation = this.decorationObjectsShader.getUniformLocation("uCamPos");
		this.uLightDirLocation = this.decorationObjectsShader.getUniformLocation("uLightDir");
		this.uAlbedoTextureLocation = this.decorationObjectsShader.getUniformLocation("uAlbedoTexture");
		this.uTerrainShadowTextureLocation = this.decorationObjectsShader.getUniformLocation("uTerrainShadowTexture");

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
			const treePositionsBuffer = gl.createBuffer();

			if (!vertexBuffer || !indexBuffer || !vaoBuffer || !treePositionsBuffer) { throw new Error("Couldn't create vertex or indexbuffer."); }

			this.treeVao = vaoBuffer;
			this.treeVbo = vertexBuffer;
			this.treeIbo = indexBuffer;
			this.treePositionsVbo = treePositionsBuffer;

			gl.bindVertexArray(this.treeVao);

			// index buffer
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.treeIbo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(treeIndexBuffer), gl.STATIC_DRAW);

			// vertex buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, this.treeVbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(treeVertexBuffer), gl.STATIC_DRAW);

			// vertex attributes
			gl.enableVertexAttribArray(0);
			gl.enableVertexAttribArray(1);
			gl.enableVertexAttribArray(2);
			gl.vertexAttribPointer(this.decorationObjectsShader.getAttributeLocation("aPosition"), 3, gl.FLOAT, false, vertexSize * 4, 0);
			gl.vertexAttribPointer(this.decorationObjectsShader.getAttributeLocation("aNormal"), 3, gl.FLOAT, false, vertexSize * 4, 3 * 4);
			gl.vertexAttribPointer(this.decorationObjectsShader.getAttributeLocation("aTexCoord"), 2, gl.FLOAT, false, vertexSize * 4, 6 * 4);

			// positions buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, this.treePositionsVbo);
			//gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.randomPositions), gl.DYNAMIC_DRAW);

			// attribute
			gl.enableVertexAttribArray(3);
			gl.vertexAttribPointer(this.decorationObjectsShader.getAttributeLocation("aObjectPosition"), 2, gl.FLOAT, false, 2 * 4, 0);
			gl.vertexAttribDivisor(this.decorationObjectsShader.getAttributeLocation("aObjectPosition"), 1);

			gl.bindVertexArray(null);

			this.treeBranchesTexture2 = this.loadTexture("data/spruce_tree/spruce_branches.png");
			this.treeTrunkTexture2 = this.loadTexture("data/spruce_tree/spruce_trunk.jpeg");
		}

		this.updateTreePositions(new Float32Array());
	}

	draw(viewProjection: mat4, texelSizeInMeters: number, heightScaleInMeters: number, camPos: vec3 | number[], sunDir: vec3 | number[], heightMap: WebGLTexture, terrainShadowMap: WebGLTexture) {
		this.decorationObjectsShader.use();

		this.decorationObjectsShader.setUniformMat4(this.uViewProjectionMatrixLocation, viewProjection);
		this.decorationObjectsShader.setUniformF(this.uTexelSizeInMetersLocation, texelSizeInMeters);
		this.decorationObjectsShader.setUniformF(this.uHeightScaleInMetersLocation, heightScaleInMeters);
		this.decorationObjectsShader.setUniformI(this.uHeightmapTextureLocation, 0);
		this.decorationObjectsShader.setUniformVec3(this.uCamPosLocation, camPos);
		this.decorationObjectsShader.setUniformVec3(this.uLightDirLocation, sunDir);
		this.decorationObjectsShader.setUniformI(this.uAlbedoTextureLocation, 2);
		this.decorationObjectsShader.setUniformI(this.uTerrainShadowTextureLocation, 1);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, heightMap);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, terrainShadowMap);

		if (this.treeCount !== 0) {
			gl.bindVertexArray(this.treeVao);

			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.treeBranchesTexture2);

			gl.drawElementsInstanced(gl.TRIANGLES, this.treeBranchesIndexCount, gl.UNSIGNED_INT, this.treeBranchesIndexOffset * 4, this.treeCount);

			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.treeTrunkTexture2);

			gl.drawElementsInstanced(gl.TRIANGLES, this.treeTrunkIndexCount, gl.UNSIGNED_INT, this.treeTrunkIndexOffset * 4, this.treeCount);

			gl.bindVertexArray(null);
		}
	}

	updateTreePositions(positions: Float32Array) {
		this.treeCount = positions.length / 2;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.treePositionsVbo);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
	}

	//
	// Initialize a texture and load an image.
	// When the image finished loading copy it into the texture.
	//
	loadTexture(url: string) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 1;
		const height = 1;
		const border = 0;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			width, height, border, srcFormat, srcType,
			pixel);

		const image = new Image();
		image.onload = function () {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
				srcFormat, srcType, image);

			let isPowerOf2 = (value: number) => {
				return (value & (value - 1)) === 0;
			};

			// WebGL1 has different requirements for power of 2 images
			// vs non power of 2 images so check if the image is a
			// power of 2 in both dimensions.
			if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
				// Yes, it's a power of 2. Generate mips.
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			}
			else {
				// No, it's not a power of 2. Turn off mips and set
				// wrapping to clamp to edge
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
		};
		image.src = url;

		return texture;
	}
}
