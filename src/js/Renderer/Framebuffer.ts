import Global from "./Global";
import Texture from "./Texture";

let gl: WebGL2RenderingContext;

export default class Framebuffer {
	private id: WebGLFramebuffer | null;

	private size = [0, 0];

	constructor() {
		gl = Global.gl;

		this.id = gl.createFramebuffer();
	}

	bind() {
		gl.viewport(0, 0, this.size[0], this.size[1]);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
	}

	static unbind() {
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	setColorAttachment(texture: Texture, attachment: number = 0) {
		this.size[0] = texture.size[0];
		this.size[1] = texture.size[1];

		this.bind();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attachment, gl.TEXTURE_2D, texture.id, 0);
	}

	unsetColorAttachment(attachment: number) {
		this.bind();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attachment, gl.TEXTURE_2D, null, 0);
	}
}
