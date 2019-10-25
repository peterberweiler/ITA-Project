import { vec2 } from "gl-matrix";
import Global from "./Global";

let gl: WebGL2RenderingContext;

type Size = vec2 | [number, number];

export default class Texture {
	public id: WebGLTexture;
	public size: Size;

	constructor() {
		gl = Global.gl;

		this.id = -1;
		this.size = [0, 0];

		const id = gl.createTexture();

		if (!id) { throw new Error("Couldn't create texture."); }
		this.id = id;

		this.bind(0);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	bind(unit: number) {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, this.id);
	}

	updateFloatRedData(size: Size, data: Float32Array | null) {
		this.bind(0);
		this.size = size;
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, size[0], size[1], 0, gl.RED, gl.FLOAT, data);
	}

	updateFloatRGBData(size: Size, data: Float32Array | null) {
		this.bind(0);
		this.size = size;
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, size[0], size[1], 0, gl.RGB, gl.FLOAT, data);
	}

	updateFloatRGBAData(size: Size, data: Float32Array | null) {
		this.bind(0);
		this.size = size;
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, size[0], size[1], 0, gl.RGBA, gl.FLOAT, data);
	}
}

/**
 * WebGL doesn't allow reading and writing to the same texture.
 * Thats why this class wraps two textures ans swaps them around to more or less appear as one.
 *
 * Usage example:
 *   pingPongTexture.current().bind(0); // sets the current texture as read texture
 *   framebuffer.setColorAttachment(pingPongTexture.next()); // sets the other texture as write texture
 */
export class PingPongTexture {
	private currentTexture = new Texture()
	private nextTexture = new Texture()

	/** returns the current active texture */
	current() {
		return this.currentTexture;
	}

	/** swaps active texture and returns the new current texture */
	next() {
		const tmp = this.currentTexture;
		this.currentTexture = this.nextTexture;
		this.nextTexture = tmp;

		return this.currentTexture;
	}

	initialize(initializer: (texture: Texture) => void) {
		initializer(this.currentTexture);
		initializer(this.nextTexture);
	}
}

