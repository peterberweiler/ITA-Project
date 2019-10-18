#version 300 es
precision highp float;

in vec3 aVertexPosition;
out vec2 vCoords;

void main(void) {
	gl_Position = vec4(aVertexPosition.xy, 0.0, 1.0);
	vCoords = (aVertexPosition.xy + 1.0) * 0.5;
}