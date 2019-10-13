import { mat4 } from "gl-matrix";
import Global from "./Global";

let gl: WebGL2RenderingContext;

export default class Shader {
	program: WebGLProgram;
	attribLocations: any;
	uniformLocations: any;

	constructor(vertexShaderSource: string, fragmentShaderSource: string) {
		gl = Global.gl;

		const vertexShader = this.compileShader(vertexShaderSource, gl.VERTEX_SHADER);
		const fragmentShader = this.compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
		const program = gl.createProgram();

		if (!program) { throw new Error("Couldn't create program."); }

		this.program = program;

		gl.attachShader(this.program, vertexShader);
		gl.attachShader(this.program, fragmentShader);
		gl.linkProgram(this.program);

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			throw new Error("Linking of shaderprogram failed.");
		}

		this.use();

		this.attribLocations = {
			vertexPosition: gl.getAttribLocation(this.program, "aVertexPosition"),
			// vertexNormal: gl.getAttribLocation(this.program, "aVertexNormal"),
		};

		this.uniformLocations = {
			// color: gl.getUniformLocation(this.program, "uColor"),
			// shadowIntensity: gl.getUniformLocation(this.program, "uShadowIntensity"),
			projectionMatrix: gl.getUniformLocation(this.program, "uProjectionMatrix"),
			viewMatrix: gl.getUniformLocation(this.program, "uViewMatrix"),
			modelMatrix: gl.getUniformLocation(this.program, "uModelMatrix"),

		};
	}

	getUniformLocation(name: string) {
		return gl.getUniformLocation(this.program, name);
	}

	/**
	 * @param {string} source
	 * @param {number} type gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
	 */
	compileShader(source: string, type: number): WebGLShader {
		let shader = gl.createShader(type);

		if (!shader) { throw new Error("Couldn't create shader"); }

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			if (!shader) { throw new Error("Couldn't compile shader: " + info); }
		}
		return shader;
	}

	use() {
		gl.useProgram(this.program);
	}

	bind() {
		// gl.vertexAttribPointer(this.attribLocations.vertexPosition, 3, gl.FLOAT, false, 6 * 4, 0);
		// gl.vertexAttribPointer(this.attribLocations.vertexNormal, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

		// gl.enableVertexAttribArray(this.attribLocations.vertexPosition);
		// gl.enableVertexAttribArray(this.attribLocations.vertexNormal);

		gl.vertexAttribPointer(this.attribLocations.vertexPosition, 3, gl.FLOAT, false, 12, 0);
		gl.enableVertexAttribArray(this.attribLocations.vertexPosition);
	}

	setProjectionMatrix(projectionMatrix: mat4) {
		this.use();
		gl.uniformMatrix4fv(this.uniformLocations.projectionMatrix, false, projectionMatrix);
	}

	setViewMatrix(viewMatrix: mat4) {
		this.use();
		gl.uniformMatrix4fv(this.uniformLocations.viewMatrix, false, viewMatrix);
	}

	setModelMatrix(modelMatrix: mat4) {
		this.use();
		gl.uniformMatrix4fv(this.uniformLocations.modelMatrix, false, modelMatrix);
	}
}
