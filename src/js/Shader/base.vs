#version 300 es

precision mediump float;

in vec3 aVertexPosition;
out vec3 position;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;


void main(void) {
	gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
	position = (aVertexPosition + 1.0) * 0.5;
}