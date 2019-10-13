import Global from "./Global";

let gl: WebGL2RenderingContext;

export default class Framebuffer {
	private id: WebGLFramebuffer | null;

	constructor() {
		gl = Global.gl;

		this.id = gl.createFramebuffer();
	}

	bind() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
	}

	static unbind() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	setColorAttachment(texture: any) {
		this.bind();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.id, 0);
	}
}
