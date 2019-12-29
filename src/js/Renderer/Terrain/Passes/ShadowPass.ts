import { vec3 } from "gl-matrix";
import Framebuffer from "../../Framebuffer";
import { TextureBundle } from "../../Global";
import { Pass } from "./Passes";

const shadowFSSource = require("../../../Shader/terrainShadow.fs").default;

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
