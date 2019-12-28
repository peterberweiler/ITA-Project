/*
 * Renderer
 */
import { mat4 } from "gl-matrix";
import { Camera } from "./Cameras";
import Global from "./Global";
import HeightmapController from "./Terrain/HeightmapController";
import Layers from "./Terrain/Layers";
import Terrain from "./Terrain/Terrain";

let gl: WebGL2RenderingContext;

export default class Renderer {
	private canvas: HTMLCanvasElement;
	public camera: Camera;
	private terrain: Terrain;
	private heightmapController: HeightmapController;
	private mouseOverCanvas: boolean = false;
	private mousePosX: number = 0;
	private mousePosY: number = 0;
	private layers: Layers;
	public sunDir: [number, number, number] = [0, 1.118, 0.559];

	constructor(canvas: HTMLCanvasElement, camera: Camera) {
		const context = canvas.getContext("webgl2", { antialias: false });
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

		this.layers = new Layers();

		// stone layer
		{
			let layerIdx: number = 0;
			if (layerIdx === -1) { throw new Error("Couldnt allocate layer."); }
			let material = this.layers.getLayerMaterial(layerIdx);
			material.setColor([0.2, 0.2, 0.2]);
			material.setRoughness(0.7);
			this.layers.layerOrder[0] = layerIdx;
			this.layers.setLayerActive(0, true);
		}

		// dirt layer
		{
			let layerIdx: number = 1;
			if (layerIdx === -1) { throw new Error("Couldnt allocate layer."); }
			let material = this.layers.getLayerMaterial(layerIdx);
			material.setColor([0.2, 0.1, 0.05]);
			material.setRoughness(0.9);
			this.layers.layerOrder[1] = layerIdx;
			this.layers.setLayerActive(1, true);
		}

		// grass layer
		{
			let layerIdx: number = 2;
			if (layerIdx === -1) { throw new Error("Couldnt allocate layer."); }
			let material = this.layers.getLayerMaterial(layerIdx);
			material.setColor([0.07, 0.4, 0.05]);
			material.setRoughness(0.6);
			this.layers.layerOrder[2] = layerIdx;
			this.layers.setLayerActive(2, true);
		}

		// snow layer
		{
			let layerIdx: number = 3;
			if (layerIdx === -1) { throw new Error("Couldnt allocate layer."); }
			let material = this.layers.getLayerMaterial(layerIdx);
			material.setColor([1.0, 1.0, 1.0]);
			material.setRoughness(0.6);
			this.layers.layerOrder[3] = layerIdx;
			this.layers.setLayerActive(3, true);
		}

		this.heightmapController = new HeightmapController(this.layers);
		this.terrain = new Terrain();

		this.resized();
	}

	static checkGLError(name?: string) {
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

	render(_currentTime: number, _deltaTime: number) {
		this.heightmapController.render();

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		let viewProjection = mat4.create();
		mat4.multiply(viewProjection, this.camera.projectionMatrix, this.camera.viewMatrix);

		this.terrain.draw(
			viewProjection,
			this.camera.getPosition(),
			this.sunDir,
			this.heightmapController.textures,
			this.layers,
			this.mouseOverCanvas,
			this.mousePosX,
			this.mousePosY,
		);
		// console.log(this.terrain.getMouseWorldSpacePos());
	}

	resized() {
		let w = this.canvas.clientWidth; // gl.canvas.parentNode.clientWidth
		let h = this.canvas.clientHeight;

		gl.canvas.width = w;
		gl.canvas.height = h;

		gl.viewport(0, 0, w, h);
		this.camera.aspectRatio = w / h;
		this.camera.updateProjectionMatrix();
		this.terrain.resize();
	}

	getTerrain() {
		return this.terrain;
	}

	getHeightmapRenderer() {
		return this.heightmapController;
	}

	setCanvasMouseState(overCanvas: boolean, canvasMouseX: number, canvasMouseY: number) {
		this.mouseOverCanvas = overCanvas;
		this.mousePosX = canvasMouseX;
		this.mousePosY = canvasMouseY;
	}
}
