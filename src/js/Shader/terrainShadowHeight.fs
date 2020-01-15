#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uHeightMap;
uniform sampler2D uShadowMap;
uniform mat4 uShadowMatrix;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;

out vec4 oShadow;

void main(void) {	
	float currentHeight = textureLod(uHeightMap, vCoords, 0.0).x;
	
	vec2 heightMapSize = vec2(textureSize(uHeightMap, 0).xy);
	vec2 heightMapTexelSize = 1.0 / heightMapSize;

	float stepSize = 50.0;
	vec3 worldPos;
	worldPos.xz = vCoords * heightMapSize * uTexelSizeInMeters;
	worldPos.y = currentHeight * uHeightScaleInMeters - 2.0;

	for (int i = 0; i < 16; ++i) {
		vec4 shadowPos = uShadowMatrix * vec4(worldPos, 1.0);
		shadowPos.xyz = shadowPos.xyz * 0.5 + 0.5;
		float shadowDepth = texture(uShadowMap, shadowPos.xy).x;
		bool shadowed = shadowDepth < shadowPos.z - 0.01;
		worldPos.y += shadowed ? stepSize : -stepSize;
		stepSize = shadowed ? stepSize * 0.5 : stepSize;
	}

	oShadow = vec4(worldPos.y, 0.0, 0.0, 1.0);
}