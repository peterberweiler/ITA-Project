import { vec2 } from "gl-matrix";
import { gl } from "./Global";

type Size = vec2 | [number, number];

export default class Texture {
	public id: WebGLTexture;
	public size: Size;

	constructor() {
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

	updateRGBDataWithImage(image: HTMLImageElement) {
		this.bind(0);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	}
	updateRGBADataWithImage(image: HTMLImageElement) {
		this.bind(0);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}

	updateRGBData(size: Size, data: Uint8Array | null) {
		this.bind(0);
		this.size = size;
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, size[0], size[1], 0, gl.RGB, gl.UNSIGNED_BYTE, data);
	}

	updateRGBAData(size: Size, data: Uint8Array | null) {
		this.bind(0);
		this.size = size;
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size[0], size[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
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

	static fromRGBImage(uri: string): Texture {
		const image = new Image();
		image.src = uri;
		const texture = new Texture();
		texture.updateRGBData([1, 1], null);
		image.onload = () => {
			texture.updateRGBDataWithImage(image);
		};
		return texture;
	}

	static fromRGBAImage(uri: string): Texture {
		const image = new Image();
		image.src = uri;
		const texture = new Texture();
		texture.updateRGBAData([1, 1], null);
		image.onload = () => {
			texture.updateRGBADataWithImage(image);
		};
		return texture;
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

