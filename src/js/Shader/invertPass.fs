#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;

out float height;

void main(void) {	
	float h = texture(uTexture, vCoords).r;
	height = -h;
}