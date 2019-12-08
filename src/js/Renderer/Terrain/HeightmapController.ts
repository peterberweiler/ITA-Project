import Framebuffer from "../Framebuffer";
import Global, { TextureBundle } from "../Global";
import Texture, { PingPongTexture } from "../Texture";
import { GenerateSurfacePass, HeightBrushPass, InvertPass, Pass, PerlinPass, ShadowPass } from "./Passes";

let gl: WebGL2RenderingContext;

class FullscreenMesh {
	vertexBuffer: WebGLBuffer;
	indexBuffer: WebGLBuffer;

	constructor() {
		gl = Global.gl;

		const vertexBuffer = gl.createBuffer();
		const indexBuffer = gl.createBuffer();
		if (!vertexBuffer || !indexBuffer) {
			throw new Error("Couldn't create Buffers for fullscreen mesh");
		}
		this.vertexBuffer = vertexBuffer;
		this.indexBuffer = indexBuffer;

		this.bind();

		const vertexBufferArray = new Float32Array([
			-1, -1, 0,
			-1, 3, 0,
			3, -1, 0,
		]);
		const indexBufferArray = new Uint32Array([0, 1, 2]);

		gl.bufferData(gl.ARRAY_BUFFER, vertexBufferArray, gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferArray, gl.STATIC_DRAW);
	}

	bind() {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	}

	draw() {
		this.bind();
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_INT, 0);
	}
}

export default class HeightmapController {
	private readonly framebuffer: Framebuffer;

	readonly textures: TextureBundle;
	private readonly fullscreenMesh: FullscreenMesh;
	private size: [number, number] = [1024, 1024];
	private passQueue: Pass[] = [];

	readonly perlinPass: PerlinPass;
	readonly invertPass: InvertPass;
	readonly heightBrushPass: HeightBrushPass;
	readonly shadowPass: ShadowPass;
	readonly generateSurfacePass: GenerateSurfacePass;

	constructor() {
		gl = Global.gl;

		this.framebuffer = new Framebuffer();
		this.fullscreenMesh = new FullscreenMesh();

		this.textures = {
			heightMap: new PingPongTexture(),
			shadowMap: new Texture(),
			surfaceWeightMaps: [
				new PingPongTexture(),
				new PingPongTexture(),
				new PingPongTexture(),
				new PingPongTexture(),
			],
		};

		this.perlinPass = new PerlinPass();
		this.invertPass = new InvertPass();
		this.heightBrushPass = new HeightBrushPass();
		this.shadowPass = new ShadowPass();
		this.generateSurfacePass = new GenerateSurfacePass();

		// force empty textures into correct format
		this.textures.heightMap.initialize((tex) => tex.updateFloatRedData(this.size, null));
		this.textures.shadowMap.updateFloatRedData(this.size, null);
		// this.textures.surface.initialize((tex) => tex.updateFloatRGBAData(this.size, null));

		//TODO: REMOVE !!!!!!!!!!!!!!!!
		this.textures.surfaceWeightMaps.forEach(a => a.initialize((tex) => {
			const data = new Uint8Array(this.size[0] * this.size[1] * 4);
			for (let x = 0; x < this.size[0]; ++x) {
				for (let y = 0; y < this.size[1]; ++y) {
					const i = ((y * this.size[0]) + x) * 4;
					data[i] = 128;
					data[i + 1] = 0;
					data[i + 2] = 0;
					data[i + 3] = 255;
				}
			}
			tex.updateRGBAData(this.size, data);
		}));

		this.framebuffer.setColorAttachment(this.textures.heightMap.current());
		Framebuffer.unbind();
	}

	queuePass(pass: Pass) {
		this.passQueue.push(pass);
	}

	render() {
		if (this.passQueue.length === 0) { return; }

		// gl.bindVertexArray(null);
		this.framebuffer.bind();
		this.fullscreenMesh.bind();

		let pass;
		while ((pass = this.passQueue.shift())) {
			gl.clear(gl.DEPTH_BUFFER_BIT);

			pass.shader.use();
			const attribute = pass.shader.getAttributeLocation("aVertexPosition");
			gl.enableVertexAttribArray(attribute);
			gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 12, 0);

			pass.initalizePass(this.textures, this.framebuffer);

			this.fullscreenMesh.draw();

			pass.finalizePass(this.framebuffer);
		}

		Framebuffer.unbind();
	}
}
