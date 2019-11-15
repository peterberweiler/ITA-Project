import Framebuffer from "../Framebuffer";
import Global from "../Global";
import Shader from "../Shader";
import { PingPongTexture } from "../Texture";

const fullscreenVSSource = require("../../Shader/fullscreenPass.vs").default;
const perlinFSSource = require("../../Shader/perlinPass.fs").default;
const invertFSSource = require("../../Shader/invertPass.fs").default;
const heightBrushFSSource = require("../../Shader/heightBrushPass.fs").default;

let gl: WebGL2RenderingContext;

export abstract class Pass {
	private static vertexShader?: WebGLShader;
	readonly shader: Shader;

	constructor(fragmentShaderSource: string) {
		gl = Global.gl;
		if (!Pass.vertexShader) {
			Pass.vertexShader = Shader.compile(fullscreenVSSource, gl.VERTEX_SHADER);
		}

		this.shader = new Shader(Pass.vertexShader, fragmentShaderSource);
	}

	abstract initalizePass(heightmap: PingPongTexture, albedomap: PingPongTexture, framebuffer: Framebuffer): void;

	finalizePass(_framebuffer: Framebuffer) {
		//
	}
}

export class PerlinPass extends Pass {
	constructor() { super(perlinFSSource); }

	seeds = [1, 200, 300, 0, 10, 0];
	amplitudes = [300, 200, 50, 8, 1, 0.2];
	scales = [500, 330, 120, 40, 10, 1];
	offsets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

	initalizePass(heightmap: PingPongTexture, albedomap: PingPongTexture, framebuffer: Framebuffer) {
		gl.uniform1fv(this.shader.getUniformLocation("uSeed"), this.seeds);
		gl.uniform1fv(this.shader.getUniformLocation("uAmplitude"), this.amplitudes);
		gl.uniform1fv(this.shader.getUniformLocation("uScale"), this.scales);
		gl.uniform2fv(this.shader.getUniformLocation("uOffset"), this.offsets);
		gl.uniform1i(this.shader.getUniformLocation("uLayerCount"), this.seeds.length);

		heightmap.current().bind(0);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		framebuffer.setColorAttachment(heightmap.next());
	}
}

export class InvertPass extends Pass {
	constructor() { super(invertFSSource); }

	initalizePass(heightmap: PingPongTexture, albedomap: PingPongTexture, framebuffer: Framebuffer) {
		heightmap.current().bind(0);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		framebuffer.setColorAttachment(heightmap.next());
	}
}

export class HeightBrushPass extends Pass {
	constructor() { super(heightBrushFSSource); }

	data: number[] = [];

	static NORMAL = 0.1;
	static FLATTEN = 1.1;

	initalizePass(heightmap: PingPongTexture, albedomap: PingPongTexture, framebuffer: Framebuffer) {
		heightmap.current().bind(0);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		let sendData;
		if (this.data.length > 200) {
			sendData = this.data.slice(0, 200);
			this.data = this.data.slice(200);
		}
		else {
			sendData = this.data;
			this.data = [];
		}
		this.shader.setUniformFv(this.shader.getUniformLocation("uData"), sendData);
		this.shader.setUniformI(this.shader.getUniformLocation("uDataLength"), sendData.length);

		framebuffer.setColorAttachment(heightmap.next());
	}

	addPoint(x: number, y: number, type: number, radius: number, strength: number) {
		this.data.push(x, y, type, radius, strength);
	}
}
