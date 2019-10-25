import { mat2, mat3, mat4, vec2, vec3, vec4 } from "gl-matrix";
import Global from "./Global";

let gl: WebGL2RenderingContext;

export default class Shader {
	private programId: WebGLProgram;

	constructor(vertexShader: string | WebGLShader, fragmentShader: string | WebGLShader) {
		gl = Global.gl;

		if (typeof vertexShader === "string") {
			vertexShader = Shader.compile(vertexShader, gl.VERTEX_SHADER);
		}
		if (typeof fragmentShader === "string") {
			fragmentShader = Shader.compile(fragmentShader, gl.FRAGMENT_SHADER);
		}

		const program = gl.createProgram();

		if (!program) { throw new Error("Couldn't create program."); }

		this.programId = program;

		gl.attachShader(this.programId, vertexShader);
		gl.attachShader(this.programId, fragmentShader);
		gl.linkProgram(this.programId);

		if (!gl.getProgramParameter(this.programId, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(this.programId);
			throw new Error("Linking of shaderprogram failed: " + info);
		}
	}

	getAttributeLocation(name: string) {
		return gl.getAttribLocation(this.programId, name);
	}

	getUniformLocation(name: string) {
		let loc = gl.getUniformLocation(this.programId, name);
		if (!loc) { throw new Error("Couldn't retrieve uniform location: " + name); }
		return loc;
	}

	setUniformF(location: WebGLUniformLocation, value: number) {
		gl.uniform1f(location, value);
	}

	setUniformI(location: WebGLUniformLocation, value: number) {
		gl.uniform1i(location, value);
	}

	setUniformUi(location: WebGLUniformLocation, value: number) {
		gl.uniform1ui(location, value);
	}

	setUniformVec2(location: WebGLUniformLocation, value: vec2 | number[]) {
		gl.uniform2fv(location, value);
	}

	setUniformVec3(location: WebGLUniformLocation, value: vec3 | number[]) {
		gl.uniform3fv(location, value);
	}

	setUniformVec4(location: WebGLUniformLocation, value: vec4 | number[]) {
		gl.uniform4fv(location, value);
	}

	setUniformMat2(location: WebGLUniformLocation, value: mat2 | number[]) {
		gl.uniformMatrix2fv(location, false, value);
	}

	setUniformMat3(location: WebGLUniformLocation, value: mat3 | number[]) {
		gl.uniformMatrix3fv(location, false, value);
	}

	setUniformMat4(location: WebGLUniformLocation, value: mat4 | number[]) {
		gl.uniformMatrix4fv(location, false, value);
	}

	use() {
		gl.useProgram(this.programId);
	}

	/**
	 * @param {string} source
	 * @param {number} type gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
	 */
	static compile(source: string, type: number): WebGLShader {
		gl = Global.gl;

		const shader = gl.createShader(type);

		if (!shader) { throw new Error("Couldn't create shader"); }

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error("Couldn't compile shader: " + info);
		}
		return shader;
	}
}
