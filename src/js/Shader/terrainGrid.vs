#version 300 es

precision mediump float;

uniform mat4 uTransform;
uniform int uGridResolution;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;
uniform sampler2D uHeightmapTexture;

out vec3 vWorldSpacePos;
out float vIsSkirt;

// A very simple, regular procedural terrain for debugging cracks etc.
float debugSineHills(vec2 uv)
{
	const float HORIZ_SCALE = 4.0 * 3.14159;
	const float VERT_SCALE = 10.0;
	uv *= HORIZ_SCALE;
	return VERT_SCALE * (sin(uv.x) + 1.0) * (sin(uv.y) + 1.0) - 0.5 ;
}

void main(void) {
	int baseQuad = gl_VertexID / 6;
	vec2 quadOffset = vec2(baseQuad % (uGridResolution + 2), baseQuad / (uGridResolution + 2));
	int index = gl_VertexID % 6;

	vec2 positions[6] = vec2[](
		vec2(0.0, 0.0),
		vec2(1.0, 0.0),
		vec2(0.0, 1.0),
		vec2(0.0, 1.0),
		vec2(1.0, 0.0),
		vec2(1.0, 1.0)
	);

	vec3 position = vec3(quadOffset + positions[index], 0.0).xzy;
	position.xz -= 1.0;
	position.xz = position.xz;
	// position.y = debugSineHills(position.xz * 0.005);

	bool isSkirt = false;
	if (position.x < 0.0 || position.z < 0.0) {
		isSkirt = true;
		position.xz += 1.0;
	}
	if (position.x >= float(uGridResolution) || position.z >= float(uGridResolution)) {
		isSkirt = true;
		position.xz -= 1.0;
	}

	position.y = isSkirt ? -500.0 : texture(uHeightmapTexture, position.xz * uTexelSizeInMeters * (1.0 / vec2(textureSize(uHeightmapTexture, 0).xy))).r * uHeightScaleInMeters;
	vWorldSpacePos = position;
	vIsSkirt = isSkirt ? 1.0 : 0.0;
	gl_Position = uTransform * vec4(position, 1.0);
}