/*
 * Renderer
 */
import { Camera } from "./Cameras";
import Global from "./Global";
import Shader from "./Shader";

let gl: WebGL2RenderingContext;

export default class Renderer {
	private canvas: HTMLCanvasElement;
	public camera: Camera;
	private shaders: Shader[] = [];

	constructor(canvas: HTMLCanvasElement, camera: Camera) {
		const context = canvas.getContext("webgl2");
		this.canvas = canvas;
		this.camera = camera;

		if (!context) {
			alert("Unable to initialize WebGL. Please use a different or newer browser.");
			return;
		}
		gl = context;
		Global.gl = gl;

		gl.getExtension("OES_element_index_uint");
		gl.getExtension("OES_texture_float");
		gl.getExtension("OES_texture_float_linear");
		gl.getExtension("WEBGL_color_buffer_float");

		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) <= 0 ||
			gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) < 256) {
			alert("The website might not work correctly, please use a newer or different browser");
		}

		this.resized();
	}

	createShader(vertexShaderSource: string, fragmentShaderSource: string) {
		const shader = new Shader(vertexShaderSource, fragmentShaderSource);
		this.addShader(shader);
	}

	addShader(shader: Shader) {
		this.shaders.push(shader);
	}

	removeShader(shader: Shader) {
		this.shaders.splice(this.shaders.indexOf(shader), 1);
	}

	checkGLError(name?: string) {
		let error;
		if (name) { console.warn(name); }

		while ((error = gl.getError()) !== gl.NO_ERROR) {
			switch (error) {
				case gl.INVALID_ENUM:
					console.error("INVALID_ENUM", "An unacceptable value is specified for an enumerated argument.The offending command is ignored and has no other side effect than to set the error flag.");
					break;
				case gl.INVALID_VALUE:
					console.error("INVALID_VALUE", "A numeric argument is out of range.The offending command is ignored and has no other side effect than to set the error flag.");
					break;
				case gl.INVALID_OPERATION:
					console.error("INVALID_OPERATION", "The specified operation is not allowed in the current state.The offending command is ignored and has no other side effect than to set the error flag.");
					break;
				case gl.INVALID_FRAMEBUFFER_OPERATION:
					console.error("INVALID_FRAMEBUFFER_OPERATION", "The framebuffer object is not complete.The offending command is ignored and has no other side effect than to set the error flag.");
					break;
				case gl.OUT_OF_MEMORY:
					console.error("OUT_OF_MEMORY", "There is not enough memory left to execute the command.The state of the GL is undefined, except for the state of the error flags, after this error is recorded.");
					break;
				default:
					console.error(error);
			}
			name = undefined;
		}
	}

	beforeRender(currentTime: number, deltaTime: number) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		for (const shader of this.shaders) {
			shader.setViewMatrix(this.camera.viewMatrix);
			shader.setProjectionMatrix(this.camera.projectionMatrix);
		}
	}

	afterRender(currentTime: number, deltaTime: number) {
		//
	}

	resized() {
		let w = this.canvas.clientWidth; // gl.canvas.parentNode.clientWidth
		let h = this.canvas.clientHeight;

		gl.canvas.width = w;
		gl.canvas.height = h;

		gl.viewport(0, 0, w, h);
		this.camera.aspectRatio = w / h;
		this.camera.updateProjectionMatrix();
	}
}
