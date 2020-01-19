import Framebuffer from "../../Framebuffer";
import { erosionParams, gl, TextureBundle } from "../../Global";
import Renderer from "../../Renderer";
import { Pass } from "./Passes";

const advectionFragSource = require("../../../Shader/erosionSedimentAdvection.fs").default;

export class ErosionSedimentAdvectionPass extends Pass {
	private uSedimentHardnessTextureLocation2: WebGLUniformLocation;
	private uVelocityTextureLocation2: WebGLUniformLocation;
	private uDeltaTimeLocation2: WebGLUniformLocation;
	private uTexelSizeInMetersLocation2: WebGLUniformLocation;

	constructor() {
		super(advectionFragSource);
		this.uSedimentHardnessTextureLocation2 = this.shader.getUniformLocation("uSedimentHardnessTexture");
		this.uVelocityTextureLocation2 = this.shader.getUniformLocation("uVelocityTexture");
		this.uDeltaTimeLocation2 = this.shader.getUniformLocation("uDeltaTime");
		this.uTexelSizeInMetersLocation2 = this.shader.getUniformLocation("uTexelSizeInMeters");
	}

	initalizePass(textures: TextureBundle, framebuffer: Framebuffer) {
		Renderer.checkGLError();
		this.shader.setUniformI(this.uSedimentHardnessTextureLocation2, 0);
		this.shader.setUniformI(this.uVelocityTextureLocation2, 1);
		this.shader.setUniformF(this.uDeltaTimeLocation2, erosionParams.deltaTime);
		this.shader.setUniformF(this.uTexelSizeInMetersLocation2, erosionParams.pipeLength);

		Renderer.checkGLError();
		textures.sedimentHardnessMap.current().bind(0);
		textures.waterVelocityMap.bind(1);

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
