#version 300 es

precision mediump float;

uniform mat4 uTransform;
uniform int uGridResolution;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;
uniform sampler2D uTerrainHeightTexture;
uniform sampler2D uWaterHeightTexture;

out vec3 vWorldSpacePos;

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

	vec2 coord = position.xz * uTexelSizeInMeters * (1.0 / vec2(textureSize(uTerrainHeightTexture, 0).xy));
	position.y = texture(uTerrainHeightTexture, coord).r * uHeightScaleInMeters;
	position.y += texture(uWaterHeightTexture, coord).r * uHeightScaleInMeters - 0.5;
	vWorldSpacePos = position;
	gl_Position = uTransform * vec4(position, 1.0);
}