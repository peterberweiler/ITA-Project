import { mat2, mat4, vec3 } from "gl-matrix";
import Global from "./Global";
import Shader from "./Shader";

let gl: WebGL2RenderingContext;
const TILE_RESOLUTION: number = 8;
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
	private tileBuffers: WebGLBuffer[];
	private fillerBuffers: WebGLBuffer[];
	private crossBuffers: WebGLBuffer[];
	private trimBuffers: WebGLBuffer[];
	private tileIndexCount: number = 0;
	private fillerIndexCount: number = 0;
	private crossIndexCount: number = 0;
	private trimIndexCount: number = 0;
	private rotations: mat2[];

	constructor() {
		gl = Global.gl;

		this.terrainShader = new Shader(vertSource, fragSource);
		this.uTransformLocation = this.terrainShader.getUniformLocation("uTransform");
		this.uScaleLocation = this.terrainShader.getUniformLocation("uScale");
		this.uBiasLocation = this.terrainShader.getUniformLocation("uBias");
		this.uRotationLocation = this.terrainShader.getUniformLocation("uRotation");
		this.uColorLocation = this.terrainShader.getUniformLocation("uColor");

		this.rotations = new Array(4);
		for (let i = 0; i < 4; ++i) {
			this.rotations[i] = mat2.create();
			mat2.identity(this.rotations[i]);
		}

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

		// tile
		{
			let vertexData = new Float32Array(tileVertexCount * 2);

			let currentVertexOffset = 0;
			// generate vertex buffer data for tiles
			for (let y = 0; y < TILE_VERTEX_RESOLUTION; ++y) {
				for (let x = 0; x < TILE_VERTEX_RESOLUTION; ++x) {
					vertexData[currentVertexOffset++] = x;
					vertexData[currentVertexOffset++] = y;
				}
			}

			let indexData = new Uint16Array(this.tileIndexCount);

			let currentIndexOffset = 0;
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

			this.tileBuffers = this.createBuffers(vertexData, indexData);
		}

		// filler
		{
			let vertexData = new Float32Array(fillerVertexCount * 2);

			let currentVertexOffset = 0;
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

			let indexData = new Uint16Array(this.fillerIndexCount);

			let currentIndexOffset = 0;
			// generate index buffer data for filler mesh
			for (let i = 0; i < TILE_RESOLUTION * 4; ++i) {
				let arm = Math.floor(i / TILE_RESOLUTION);

				let bl = ((arm + i) * 2) + 0;
				let br = ((arm + i) * 2) + 1;
				let tl = ((arm + i) * 2) + 2;
				let tr = ((arm + i) * 2) + 3;

				if (arm % 2 === 0) {
					indexData[currentIndexOffset++] = br;
					indexData[currentIndexOffset++] = bl;
					indexData[currentIndexOffset++] = tr;
					indexData[currentIndexOffset++] = bl;
					indexData[currentIndexOffset++] = tl;
					indexData[currentIndexOffset++] = tr;
				}
				else {
					indexData[currentIndexOffset++] = br;
					indexData[currentIndexOffset++] = bl;
					indexData[currentIndexOffset++] = tl;
					indexData[currentIndexOffset++] = br;
					indexData[currentIndexOffset++] = tl;
					indexData[currentIndexOffset++] = tr;
				}
			}

			this.fillerBuffers = this.createBuffers(vertexData, indexData);
		}

		// cross
		{
			let vertexData = new Float32Array(crossVertexCount * 2);

			let currentVertexOffset = 0;
			// generate vertex buffer data for cross mesh

			// horizontal vertices
			for (let i = 0; i < TILE_VERTEX_RESOLUTION * 2; ++i) {
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 1;
			}

			const startOfVertical = currentVertexOffset / 2;

			// vertical vertices
			for (let i = 0; i < TILE_VERTEX_RESOLUTION * 2; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
			}

			let indexData = new Uint16Array(this.crossIndexCount);

			let currentIndexOffset = 0;
			// generate index buffer data for filler mesh

			// horizontal indices
			for (let i = 0; i < (TILE_RESOLUTION * 2) + 1; ++i) {
				let bl = (i * 2) + 0;
				let br = (i * 2) + 1;
				let tl = (i * 2) + 2;
				let tr = (i * 2) + 3;

				indexData[currentIndexOffset++] = br;
				indexData[currentIndexOffset++] = bl;
				indexData[currentIndexOffset++] = tr;
				indexData[currentIndexOffset++] = bl;
				indexData[currentIndexOffset++] = tl;
				indexData[currentIndexOffset++] = tr;
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

				indexData[currentIndexOffset++] = br;
				indexData[currentIndexOffset++] = bl;
				indexData[currentIndexOffset++] = tr;
				indexData[currentIndexOffset++] = bl;
				indexData[currentIndexOffset++] = tl;
				indexData[currentIndexOffset++] = tr;
			}

			this.crossBuffers = this.createBuffers(vertexData, indexData);
		}

		// trim
		{
			let vertexData = new Float32Array(trimVertexCount * 2);

			let currentVertexOffset = 0;
			// generate vertex buffer data for trim

			// vertical part of L
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION + 1; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = CLIPMAP_VERTEX_RESOLUTION - i;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = CLIPMAP_VERTEX_RESOLUTION - i;
			}

			const startOfHorizontal = currentVertexOffset / 2;

			// horizontal part of L
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = i + 1;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i + 1;
				vertexData[currentVertexOffset++] = 1;
			}

			let indexData = new Uint16Array(this.trimIndexCount);

			let currentIndexOffset = 0;
			// generate index buffer data for tiles
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION; ++i) {
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 0;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0;

				indexData[currentIndexOffset++] = ((i + 1) * 2) + 1;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0;
			}
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION - 1; ++i) {
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + startOfHorizontal;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 0 + startOfHorizontal;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + startOfHorizontal;

				indexData[currentIndexOffset++] = ((i + 1) * 2) + 1 + startOfHorizontal;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + startOfHorizontal;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + startOfHorizontal;
			}

			this.trimBuffers = this.createBuffers(vertexData, indexData);
		}
	}

	private createBuffers(vertexData: Float32Array, indexData: Uint16Array) {
		const vaoBuffer = gl.createVertexArray();
		const vertexBuffer = gl.createBuffer();
		const indexBuffer = gl.createBuffer();

		if (!vertexBuffer || !indexBuffer || !vaoBuffer) { throw new Error("Couldn't create vertex or indexbuffer."); }

		gl.bindVertexArray(vaoBuffer);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

		// vertex positions
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(this.terrainShader.getAttributeLocation("aPosition"), 2, gl.FLOAT, false, 8, 0);

		gl.bindVertexArray(null);

		return [vaoBuffer, vertexBuffer, indexBuffer];
	}

	draw(viewProjection: mat4, camPos: vec3) {
		let drawMode = gl.TRIANGLES;

		this.terrainShader.use();
		this.terrainShader.setUniformMat4(this.uTransformLocation, viewProjection);

		this.terrainShader.setUniformMat2(this.uRotationLocation, this.rotations[0]);

		// draw tiles
		gl.bindVertexArray(this.tileBuffers[0]);
		this.terrainShader.setUniformVec3(this.uColorLocation, [0, 0, 1]);
		for (let level = 0; level < NUM_CLIPMAP_LEVELS; ++level) {
			let scale = 1 << level;
			this.terrainShader.setUniformF(this.uScaleLocation, 1 << level);

			let snappedPosX = Math.floor(camPos[0] / scale) * scale;
			let snappedPosY = Math.floor(camPos[2] / scale) * scale;

			let tileSize = TILE_RESOLUTION << level;
			let baseX = snappedPosX - (TILE_RESOLUTION << (level + 1));
			let baseY = snappedPosY - (TILE_RESOLUTION << (level + 1));

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
		}

		// draw filler
		this.terrainShader.setUniformVec3(this.uColorLocation, [1, 0, 0]);
		gl.bindVertexArray(this.fillerBuffers[0]);
		for (let level = 0; level < NUM_CLIPMAP_LEVELS; ++level) {
			let scale = 1 << level;

			let snappedPosX = Math.floor(camPos[0] / scale) * scale;
			let snappedPosY = Math.floor(camPos[2] / scale) * scale;

			this.terrainShader.setUniformF(this.uScaleLocation, 1 << level);
			this.terrainShader.setUniformVec2(this.uBiasLocation, [snappedPosX, snappedPosY]);
			gl.drawElements(drawMode, this.fillerIndexCount, gl.UNSIGNED_SHORT, 0);
		}

		// draw cross
		gl.bindVertexArray(this.crossBuffers[0]);
		this.terrainShader.setUniformF(this.uScaleLocation, 1);
		this.terrainShader.setUniformVec2(this.uBiasLocation, [Math.floor(camPos[0]), Math.floor(camPos[2])]);
		gl.drawElements(drawMode, this.crossIndexCount, gl.UNSIGNED_SHORT, 0);

		// draw trim
		this.terrainShader.setUniformVec3(this.uColorLocation, [0, 1, 0]);
		gl.bindVertexArray(this.trimBuffers[0]);
		for (let level = 0; level < NUM_CLIPMAP_LEVELS; ++level) {
			let scale = 1 << level;

			let snappedPosX = Math.floor(camPos[0] / scale) * scale;
			let snappedPosY = Math.floor(camPos[2] / scale) * scale;

			let nextScale = scale * 2;
			let nextSnappedPosX = Math.floor(camPos[0] / nextScale) * nextScale;
			let nextSnappedPosY = Math.floor(camPos[2] / nextScale) * nextScale;

			let offsetX = snappedPosX - (TILE_RESOLUTION << (level + 1)) - scale;
			let offsetY = snappedPosY - (TILE_RESOLUTION << (level + 1)) - scale;
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

			this.terrainShader.setUniformMat2(this.uRotationLocation, this.rotations[r]);
			this.terrainShader.setUniformF(this.uScaleLocation, scale);
			this.terrainShader.setUniformVec2(this.uBiasLocation, [offsetX, offsetY]);
			gl.drawElements(drawMode, this.trimIndexCount, gl.UNSIGNED_SHORT, 0);
		}

		gl.bindVertexArray(null);
	}
}
