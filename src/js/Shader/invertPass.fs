#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;

out vec4 oHeight;

void main(void) {	
	float h = texture(uTexture, vCoords).r;
	
	oHeight = vec4(-h, 0.0, 0.0, 1.0);
}