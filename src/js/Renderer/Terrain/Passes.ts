import { vec3 } from "gl-matrix";
import Framebuffer from "../Framebuffer";
import Global, { TextureBundle } from "../Global";
import Shader from "../Shader";

const fullscreenVSSource = require("../../Shader/fullscreenPass.vs").default;
const perlinFSSource = require("../../Shader/perlinPass.fs").default;
const invertFSSource = require("../../Shader/invertPass.fs").default;
const heightBrushFSSource = require("../../Shader/heightBrushPass.fs").default;
const layerBrushFSSource = require("../../Shader/layerBrushPass.fs").default;
const shadowFSSource = require("../../Shader/terrainShadow.fs").default;
const generateSurfaceFSSource = require("../../Shader/generateSurface.fs").default;

let gl: WebGL2RenderingContext;

export abstract class Pass {
	private static vertexShader?: WebGLShader;
	readonly shader: Shader;

	constructor(fragmentShaderSource: string) {
		gl = Global.gl;
		if (!Pass.vertexShader) {
			Pass.vertexShader = Shader.compile(fullscreenVSSource, gl.VERTEX_SHADER);
		}

		this.shader = new Shader(Pass.vertexShader, fragmentShaderSource);
	}

	abstract initalizePass(textures: TextureBundle, framebuffer: Framebuffer): void;

	finalizePass(_framebuffer: Framebuffer) {
		//
	}
}

export class PerlinPass extends Pass {
	constructor() { super(perlinFSSource); }

	seeds = [1, 200, 300, 0, 10, 800, 3000, 10000];
	amplitudes = [512, 128, 64, 32, 16, 8, 1, 0.5];
	scales = [512, 256, 128, 64, 32, 16, 8, 2];
	offsets = [0, 0];
	ridgeFactor = [1, 0, 1, 0, 1, 1, 0];

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		gl.uniform1fv(this.shader.getUniformLocation("uSeed"), this.seeds);
		gl.uniform1fv(this.shader.getUniformLocation("uAmplitude"), this.amplitudes);
		gl.uniform1fv(this.shader.getUniformLocation("uScale"), this.scales);
		gl.uniform2fv(this.shader.getUniformLocation("uOffset"), this.offsets);
		gl.uniform1fv(this.shader.getUniformLocation("uRidgeFactor"), this.ridgeFactor);
		gl.uniform1i(this.shader.getUniformLocation("uLayerCount"), this.seeds.length);

		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		framebuffer.setColorAttachment(textures.heightMap.next());
	}
}

export class InvertPass extends Pass {
	constructor() { super(invertFSSource); }

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.shader.getUniformLocation("uTexture"), 0);

		framebuffer.setColorAttachment(textures.heightMap.next());
	}
}

type HeightBrushPassData = {
	points: number[],
	type: number,
	radius: number,
	strength: number,
}
type LayerBrushPassData = {
	points: number[],
	type: number,
	radius: number,
	strength: number,
	minSlope: number,
	maxSlope: number,
}

export class HeightBrushPass extends Pass {
	private dataQueue: HeightBrushPassData[] = [];

	static readonly NORMAL = 0.1;
	static readonly FLATTEN = 1.1;

	private readonly uPoints: WebGLUniformLocation;
	private readonly uTexture: WebGLUniformLocation;
	private readonly uPointCount: WebGLUniformLocation;
	private readonly uType: WebGLUniformLocation;
	private readonly uRadius: WebGLUniformLocation;
	private readonly uStrength: WebGLUniformLocation;

	constructor() {
		super(heightBrushFSSource);
		this.uTexture = this.shader.getUniformLocation("uTexture");
		this.uType = this.shader.getUniformLocation("uType");
		this.uRadius = this.shader.getUniformLocation("uRadius");
		this.uStrength = this.shader.getUniformLocation("uStrength");
		this.uPoints = this.shader.getUniformLocation("uPoints");
		this.uPointCount = this.shader.getUniformLocation("uPointCount");
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.uTexture, 0);

		const data = this.dataQueue.shift();

		if (data) {
			if (data.points.length >= 100) {
				console.error("Too much points for HeightBrushPass");
			}
			this.shader.setUniformVec2(this.uPoints, data.points);
			this.shader.setUniformI(this.uPointCount, data.points.length / 2);
			this.shader.setUniformI(this.uType, data.type);
			this.shader.setUniformF(this.uRadius, data.radius);
			this.shader.setUniformF(this.uStrength, data.strength);
		}
		else {
			this.shader.setUniformF(this.shader.getUniformLocation("uPointCount"), 0);
		}

		framebuffer.setColorAttachment(textures.heightMap.next());
	}

	queueData(data: HeightBrushPassData) {
		this.dataQueue.push(data);
	}
}

export class LayerBrushPass extends Pass {
	private dataQueue: LayerBrushPassData[] = [];

	private readonly uPoints: WebGLUniformLocation;
	private readonly uHeightmapTexture: WebGLUniformLocation;
	private readonly uSurfaceMapTexture0: WebGLUniformLocation;
	private readonly uPointCount: WebGLUniformLocation;
	private readonly uType: WebGLUniformLocation;
	private readonly uRadius: WebGLUniformLocation;
	private readonly uStrength: WebGLUniformLocation;

	private readonly uMinSlope: WebGLUniformLocation;
	private readonly uMaxSlope: WebGLUniformLocation;

	constructor() {
		super(layerBrushFSSource);
		this.uHeightmapTexture = this.shader.getUniformLocation("uHeightmapTexture");
		this.uSurfaceMapTexture0 = this.shader.getUniformLocation("uSurfaceMapTexture0");
		this.uType = this.shader.getUniformLocation("uType");
		this.uRadius = this.shader.getUniformLocation("uRadius");
		this.uStrength = this.shader.getUniformLocation("uStrength");
		this.uPoints = this.shader.getUniformLocation("uPoints");
		this.uPointCount = this.shader.getUniformLocation("uPointCount");

		this.uMinSlope = this.shader.getUniformLocation("uMinSlope");
		this.uMaxSlope = this.shader.getUniformLocation("uMaxSlope");
	}

	//TODO: include all 4 weight maps

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.uHeightmapTexture, 0);

		textures.surfaceWeightMaps[0].current().bind(1);
		this.shader.setUniformI(this.uSurfaceMapTexture0, 1);

		const data = this.dataQueue.shift();
		if (data) {
			if (data.points.length >= 100) {
				console.error("Too much points for LayerBrushPass");
			}
			this.shader.setUniformVec2(this.uPoints, data.points);
			this.shader.setUniformI(this.uPointCount, data.points.length / 2);
			this.shader.setUniformI(this.uType, data.type);
			this.shader.setUniformF(this.uRadius, data.radius);
			this.shader.setUniformF(this.uStrength, data.strength);

			this.shader.setUniformF(this.uMinSlope, data.minSlope);
			this.shader.setUniformF(this.uMaxSlope, data.maxSlope);
		}
		else {
			this.shader.setUniformF(this.shader.getUniformLocation("uPointCount"), 0);
		}

		framebuffer.setColorAttachment(textures.surfaceWeightMaps[0].next());
	}

	queueData(data: LayerBrushPassData) {
		this.dataQueue.push(data);
	}
}

export class ShadowPass extends Pass {
	lightDir: vec3 | number[] = [0, 1.118, 0.559];
	texelSizeInMeters: number = 1;
	heightScaleInMeters: number = 1;

	private readonly uHeightMap: WebGLUniformLocation;
	private readonly uLightDir: WebGLUniformLocation;
	private readonly uTexelSizeInMeters: WebGLUniformLocation;
	private readonly uHeightScaleInMeters: WebGLUniformLocation;

	constructor() {
		super(shadowFSSource);
		this.uHeightMap = this.shader.getUniformLocation("uHeightMap");
		this.uLightDir = this.shader.getUniformLocation("uLightDir");
		this.uTexelSizeInMeters = this.shader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMeters = this.shader.getUniformLocation("uHeightScaleInMeters");
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer): void {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.uHeightMap, 0);
		this.shader.setUniformVec3(this.uLightDir, this.lightDir);
		this.shader.setUniformF(this.uTexelSizeInMeters, this.texelSizeInMeters);
		this.shader.setUniformF(this.uHeightScaleInMeters, this.heightScaleInMeters);

		framebuffer.setColorAttachment(textures.shadowMap);
	}
}

export class GenerateSurfacePass extends Pass {
	public minSlopes = new Array<number>(16);
	public maxSlopes = new Array<number>(16);
	public minHeights = new Array<number>(16);
	public maxHeights = new Array<number>(16);

	private readonly uMinSlopes: WebGLUniformLocation;
	private readonly uMaxSlopes: WebGLUniformLocation;
	private readonly uMinHeights: WebGLUniformLocation;
	private readonly uMaxHeights: WebGLUniformLocation;

	private readonly uTexelSizeInMeters: WebGLUniformLocation
	private readonly uHeightScaleInMeters: WebGLUniformLocation

	constructor() {
		super(generateSurfaceFSSource);
		this.uMinSlopes = this.shader.getUniformLocation("uMinSlopes");
		this.uMaxSlopes = this.shader.getUniformLocation("uMaxSlopes");
		this.uMinHeights = this.shader.getUniformLocation("uMinHeights");
		this.uMaxHeights = this.shader.getUniformLocation("uMaxHeights");
		this.uTexelSizeInMeters = this.shader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMeters = this.shader.getUniformLocation("uHeightScaleInMeters");

		this.setSurfaceTypes([
			[0.5, 1, -150, 1000], // snow
			[0, 0.8, -200, 1000], // stone
			[0.7, 1, -1000, -150], // grass
			[0, 0.8, -1000, -30], // dirt
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

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer): void {
		textures.heightMap.current().bind(0);

		this.shader.setUniformFv(this.uMinSlopes, this.minSlopes);
		this.shader.setUniformFv(this.uMaxSlopes, this.maxSlopes);
		this.shader.setUniformFv(this.uMinHeights, this.minHeights);
		this.shader.setUniformFv(this.uMaxHeights, this.maxHeights);

		this.shader.setUniformF(this.uTexelSizeInMeters, 1);
		this.shader.setUniformF(this.uHeightScaleInMeters, 1);

		framebuffer.setColorAttachment(textures.surfaceWeightMaps[0].current(), 0);
		framebuffer.setColorAttachment(textures.surfaceWeightMaps[1].current(), 1);
		framebuffer.setColorAttachment(textures.surfaceWeightMaps[2].current(), 2);
		framebuffer.setColorAttachment(textures.surfaceWeightMaps[3].current(), 3);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);
	}

	finalizePass(framebuffer: Framebuffer) {
		framebuffer.unsetColorAttachment(1);
		framebuffer.unsetColorAttachment(2);
		framebuffer.unsetColorAttachment(3);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
	}
}
