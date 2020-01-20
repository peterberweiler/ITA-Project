import Framebuffer from "../../Framebuffer";
import { gl, TextureBundle } from "../../Global";
import Renderer from "../../Renderer";
import { Pass } from "./Passes";

const fragSource = require("../../../Shader/generateHardness.fs").default;

export class GenerateHardnessPass extends Pass {
	private uTerrainHeightTextureLocation: WebGLUniformLocation;
	private uSedimentHardnessTextureLocation: WebGLUniformLocation;
	private uTexelSizeInMetersLocation: WebGLUniformLocation;
	private uHeightScaleInMetersLocation: WebGLUniformLocation;
	private uUpdateValuesLocation: WebGLUniformLocation;
	public updateValues: boolean;

	constructor() {
		super(fragSource);
		this.uTerrainHeightTextureLocation = this.shader.getUniformLocation("uTerrainHeightTexture");
		this.uSedimentHardnessTextureLocation = this.shader.getUniformLocation("uSedimentHardnessTexture");
		this.uTexelSizeInMetersLocation = this.shader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation = this.shader.getUniformLocation("uHeightScaleInMeters");
		this.uUpdateValuesLocation = this.shader.getUniformLocation("uUpdateValues");
		this.updateValues = false;
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		Renderer.checkGLError();
		this.shader.setUniformI(this.uTerrainHeightTextureLocation, 0);
		this.shader.setUniformI(this.uSedimentHardnessTextureLocation, 1);
		this.shader.setUniformF(this.uTexelSizeInMetersLocation, 1.0); // TODO
		this.shader.setUniformF(this.uHeightScaleInMetersLocation, 1.0); // TODO
		this.shader.setUniformI(this.uUpdateValuesLocation, this.updateValues ? 1 : 0);

		this.updateValues = false;

		Renderer.checkGLError();
		textures.heightMap.current().bind(0);
		textures.sedimentHardnessMap.current().bind(1);

		Renderer.checkGLError();
		framebuffer.setColorAttachment(textures.sedimentHardnessMap.next(), 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		Renderer.checkGLError();
	}

	finalizePass(_framebuffer: Framebuffer) {
		Renderer.checkGLError();
		_framebuffer.unsetColorAttachment(0);
		Renderer.checkGLError();
	}
}
