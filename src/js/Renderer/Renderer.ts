/*
 * Renderer
 */
import { mat4 } from "gl-matrix";
import { Camera } from "./Cameras";
import Global from "./Global";
import HeightmapRenderer from "./Terrain/HeightmapController";
import Terrain from "./Terrain/Terrain";

let gl: WebGL2RenderingContext;

export default class Renderer {
	private canvas: HTMLCanvasElement;
	public camera: Camera;
	private terrain: Terrain;
	private heightmapRenderer: HeightmapRenderer;

	constructor(canvas: HTMLCanvasElement, camera: Camera) {
		const context = canvas.getContext("webgl2");
		if (!context) {
			throw new Error("Unable to initialize WebGL. Please use a different or newer browser.");
		}
		gl = context;
		Global.gl = gl;
		this.canvas = canvas;
		this.camera = camera;

		gl.getExtension("OES_texture_float_linear");
		gl.getExtension("EXT_color_buffer_float");

		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) <= 0 ||
			gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) < 256) {
			alert("The website might not work correctly, please use a newer or different browser");
		}

		this.terrain = new Terrain();
		this.heightmapRenderer = new HeightmapRenderer(this.terrain.getHeightmapTexture());

		this.resized();
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

	render(currentTime: number, deltaTime: number) {
		this.heightmapRenderer.render();

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		let viewProjection = mat4.create();
		mat4.multiply(viewProjection, this.camera.projectionMatrix, this.camera.viewMatrix);
		this.terrain.draw(viewProjection, this.camera.getPosition());
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

	getTerrain() {
		return this.terrain;
	}

	getHeightmapRenderer() {
		return this.heightmapRenderer;
	}
}
