import { vec2 } from "gl-matrix";
import Global from "./Global";

let gl: WebGL2RenderingContext;

type Size = vec2 | [number, number];

export default class FloatTexture {
	unit: number;
	id: WebGLTexture;
	size: Size;

	constructor(unit: number, size: Size) {
		gl = Global.gl;

		this.unit = unit;
		this.id = -1;
		this.size = [0, 0];
		this.initTexture();
		if (size) { this.updateSize(size); }
	}

	initTexture() {
		const id = gl.createTexture();

		if (!id) { throw new Error("Couldn't create texture."); }
		this.id = id;

		this.bind();

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	bind() {
		gl.activeTexture(gl.TEXTURE0 + this.unit);
		gl.bindTexture(gl.TEXTURE_2D, this.id);
	}

	updateSize(size: Size) {
		this.bind();
		this.updateData(size, null);
	}

	updateData(size: Size, data: Float32Array | null) {
		this.bind();
		this.size = size;
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size[0], size[1], 0, gl.RGBA, gl.FLOAT, data);
	}
}

module.exports = FloatTexture;
