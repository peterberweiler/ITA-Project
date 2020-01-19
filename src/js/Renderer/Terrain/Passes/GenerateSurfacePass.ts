import Framebuffer from "../../Framebuffer";
import { gl, TextureBundle } from "../../Global";
import { Pass } from "./Passes";

const generateSurfaceFSSource = require("../../../Shader/generateSurface.fs").default;

export class GenerateSurfacePass extends Pass {
	public minSlopes = new Array<number>(16);
	public maxSlopes = new Array<number>(16);
	public minHeights = new Array<number>(16);
	public maxHeights = new Array<number>(16);
	private readonly uHeightmapTexture: WebGLUniformLocation;
	private readonly uMinSlopes: WebGLUniformLocation;
	private readonly uMaxSlopes: WebGLUniformLocation;
	private readonly uMinHeights: WebGLUniformLocation;
	private readonly uMaxHeights: WebGLUniformLocation;
	private readonly uTexelSizeInMeters: WebGLUniformLocation;
	private readonly uHeightScaleInMeters: WebGLUniformLocation;

	constructor() {
		super(generateSurfaceFSSource);
		this.uHeightmapTexture = this.shader.getUniformLocation("uHeightmapTexture");
		this.uMinSlopes = this.shader.getUniformLocation("uMinSlopes");
		this.uMaxSlopes = this.shader.getUniformLocation("uMaxSlopes");
		this.uMinHeights = this.shader.getUniformLocation("uMinHeights");
		this.uMaxHeights = this.shader.getUniformLocation("uMaxHeights");
		this.uTexelSizeInMeters = this.shader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMeters = this.shader.getUniformLocation("uHeightScaleInMeters");
		this.setSurfaceTypes([
			[0, 0.8, -200, 1000],
			[0, 0.8, -1000, -30],
			[0.7, 1, -1000, -150],
			[0.5, 1, -150, 1000],
		]);
	}

	setSurfaceTypes(types: [number, number, number, number][]) {
		this.minSlopes.fill(Number.MAX_VALUE);
		this.maxSlopes.fill(Number.MAX_VALUE);
		this.minHeights.fill(Number.MAX_VALUE);
		this.maxHeights.fill(Number.MAX_VALUE);
		for (let i = 0; i < types.length; ++i) {
			const [minSlopes, maxSlopes, minHeights, maxHeights] = types[i];
			this.minSlopes[i] = minSlopes;
			this.maxSlopes[i] = maxSlopes;
			this.minHeights[i] = minHeights;
			this.maxHeights[i] = maxHeights;
		}
	}

	initalizePass(textures: TextureBundle, _framebuffer: Framebuffer): void {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.uHeightmapTexture, 0);
		this.shader.setUniformFv(this.uMinSlopes, this.minSlopes);
		this.shader.setUniformFv(this.uMaxSlopes, this.maxSlopes);
		this.shader.setUniformFv(this.uMinHeights, this.minHeights);
		this.shader.setUniformFv(this.uMaxHeights, this.maxHeights);
		this.shader.setUniformF(this.uTexelSizeInMeters, 1);
		this.shader.setUniformF(this.uHeightScaleInMeters, 1);
		gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, textures.layers.weightMapNext, 0, 0);
		gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, textures.layers.weightMapNext, 0, 1);
		textures.layers.swapWeightMaps();
		gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	}

	finalizePass(framebuffer: Framebuffer) {
		framebuffer.unsetColorAttachment(0);
		framebuffer.unsetColorAttachment(1);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
	}
}
