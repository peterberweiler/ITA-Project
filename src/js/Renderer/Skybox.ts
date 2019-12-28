import { mat4, vec3 } from "gl-matrix";
import Global from "./Global";
import Shader from "./Shader";

let gl: WebGL2RenderingContext;
const fragSource = require("../Shader/skybox.fs").default;
const vertSource = require("../Shader/skybox.vs").default;

export default class Skybox {
	private skyboxShader: Shader;
	private uInvViewProjectionLocation: WebGLUniformLocation;
	private uSunDirLocation: WebGLUniformLocation;

	constructor() {
		gl = Global.gl;

		this.skyboxShader = new Shader(vertSource, fragSource);
		this.uInvViewProjectionLocation = this.skyboxShader.getUniformLocation("uInvViewProjection");
		this.uSunDirLocation = this.skyboxShader.getUniformLocation("uSunDir");
	}

	draw(viewProjection: mat4, sunDir: vec3 | number[]) {
		this.skyboxShader.use();
		this.skyboxShader.setUniformMat4(this.uInvViewProjectionLocation, viewProjection);
		this.skyboxShader.setUniformVec3(this.uSunDirLocation, sunDir);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}
}
