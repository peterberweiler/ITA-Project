#version 300 es

precision mediump float;

out vec4 oColor;

in vec3 vWorldSpacePos;

void main(void) {
	oColor = vec4(vec3(gl_FragCoord.z), 1.0);
}