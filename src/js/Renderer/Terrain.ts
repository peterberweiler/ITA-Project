import { mat2, mat4, vec3 } from "gl-matrix";
import Global from "./Global";
import Shader from "./Shader";
import Texture from "./Texture";

let gl: WebGL2RenderingContext;
const TILE_RESOLUTION: number = 32;
const TILE_VERTEX_RESOLUTION: number = TILE_RESOLUTION + 1;
const CLIPMAP_RESOLUTION = (TILE_RESOLUTION * 4) + 1;
const CLIPMAP_VERTEX_RESOLUTION = CLIPMAP_RESOLUTION + 1;
const NUM_CLIPMAP_LEVELS = 5;
const fragSource = require("../Shader/terrain.fs").default;
const vertSource = require("../Shader/terrain.vs").default;

export default class Terrain {
	private terrainShader: Shader;
	private uTransformLocation: WebGLUniformLocation;
	private uScaleLocation: WebGLUniformLocation;
	private uBiasLocation: WebGLUniformLocation;
	private uRotationLocation: WebGLUniformLocation;
	private uColorLocation: WebGLUniformLocation;
	private vao: WebGLBuffer;
	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;
	private tileIndexCount: number = 0;
	private fillerIndexCount: number = 0;
	private crossIndexCount: number = 0;
	private trimIndexCount: number = 0;
	private rotations: mat2[];
	private uHeightmapTexture: WebGLUniformLocation;
	private heightmapTexture: Texture;

	constructor() {
		gl = Global.gl;

		this.terrainShader = new Shader(vertSource, fragSource);
		this.uTransformLocation = this.terrainShader.getUniformLocation("uTransform");
		this.uScaleLocation = this.terrainShader.getUniformLocation("uScale");
		this.uBiasLocation = this.terrainShader.getUniformLocation("uBias");
		this.uRotationLocation = this.terrainShader.getUniformLocation("uRotation");
		this.uColorLocation = this.terrainShader.getUniformLocation("uColor");
		this.uHeightmapTexture = this.terrainShader.getUniformLocation("uHeightmapTexture");

		this.rotations = new Array(4);
		for (let i = 0; i < 4; ++i) {
			this.rotations[i] = mat2.create();
			mat2.identity(this.rotations[i]);
		}

		this.heightmapTexture = new Texture(0);

		mat2.rotate(this.rotations[1], this.rotations[1], (270 / 180) * Math.PI);
		mat2.rotate(this.rotations[2], this.rotations[2], (90 / 180) * Math.PI);
		mat2.rotate(this.rotations[3], this.rotations[3], (180 / 180) * Math.PI);

		this.tileIndexCount = TILE_RESOLUTION * TILE_RESOLUTION * 6;
		this.fillerIndexCount = TILE_RESOLUTION * 24;
		this.crossIndexCount = (TILE_RESOLUTION * 24) + 6;
		this.trimIndexCount = ((CLIPMAP_VERTEX_RESOLUTION * 2) - 1) * 6;

		const tileVertexCount = TILE_VERTEX_RESOLUTION * TILE_VERTEX_RESOLUTION;
		const fillerVertexCount = TILE_VERTEX_RESOLUTION * 8;
		const crossVertexCount = TILE_VERTEX_RESOLUTION * 8;
		const trimVertexCount = ((CLIPMAP_VERTEX_RESOLUTION * 2) + 1) * 2;

		let vertexData = new Float32Array((tileVertexCount + fillerVertexCount + crossVertexCount + trimVertexCount) * 2);
		let indexData = new Uint16Array(this.tileIndexCount + this.fillerIndexCount + this.crossIndexCount + this.trimIndexCount);

		let currentVertexOffset = 0;
		let currentIndexOffset = 0;
		let currentVertexBaseOffset = 0;

		// tile
		{
			// generate vertex buffer data for tiles
			for (let y = 0; y < TILE_VERTEX_RESOLUTION; ++y) {
				for (let x = 0; x < TILE_VERTEX_RESOLUTION; ++x) {
					vertexData[currentVertexOffset++] = x;
					vertexData[currentVertexOffset++] = y;
				}
			}

			// generate index buffer data for tiles
			for (let y = 0; y < TILE_RESOLUTION; ++y) {
				for (let x = 0; x < TILE_RESOLUTION; ++x) {
					indexData[currentIndexOffset++] = (y * TILE_VERTEX_RESOLUTION) + x;
					indexData[currentIndexOffset++] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x;
					indexData[currentIndexOffset++] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x + 1;

					indexData[currentIndexOffset++] = (y * TILE_VERTEX_RESOLUTION) + x;
					indexData[currentIndexOffset++] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x + 1;
					indexData[currentIndexOffset++] = (y * TILE_VERTEX_RESOLUTION) + x + 1;
				}
			}
		}

		currentVertexBaseOffset += tileVertexCount;

		// filler
		{
			// generate vertex buffer data for filler mesh
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
				vertexData[currentVertexOffset++] = 1;
			}
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
			}
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
				vertexData[currentVertexOffset++] = 0;
			}
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
			}

			// generate index buffer data for filler mesh
			for (let i = 0; i < TILE_RESOLUTION * 4; ++i) {
				let arm = Math.floor(i / TILE_RESOLUTION);

				let bl = ((arm + i) * 2) + 0;
				let br = ((arm + i) * 2) + 1;
				let tl = ((arm + i) * 2) + 2;
				let tr = ((arm + i) * 2) + 3;

				if (arm % 2 === 0) {
					indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				}
				else {
					indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				}
			}
		}

		currentVertexBaseOffset += fillerVertexCount;

		// cross
		{
			// generate vertex buffer data for cross mesh

			// horizontal vertices
			for (let i = 0; i < TILE_VERTEX_RESOLUTION * 2; ++i) {
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 1;
			}

			const startOfVertical = TILE_VERTEX_RESOLUTION * 4;

			// vertical vertices
			for (let i = 0; i < TILE_VERTEX_RESOLUTION * 2; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
			}

			// generate index buffer data for filler mesh

			// horizontal indices
			for (let i = 0; i < (TILE_RESOLUTION * 2) + 1; ++i) {
				let bl = (i * 2) + 0;
				let br = (i * 2) + 1;
				let tl = (i * 2) + 2;
				let tr = (i * 2) + 3;

				indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
			}

			// vertical indices
			for (let i = 0; i < (TILE_RESOLUTION * 2) + 1; ++i) {
				if (i === TILE_RESOLUTION) {
					continue;
				}

				let bl = (i * 2) + 0 + startOfVertical;
				let br = (i * 2) + 1 + startOfVertical;
				let tl = (i * 2) + 2 + startOfVertical;
				let tr = (i * 2) + 3 + startOfVertical;

				indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
			}
		}

		currentVertexBaseOffset += crossVertexCount;

		// trim
		{
			// generate vertex buffer data for trim

			// vertical part of L
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION + 1; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = CLIPMAP_VERTEX_RESOLUTION - i;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = CLIPMAP_VERTEX_RESOLUTION - i;
			}

			const startOfHorizontal = (CLIPMAP_VERTEX_RESOLUTION + 1) * 2;

			// horizontal part of L
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = i + 1;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i + 1;
				vertexData[currentVertexOffset++] = 1;
			}

			// generate index buffer data for tiles
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION; ++i) {
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 0 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + currentVertexBaseOffset;

				indexData[currentIndexOffset++] = ((i + 1) * 2) + 1 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + currentVertexBaseOffset;
			}
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION - 1; ++i) {
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 0 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + startOfHorizontal + currentVertexBaseOffset;

				indexData[currentIndexOffset++] = ((i + 1) * 2) + 1 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + startOfHorizontal + currentVertexBaseOffset;
			}
		}

		const vaoBuffer = gl.createVertexArray();
		const vertexBuffer = gl.createBuffer();
		const indexBuffer = gl.createBuffer();

		if (!vertexBuffer || !indexBuffer || !vaoBuffer) { throw new Error("Couldn't create vertex or indexbuffer."); }

		this.vao = vaoBuffer;
		this.vbo = vertexBuffer;
		this.ibo = indexBuffer;

		gl.bindVertexArray(this.vao);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

		// vertex positions
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(this.terrainShader.getAttributeLocation("aPosition"), 2, gl.FLOAT, false, 8, 0);

		gl.bindVertexArray(null);
	}

	draw(viewProjection: mat4, camPos: vec3) {
		let drawMode = gl.LINES;

		this.terrainShader.use();

		gl.bindVertexArray(this.vao);

		this.terrainShader.setUniformMat4(this.uTransformLocation, viewProjection);

		this.heightmapTexture.bind();
		this.terrainShader.setUniformI(this.uHeightmapTexture, this.heightmapTexture.unit);

		for (let level = 0; level < NUM_CLIPMAP_LEVELS; ++level) {
			const scale = 1 << level;
			this.terrainShader.setUniformF(this.uScaleLocation, scale);

			const snappedPosX = Math.floor(camPos[0] / scale) * scale;
			const snappedPosY = Math.floor(camPos[2] / scale) * scale;

			const tileSize = TILE_RESOLUTION << level;
			const baseX = snappedPosX - (TILE_RESOLUTION << (level + 1));
			const baseY = snappedPosY - (TILE_RESOLUTION << (level + 1));

			// draw trim
			{
				const nextScale = scale * 2;
				const nextSnappedPosX = Math.floor(camPos[0] / nextScale) * nextScale;
				const nextSnappedPosY = Math.floor(camPos[2] / nextScale) * nextScale;

				let offsetX = baseX - scale;
				let offsetY = baseY - scale;
				let dX = camPos[0] - nextSnappedPosX;
				let dY = camPos[2] - nextSnappedPosY;
				let r = 0;
				if (dX < scale) {
					r |= 2;
					offsetX += scale * (CLIPMAP_RESOLUTION + 2);
				}
				if (dY < scale) {
					r |= 1;
					offsetY += scale * (CLIPMAP_RESOLUTION + 2);
				}

				this.terrainShader.setUniformVec3(this.uColorLocation, [0, 1, 0]);
				this.terrainShader.setUniformMat2(this.uRotationLocation, this.rotations[r]);
				this.terrainShader.setUniformVec2(this.uBiasLocation, [offsetX, offsetY]);
				gl.drawElements(drawMode, this.trimIndexCount, gl.UNSIGNED_SHORT, (this.tileIndexCount + this.fillerIndexCount + this.crossIndexCount) * 2);
			}

			// all following drawcalls dont need a rotation
			this.terrainShader.setUniformMat2(this.uRotationLocation, this.rotations[0]);

			// draw tiles
			this.terrainShader.setUniformVec3(this.uColorLocation, [0, 0, 1]);
			for (let y = 0; y < 4; ++y) {
				for (let x = 0; x < 4; ++x) {
					if (level !== 0 && x > 0 && x < 3 && y > 0 && y < 3) {
						continue;
					}
					let offsetX = x > 1 ? scale : 0;
					let offsetY = y > 1 ? scale : 0;
					offsetX += baseX + (x * tileSize);
					offsetY += baseY + (y * tileSize);
					this.terrainShader.setUniformVec2(this.uBiasLocation, [offsetX, offsetY]);

					gl.drawElements(drawMode, this.tileIndexCount, gl.UNSIGNED_SHORT, 0);
				}
			}

			// draw filler
			{
				this.terrainShader.setUniformVec3(this.uColorLocation, [1, 0, 0]);
				this.terrainShader.setUniformVec2(this.uBiasLocation, [snappedPosX, snappedPosY]);
				gl.drawElements(drawMode, this.fillerIndexCount, gl.UNSIGNED_SHORT, (this.tileIndexCount) * 2);
			}
		}

		// draw cross
		{
			// color is still set from drawing filler
			// rotation is still set from everything after drawing trim
			this.terrainShader.setUniformF(this.uScaleLocation, 1);
			this.terrainShader.setUniformVec2(this.uBiasLocation, [Math.floor(camPos[0]), Math.floor(camPos[2])]);
			gl.drawElements(drawMode, this.crossIndexCount, gl.UNSIGNED_SHORT, (this.tileIndexCount + this.fillerIndexCount) * 2);
		}

		gl.bindVertexArray(null);
	}

	getHeightmapTexture() {
		return this.heightmapTexture;
	}
}
