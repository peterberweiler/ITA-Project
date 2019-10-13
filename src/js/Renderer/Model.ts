import { mat4 } from "gl-matrix";
import Mesh from "./Mesh";
import Shader from "./Shader";

export default class Model {
	mesh: Mesh;
	shader: Shader;
	transformation: mat4;

	constructor(mesh: Mesh, shader: Shader) {
		this.mesh = mesh;

		this.shader = shader;
		this.transformation = mat4.create();
	}

	bind() {
		this.shader.use();
		this.mesh.bind();
		this.shader.bind();

		this.shader.setModelMatrix(this.transformation);
	}

	draw() {
		this.bind();
		this.mesh.draw();
	}

	drawLines() {
		this.bind();
		this.mesh.drawLines();
	}
}
