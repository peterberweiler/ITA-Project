import Framebuffer from "../../Framebuffer";
import { gl, TextureBundle } from "../../Global";
import Texture from "../../Texture";
import { Pass } from "./Passes";

const invertFSSource = require("../../../Shader/downloadPass.fs").default;

const SIZE: [number, number] = [1024, 1024];

interface DownloadPassData {
	textureId: WebGLTexture,
	mode: number,
	callback: (data: any) => void;
}

export class DownloadPass extends Pass {
	constructor() { super(invertFSSource); }

	static RGBA_FLOAT_MODE = 0;
	static RGB_FLOAT_MODE = 1;
	static R_FLOAT_MODE = 2;

	private outTexture?: Texture;

	private queue: DownloadPassData[] = [];

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		if (!this.outTexture) {
			this.outTexture = new Texture();
		}

		switch (this.queue[0].mode) {
			case DownloadPass.RGB_FLOAT_MODE:
				this.outTexture.updateFloatRGBData(SIZE, null);
				break;
			case DownloadPass.RGBA_FLOAT_MODE:
				this.outTexture.updateFloatRGBAData(SIZE, null);
				break;
			case DownloadPass.R_FLOAT_MODE:
				this.outTexture.updateFloatRedData(SIZE, null);
				break;
		}

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.queue[0].textureId);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		framebuffer.setColorAttachment(this.outTexture);
	}

	finalizePass() {
		let data;
		switch (this.queue[0].mode) {
			case DownloadPass.RGB_FLOAT_MODE:
				data = new Float32Array(SIZE[0] * SIZE[1] * 3);
				gl.readPixels(0, 0, SIZE[0], SIZE[1], gl.RGB, gl.FLOAT, data);
				break;
			case DownloadPass.RGBA_FLOAT_MODE:
				data = new Float32Array(SIZE[0] * SIZE[1] * 4);
				gl.readPixels(0, 0, SIZE[0], SIZE[1], gl.RGBA, gl.FLOAT, data);
				break;
			case DownloadPass.R_FLOAT_MODE:
				data = new Float32Array(SIZE[0] * SIZE[1]);
				gl.readPixels(0, 0, SIZE[0], SIZE[1], gl.RED, gl.FLOAT, data);
				break;

			default:
				throw new Error("Unknown DownloadPass mode");
		}

		this.queue[0].callback(data);
		this.queue.shift();
	}

	queueDownload(data: DownloadPassData) {
		this.queue.push(data);
	}
}

