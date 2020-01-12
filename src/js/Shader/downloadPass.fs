#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;

out vec4 oColor;

void main(void) {	
	oColor = texture(uTexture, vCoords);
}