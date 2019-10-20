import Framebuffer from "../Framebuffer";
import Global from "../Global";
import Texture from "../Texture";
import { HeightBrushPass, InvertPass, Pass, PerlinPass } from "./Passes";

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
	private framebuffer: Framebuffer;
	private heightmapTextures: Texture[];
	private currentHeightmapIndex: number;
	private fullscreenMesh: FullscreenMesh;
	private size: [number, number] = [1024, 1024];
	private passQueue: Pass[] = [];

	readonly perlinPass: PerlinPass;
	readonly invertPass: InvertPass;
	readonly heightBrushPass: HeightBrushPass;

	constructor() {
		gl = Global.gl;

		this.framebuffer = new Framebuffer();
		this.fullscreenMesh = new FullscreenMesh();
		this.heightmapTextures = [new Texture(), new Texture()];
		this.currentHeightmapIndex = 0;

		this.perlinPass = new PerlinPass();
		this.invertPass = new InvertPass();
		this.heightBrushPass = new HeightBrushPass();

		for (const hm of this.heightmapTextures) {
			hm.updateFloatRedData(this.size, null); // force texture into R Format
		}

		this.framebuffer.setColorAttachment(this.getCurrentHeightmap());
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

			pass.initalizeRun(this.getCurrentHeightmap());

			this.framebuffer.setColorAttachment(this.nextHeightmap());
			this.fullscreenMesh.draw();
		}

		Framebuffer.unbind();
	}

	getCurrentHeightmap(): Texture {
		return this.heightmapTextures[this.currentHeightmapIndex];
	}

	nextHeightmap() {
		++this.currentHeightmapIndex;
		this.currentHeightmapIndex %= this.heightmapTextures.length;

		return this.heightmapTextures[this.currentHeightmapIndex];
	}
}
