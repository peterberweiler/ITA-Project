import Framebuffer from "../Renderer/Framebuffer";
import Global from "../Renderer/Global";
import Shader from "../Renderer/Shader";
import Texture from "../Renderer/Texture";

const fullscreenVSSource = require("../Shader/fullscreenPass.vs").default;
const perlinFSSource = require("../Shader/perlinPass.fs").default;

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

export default class HeightmapRenderer {
	framebuffer: Framebuffer;
	heightmapTexture: Texture;
	fullscreenMesh: FullscreenMesh;
	size: [number, number] = [1024, 1024];
	perlinShader: Shader;
	needsUpdate = true;

	constructor(heightmapTexture: Texture) {
		gl = Global.gl;

		this.framebuffer = new Framebuffer();
		this.fullscreenMesh = new FullscreenMesh();
		this.heightmapTexture = heightmapTexture;
		this.perlinShader = new Shader(fullscreenVSSource, perlinFSSource);

		this.heightmapTexture.updateFloatRedData(this.size, null); // force texture into R Format
		this.framebuffer.setColorAttachment(this.heightmapTexture);
		Framebuffer.unbind();
	}

	scheduleUpdate() {
		this.needsUpdate = true;
	}

	//TODO delete
	applyDummyData() {
		// create dummy heightmap data
		const f = (x: number) => (Math.cos(x * 2) * 0.1) + (Math.sin(x * 0.005) * 4);
		const data = new Float32Array(this.size[0] * this.size[1]);
		for (let y = 0; y < this.size[1]; ++y) {
			for (let x = 0; x < this.size[0]; ++x) {
				const index = ((this.size[0] * y) + x);
				data[index] = f(x) * f(y);
			}
		}
		this.heightmapTexture.updateFloatRedData(this.size, data);
	}

	render() {
		if (!this.needsUpdate) { return; }
		this.needsUpdate = false;

		// gl.bindVertexArray(null);
		this.framebuffer.bind();
		this.fullscreenMesh.bind();

		gl.clear(gl.DEPTH_BUFFER_BIT);
		this.perlinPass();

		Framebuffer.unbind();
	}

	perlinPass() {
		this.perlinShader.use();
		const attribute = this.perlinShader.getAttributeLocation("aVertexPosition");
		gl.enableVertexAttribArray(attribute);
		gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 12, 0);

		const seeds = [1, 200, 300, 0, 10, 0];
		const amplitudes = [300, 200, 50, 8, 1, 0.2];
		const scales = [500, 330, 120, 40, 10, 1];
		const offsets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		const layerCount = 6;

		gl.uniform1fv(this.perlinShader.getUniformLocation("uSeed"), seeds);
		gl.uniform1fv(this.perlinShader.getUniformLocation("uAmplitude"), amplitudes);
		gl.uniform1fv(this.perlinShader.getUniformLocation("uScale"), scales);
		gl.uniform2fv(this.perlinShader.getUniformLocation("uOffset"), offsets);
		gl.uniform2fv(this.perlinShader.getUniformLocation("uHeightMapSize"), this.size);
		gl.uniform1i(this.perlinShader.getUniformLocation("uLayerCount"), layerCount);

		this.fullscreenMesh.draw();
	}
}

