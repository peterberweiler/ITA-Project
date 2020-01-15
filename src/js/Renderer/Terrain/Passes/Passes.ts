import Framebuffer from "../../Framebuffer";
import { gl, TextureBundle } from "../../Global";
import Shader from "../../Shader";

const fullscreenVSSource = require("../../../Shader/fullscreenTriangle.vs").default;
const invertFSSource = require("../../../Shader/invertPass.fs").default;

//TODO: add framebuffer per Pass, only change gl.drawBuffers to change outputs

export abstract class Pass {
	private static vertexShader?: WebGLShader;
	readonly shader: Shader;

	constructor(fragmentShaderSource: string) {
		if (!Pass.vertexShader) {
			Pass.vertexShader = Shader.compile(fullscreenVSSource, gl.VERTEX_SHADER);
		}

		this.shader = new Shader(Pass.vertexShader, fragmentShaderSource);
	}

	abstract initalizePass(textures: TextureBundle, framebuffer: Framebuffer): void;

	finalizePass(_framebuffer: Framebuffer) {
		//
	}
}

export class InvertPass extends Pass {
	constructor() { super(invertFSSource); }

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		framebuffer.setColorAttachment(textures.heightMap.next());
	}
}

