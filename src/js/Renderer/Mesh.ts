import Global from "./Global";

let gl: WebGL2RenderingContext;

export default class Mesh {
	vertexBuffer: WebGLBuffer;
	indexBuffer: WebGLBuffer;
	indicesCount: number = 0;

	constructor(vertexBufferArray: Float32Array | number[], indexBufferArray: Uint32Array | number[]) {
		gl = Global.gl;

		const vertexBuffer = gl.createBuffer();
		const indexBuffer = gl.createBuffer();

		if (!vertexBuffer || !indexBuffer) { throw new Error("Couldn't create vertex or indexbuffer."); }

		this.vertexBuffer = vertexBuffer;
		this.indexBuffer = indexBuffer;

		this.updateBufferData(vertexBufferArray, indexBufferArray);
	}

	bind() {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	}

	updateBufferData(vertexBufferArray: Float32Array | number[], indexBufferArray: Uint32Array | number[]) {
		this.bind();

		this.indicesCount = indexBufferArray.length;

		if (!(vertexBufferArray instanceof Float32Array)) {
			vertexBufferArray = new Float32Array(vertexBufferArray);
		}
		if (!(indexBufferArray instanceof Uint32Array)) {
			indexBufferArray = new Uint32Array(indexBufferArray);
		}

		gl.bufferData(gl.ARRAY_BUFFER, vertexBufferArray, gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferArray, gl.STATIC_DRAW);
	}

	draw() {
		gl.drawElements(gl.TRIANGLES, this.indicesCount, gl.UNSIGNED_INT, 0);
	}

	drawLines() {
		gl.drawElements(gl.LINES, this.indicesCount, gl.UNSIGNED_INT, 0);
	}
}
