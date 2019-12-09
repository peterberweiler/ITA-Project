import { mat4, vec3 } from "gl-matrix";
import Global, { TextureBundle } from "../Global";
import Texture from "../Texture";
import Surface from "./Surface";
import TerrainClipMapMesh from "./TerrainClipMapMesh";
import TerrainDrawParams from "./TerrainDrawParams";
import TerrainUniformGridMesh from "./TerrainUniformGridMesh";

let gl: WebGL2RenderingContext;

export default class Terrain {
	private clipMapMesh: TerrainClipMapMesh;
	private uniformGridMesh: TerrainUniformGridMesh;
	private fbo: WebGLFramebuffer | null;
	private depthAttachment: Texture;
	private colorAttachment: Texture;
	private readBackDepthAttachment: Texture;

	private texelSizeInMeters: number = 1.0;
	private heightScaleInMeters: number = 1.0;
	private worldSpaceMousePos: vec3 = vec3.create();

	readonly surface: Surface;

	constructor() {
		gl = Global.gl;

		this.clipMapMesh = new TerrainClipMapMesh();
		this.uniformGridMesh = new TerrainUniformGridMesh();

		this.fbo = gl.createFramebuffer();
		this.depthAttachment = new Texture();
		this.depthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, gl.canvas.width, gl.canvas.height);
		this.colorAttachment = new Texture();
		this.colorAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.canvas.width, gl.canvas.height);
		this.readBackDepthAttachment = new Texture();
		this.readBackDepthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.canvas.width, gl.canvas.height);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthAttachment.id, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorAttachment.id, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.readBackDepthAttachment.id, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		this.surface = new Surface();
	}

	draw(viewProjection: mat4, camPos: vec3, textures: TextureBundle, readMouseWorldSpacePos: boolean = false, mousePosX: number = 0, mousePosY: number = 0) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		let buffers: number[] = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];
		gl.drawBuffers(buffers);

		gl.clearBufferfv(gl.COLOR, 0, [0.529, 0.808, 0.922, 1.0]);
		gl.clearBufferfv(gl.COLOR, 1, [0.0, 0.0, 0.0, 1.0]);
		gl.clearBufferfv(gl.DEPTH, 0, [1.0]);

		// draw terrain
		{
			let terrainDrawParams = new TerrainDrawParams();
			terrainDrawParams.viewProjection = viewProjection;
			terrainDrawParams.camPos = camPos;
			terrainDrawParams.texelSizeInMeters = this.texelSizeInMeters;
			terrainDrawParams.heightScaleInMeters = this.heightScaleInMeters;
			terrainDrawParams.heightMap = textures.heightMap.current().id;
			terrainDrawParams.shadowMap = textures.shadowMap.id;
			terrainDrawParams.weightMap = textures.surfaceWeightMaps[0].current().id;

			//console.time("render");
			//this.clipMapMesh.draw(terrainDrawParams);
			this.uniformGridMesh.draw(terrainDrawParams);
			//console.timeEnd("render");
		}

		if (readMouseWorldSpacePos) {
			gl.readBuffer(gl.COLOR_ATTACHMENT1);
			let resultBuffer = new Float32Array(4);
			gl.readPixels(mousePosX, gl.canvas.height - mousePosY, 1, 1, gl.RGBA, gl.FLOAT, resultBuffer);
			this.worldSpaceMousePos[0] = resultBuffer[0];
			this.worldSpaceMousePos[1] = resultBuffer[1];
			this.worldSpaceMousePos[2] = resultBuffer[2];
		}

		gl.readBuffer(gl.COLOR_ATTACHMENT0);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
		gl.blitFramebuffer(0, 0, gl.canvas.width, gl.canvas.height, 0, 0, gl.canvas.width, gl.canvas.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}

	resize() {
		// delete textures
		gl.deleteTexture(this.depthAttachment.id);
		gl.deleteTexture(this.colorAttachment.id);
		gl.deleteTexture(this.readBackDepthAttachment.id);

		// create them again
		let id = gl.createTexture();
		if (!id) { throw new Error("Couldn't create texture."); }
		this.depthAttachment.id = id;

		id = gl.createTexture();
		if (!id) { throw new Error("Couldn't create texture."); }
		this.colorAttachment.id = id;

		id = gl.createTexture();
		if (!id) { throw new Error("Couldn't create texture."); }
		this.readBackDepthAttachment.id = id;

		this.depthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, gl.canvas.width, gl.canvas.height);
		this.colorAttachment = new Texture();
		this.colorAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.canvas.width, gl.canvas.height);
		this.readBackDepthAttachment = new Texture();
		this.readBackDepthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.canvas.width, gl.canvas.height);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthAttachment.id, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorAttachment.id, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.readBackDepthAttachment.id, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	getMouseWorldSpacePos() {
		return this.worldSpaceMousePos;
	}
}
