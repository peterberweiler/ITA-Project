#version 300 es
precision highp float;

out vec4 vRay;

void main() {
	float x = -1.0 + float((gl_VertexID & 1) << 2);
	float y = -1.0 + float((gl_VertexID & 2) << 1);
	gl_Position = vec4(x, -y, 1.0, 1.0);
	vRay = vec4(x, -y, 1.0, 1.0);
}