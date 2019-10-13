import { mat4 } from "gl-matrix";
import Global from "./Global";
import Shader from "./Shader";

let gl: WebGL2RenderingContext;
const TILE_SIZE: number = 8;
const TILE_VERTEX_RESOLUTION: number = TILE_SIZE + 1;
const fragSource = require("../Shader/terrain.fs").default;
const vertSource = require("../Shader/terrain.vs").default;

export default class Terrain {
	private terrainShader: Shader;
	private uTransformLocation: WebGLUniformLocation;
	private uScaleLocation: WebGLUniformLocation;
	private uBiasLocation: WebGLUniformLocation;
	private vao: WebGLBuffer;
	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;
	private tileVertexOffset: number = 0;
	private tileIndexOffset: number = 0;
	private tileIndexCount: number = 0;
	private rimIndexOffset: number = 0;
	private rimIndexCount: number = 0;
	private fillerIndexOffset: number = 0;
	private fillerIndexCount: number = 0;
	private crossIndexOffset: number = 0;
	private crossIndexCount: number = 0;

	constructor() {
		this.terrainShader = new Shader(vertSource, fragSource);
		this.uTransformLocation = this.terrainShader.getUniformLocation("uTransform");
		this.uScaleLocation = this.terrainShader.getUniformLocation("uScale");
		this.uBiasLocation = this.terrainShader.getUniformLocation("uBias");

		this.tileVertexOffset = 0;
		this.tileIndexOffset = 0;
		this.tileIndexCount = TILE_SIZE * TILE_SIZE * 6;
		let vertexBufferData = new Float32Array(TILE_VERTEX_RESOLUTION * TILE_VERTEX_RESOLUTION * 2);

		// generate vertex buffer data
		for (let y = 0; y < TILE_VERTEX_RESOLUTION; ++y) {
			for (let x = 0; x < TILE_VERTEX_RESOLUTION; ++x) {
				let offset = ((y * TILE_VERTEX_RESOLUTION) + x) * 2;
				vertexBufferData[offset + 0] = x;
				vertexBufferData[offset + 1] = y;
			}
		}

		let indexBufferData = new Uint16Array(this.tileIndexCount);

		// generate index buffer data
		for (let y = 0; y < TILE_SIZE; ++y) {
			for (let x = 0; x < TILE_SIZE; ++x) {
				let offset = ((y * TILE_SIZE) + x) * 6;
				indexBufferData[offset + 0] = (y * TILE_VERTEX_RESOLUTION) + x;
				indexBufferData[offset + 1] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x;
				indexBufferData[offset + 2] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x + 1;

				indexBufferData[offset + 3] = (y * TILE_VERTEX_RESOLUTION) + x;
				indexBufferData[offset + 4] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x + 1;
				indexBufferData[offset + 5] = (y * TILE_VERTEX_RESOLUTION) + x + 1;
			}
		}

		gl = Global.gl;

		const vaoBuffer = gl.createVertexArray();
		const vertexBuffer = gl.createBuffer();
		const indexBuffer = gl.createBuffer();

		if (!vertexBuffer || !indexBuffer || !vaoBuffer) { throw new Error("Couldn't create vertex or indexbuffer."); }

		this.vao = vaoBuffer;
		this.vbo = vertexBuffer;
		this.ibo = indexBuffer;

		gl.bindVertexArray(this.vao);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertexBufferData, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferData, gl.STATIC_DRAW);

		// vertex positions
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(this.terrainShader.getAttributeLocation("aPosition"), 2, gl.FLOAT, false, 8, 0);

		gl.bindVertexArray(null);
	}

	draw(viewProjection: mat4) {
		this.terrainShader.use();
		this.terrainShader.setUniformMat4(this.uTransformLocation, viewProjection);

		gl.bindVertexArray(this.vao);

		for (let level = 0; level < 4; ++level) {
			let scale = 1 << level;
			this.terrainShader.setUniformF(this.uScaleLocation, 1 << level);
			for (let y = 0; y < 4; ++y) {
				for (let x = 0; x < 4; ++x) {
					if (level !== 0 && x > 0 && x < 3 && y > 0 && y < 3) {
						continue;
					}
					let offsetX = 0;
					offsetX += x > 1 ? 1 : 0;
					offsetX += 0;
					let offsetY = 0;
					offsetY += y > 1 ? 1 : 0;
					offsetY -= 1;
					this.terrainShader.setUniformVec2(this.uBiasLocation, [((TILE_SIZE * (x - 2)) + offsetX) * scale, ((TILE_SIZE * (y - 2)) + offsetY) * scale]);

					gl.drawElements(gl.TRIANGLES, this.tileIndexCount, gl.UNSIGNED_SHORT, 0);
				}
			}
		}

		gl.bindVertexArray(null);
	}
}
