import Framebuffer from "../Framebuffer";
import Global from "../Global";
import Texture, { PingPongTexture } from "../Texture";
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
	private heightmapTexture: PingPongTexture;
	private albedomapTexture: PingPongTexture;

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
		this.heightmapTexture = new PingPongTexture();
		this.albedomapTexture = new PingPongTexture();

		this.perlinPass = new PerlinPass();
		this.invertPass = new InvertPass();
		this.heightBrushPass = new HeightBrushPass();

		this.heightmapTexture.initialize((hm) => hm.updateFloatRedData(this.size, null)); // force texture into R Format

		this.albedomapTexture.initialize((am) => {
			const data = new Float32Array(this.size[0] * this.size[1] * 4);
			for (let x = 0; x < this.size[0]; ++x) {
				for (let y = 0; y < this.size[1]; ++y) {
					const i = ((y * this.size[0]) + x) * 4;
					data[i] = 0;
					data[i + 1] = 0.6;
					data[i + 2] = 0;
					data[i + 3] = 1;

					if (Math.random() < 0.5) {
						data[i] = 0;
						data[i + 1] = 0;
						data[i + 2] = 0.1;
					}
				}
			}
			am.updateFloatRGBAData(this.size, data); // force texture into R Format
		});

		this.framebuffer.setColorAttachment(this.heightmapTexture.current());
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

			pass.initalizePass(this.heightmapTexture, this.albedomapTexture, this.framebuffer);

			this.fullscreenMesh.draw();

			pass.finalizePass(this.framebuffer);
		}

		Framebuffer.unbind();
	}

	getCurrentAlbedomap(): Texture {
		return this.albedomapTexture.current();
	}
	getCurrentHeightmap(): Texture {
		return this.heightmapTexture.current();
	}
}
