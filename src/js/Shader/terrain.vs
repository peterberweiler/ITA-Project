#version 300 es

precision mediump float;

in vec2 aPosition;

uniform mat4 uTransform;
uniform float uScale;
uniform vec2 uBias;
uniform mat2 uRotation;

void main(void) {
	vec3 position = vec3(aPosition.x, 0.0, aPosition.y);
	position.xz = uRotation * position.xz;
	position.xz = position.xz * uScale + uBias;
	gl_Position = uTransform * vec4(position, 1.0);
}