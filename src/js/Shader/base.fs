#version 300 es

precision mediump float;

out vec4 color;

in vec3 position;

void main(void) {
	color = vec4(position.rgb, 1.0);
}