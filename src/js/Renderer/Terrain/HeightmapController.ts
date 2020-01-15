import Framebuffer from "../Framebuffer";
import { gl, TextureBundle } from "../Global";
import Texture, { PingPongTexture } from "../Texture";
import Layers from "./Layers";
import { GenerateSurfacePass } from "./Passes/GenerateSurfacePass";
import { HeightBrushPass } from "./Passes/HeightBrushPass";
import { LayerBrushPass } from "./Passes/LayerBrushPass";
import { InvertPass, Pass } from "./Passes/Passes";
import { PerlinPass } from "./Passes/PerlinPass";

export default class HeightmapController {
	private readonly framebuffer: Framebuffer;

	readonly textures: TextureBundle;
	private size: [number, number] = [1024, 1024];
	private passQueue: Pass[] = [];

	readonly perlinPass: PerlinPass;
	readonly invertPass: InvertPass;
	readonly heightBrushPass: HeightBrushPass;
	readonly layerBrushPass: LayerBrushPass;
	readonly generateSurfacePass: GenerateSurfacePass;

	constructor(layers: Layers) {
		this.framebuffer = new Framebuffer();

		this.textures = {
			heightMap: new PingPongTexture(),
			shadowMap: new Texture(),
			layers,
			brushes: Texture.fromRGBAImage("/data/brushes/brushes.png"),
		};

		this.perlinPass = new PerlinPass();
		this.invertPass = new InvertPass();
		this.heightBrushPass = new HeightBrushPass();
		this.layerBrushPass = new LayerBrushPass();
		this.generateSurfacePass = new GenerateSurfacePass();

		// force empty textures into correct format
		this.textures.heightMap.initialize((tex) => tex.updateFloatRedData(this.size, null));
		this.textures.shadowMap.updateFloatRedData(this.size, null);

		this.framebuffer.setColorAttachment(this.textures.heightMap.current());
		Framebuffer.unbind();
	}

	queuePass(pass: Pass) {
		this.passQueue.push(pass);
	}

	render() {
		if (this.passQueue.length === 0) { return; }

		this.framebuffer.bind();

		let pass;
		while ((pass = this.passQueue.shift())) {
			gl.clear(gl.DEPTH_BUFFER_BIT);

			pass.shader.use();

			pass.initalizePass(this.textures, this.framebuffer);

			gl.drawArrays(gl.TRIANGLES, 0, 3);

			pass.finalizePass(this.framebuffer);
		}

		Framebuffer.unbind();
	}

	getHeightMapData(): Float32Array {
		const fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.viewport(0, 0, this.size[0], this.size[1]);

		const data = new Float32Array(this.size[0] * this.size[1]);
		const texId = this.textures.heightMap.current().id;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texId, 0);
		gl.readPixels(0, 0, this.size[0], this.size[1], gl.RED, gl.FLOAT, data);

		gl.deleteFramebuffer(fb);
		Framebuffer.unbind();
		return data;
	}

	getLayerWeightData(): [Float32Array, Float32Array] {
		const fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.viewport(0, 0, this.size[0], this.size[1]);

		const data0 = new Float32Array(this.size[0] * this.size[1] * 4);
		const data1 = new Float32Array(this.size[0] * this.size[1] * 4);

		gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.textures.layers.weightMapCurrent, 0, 0);
		gl.readPixels(0, 0, this.size[0], this.size[1], gl.RGBA, gl.FLOAT, data0);

		gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.textures.layers.weightMapCurrent, 0, 1);
		gl.readPixels(0, 0, this.size[0], this.size[1], gl.RGBA, gl.FLOAT, data1);

		gl.deleteFramebuffer(fb);
		Framebuffer.unbind();

		return [data0, data1];
	}

	setHeightMapData(data: Float32Array) {
		if (data.length !== this.size[0] * this.size[1]) {
			throw new Error("setHeightMapData data is wrong size");
		}
		this.textures.heightMap.current().updateFloatRedData(this.size, data);
	}

	setLayerWeightData(data: [Float32Array, Float32Array]) {
		if (data[0].length !== this.size[0] * this.size[1] * 4 ||
			data[1].length !== this.size[0] * this.size[1] * 4) {
			throw new Error("setLayerWeightData datas are wrong size");
		}

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.textures.layers.weightMapCurrent);

		gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, this.size[0], this.size[1], 1, gl.RGBA, gl.FLOAT, data[0]);
		gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 1, this.size[0], this.size[1], 1, gl.RGBA, gl.FLOAT, data[1]);
	}
}
