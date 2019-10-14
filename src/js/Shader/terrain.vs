#version 300 es

precision mediump float;

in vec2 aPosition;

uniform mat4 uTransform;
uniform float uScale;
uniform vec2 uBias;
uniform mat2 uRotation;

// A very simple, regular procedural terrain for debugging cracks etc.
float debugSineHills(vec2 uv)
{
	const float HORIZ_SCALE = 4.0 * 3.14159;
	const float VERT_SCALE = 10.0;
	uv *= HORIZ_SCALE;
	return VERT_SCALE * (sin(uv.x) + 1.0) * (sin(uv.y) + 1.0) - 0.5;
}

void main(void) {
	vec3 position = vec3(aPosition.x, 0.0, aPosition.y);
	position.xz = uRotation * position.xz;
	position.xz = position.xz * uScale + uBias;
	position.y = debugSineHills(position.xz * 0.005);
	gl_Position = uTransform * vec4(position, 1.0);
}