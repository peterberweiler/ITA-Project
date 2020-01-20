#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oSedimentHardness;

uniform sampler2D uTerrainHeightTexture;
uniform sampler2D uSedimentHardnessTexture;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;
uniform int uUpdateValues;

uint rngState = 0u;

uint rand_xorshift()
{
    // Xorshift algorithm from George Marsaglia's paper
    rngState ^= (rngState << 13u);
    rngState ^= (rngState >> 17u);
    rngState ^= (rngState << 5u);
    return rngState;
}

uint wang_hash(uint seed)
{
    seed = (seed ^ 61u) ^ (seed >> 16u);
    seed *= 9u;
    seed = seed ^ (seed >> 4u);
    seed *= 0x27d4eb2du;
    seed = seed ^ (seed >> 15u);
    return seed;
}

void main(void) {
	vec3 worldSpacePos = vec3(vCoords.x, 0.0, vCoords.y);
	worldSpacePos.xz *= vec2(textureSize(uTerrainHeightTexture, 0).xy) * uTexelSizeInMeters;
	vec3 Pr = worldSpacePos + vec3(uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pl = worldSpacePos + vec3(-uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pb = worldSpacePos + vec3(0.0, 0.0, uTexelSizeInMeters);
	vec3 Pt = worldSpacePos + vec3(0.0, 0.0, -uTexelSizeInMeters);

	vec2 texelSize = 1.0 / vec2(textureSize(uTerrainHeightTexture, 0).xy);

	Pr.y = textureLod(uTerrainHeightTexture, Pr.xz  * uTexelSizeInMeters * texelSize, 0.0).x * uHeightScaleInMeters;
	Pl.y = textureLod(uTerrainHeightTexture, Pl.xz  * uTexelSizeInMeters * texelSize, 0.0).x * uHeightScaleInMeters;
	Pb.y = textureLod(uTerrainHeightTexture, Pb.xz  * uTexelSizeInMeters * texelSize, 0.0).x * uHeightScaleInMeters;
	Pt.y = textureLod(uTerrainHeightTexture, Pt.xz  * uTexelSizeInMeters * texelSize, 0.0).x * uHeightScaleInMeters;

	// Calculate tangent basis vectors using the difference
	vec3 dPdu =  Pr - Pl;
	vec3 dPdv =  Pt - Pb;

	vec3 N = normalize(cross(dPdu, dPdv));
	float flatness = max(N.y, 0.0);

	rngState = wang_hash(uint(gl_FragCoord.x) * uint(floatBitsToInt(gl_FragCoord.x)));
	float rnd = float(rand_xorshift()) * (1.0 / 4294967296.0);
	float hardness = 0.1 + flatness * 0.9;// * rnd;
	float sediment = 0.0;

	if (uUpdateValues != 0) {
		vec2 sedimentHardness = texelFetch(uSedimentHardnessTexture, ivec2(gl_FragCoord.xy), 0).xy;
		hardness = mix(hardness, sedimentHardness.y, 0.9);
		sediment = sedimentHardness.x;
	}

	oSedimentHardness = vec4(sediment, hardness, 0.0, 1.0);
}