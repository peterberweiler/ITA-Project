import Framebuffer from "../../Framebuffer";
import { TextureBundle } from "../../Global";
import { Pass } from "./Passes";

const heightBrushFSSource = require("../../../Shader/heightBrushPass.fs").default;

export type HeightBrushPassData = {
	points: number[],
	type: number,
	radius: number,
	strength: number,
}

export class HeightBrushPass extends Pass {
	private dataQueue: HeightBrushPassData[] = [];
	static readonly NORMAL = 0.1;
	static readonly FLATTEN = 16.1;
	private readonly uPoints: WebGLUniformLocation;
	private readonly uTexture: WebGLUniformLocation;
	private readonly uBrushesTexture: WebGLUniformLocation;
	private readonly uPointCount: WebGLUniformLocation;
	private readonly uType: WebGLUniformLocation;
	private readonly uRadius: WebGLUniformLocation;
	private readonly uStrength: WebGLUniformLocation;

	constructor() {
		super(heightBrushFSSource);
		this.uTexture = this.shader.getUniformLocation("uTexture");
		this.uBrushesTexture = this.shader.getUniformLocation("uBrushesTexture");
		this.uType = this.shader.getUniformLocation("uType");
		this.uRadius = this.shader.getUniformLocation("uRadius");
		this.uStrength = this.shader.getUniformLocation("uStrength");
		this.uPoints = this.shader.getUniformLocation("uPoints");
		this.uPointCount = this.shader.getUniformLocation("uPointCount");
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		textures.heightMap.current().bind(0);
		this.shader.setUniformI(this.uTexture, 0);
		textures.brushes.bind(1);
		this.shader.setUniformI(this.uBrushesTexture, 1);
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
