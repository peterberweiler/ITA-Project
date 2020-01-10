#version 300 es
precision highp float;
precision highp sampler2DArray;

in vec2 vCoords;

uniform sampler2D uHeightmapTexture;
uniform sampler2DArray uSurfaceMapTexture;

uniform vec2 uPoints[200];
uniform int uPointCount;
uniform int uType;
uniform float uRadius;
uniform float uStrength;
uniform float uValue;

uniform float uMinSlope;
uniform float uMaxSlope;

layout (location = 0) out vec4 oSurfaceMap0;
layout (location = 1) out vec4 oSurfaceMap1;


float linePointDist(vec2 a, vec2 b, vec2 p) {
	vec2 n = b - a;
	float t = dot(p - a, n) / dot(n, n);
	t = min(max(t, 0.0), 1.0);

	vec2 s = a + t * n;
	return distance(s, p);
}

void main(void) {
	float height = texture(uHeightmapTexture, vCoords).r;

	float uTexelSizeInMeters = 1.0; //TODO: get as uniform
	float uHeightScaleInMeters = 1.0; //TODO: get as uniform

	vec2 texelSize = (uTexelSizeInMeters / vec2(textureSize(uHeightmapTexture, 0).xy));
	
	// calculate normal
	vec3 Pr = vec3(uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pl = vec3(-uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pb = vec3(0.0, 0.0, uTexelSizeInMeters);
	vec3 Pt = vec3(0.0, 0.0, -uTexelSizeInMeters);
	Pr.y = texture(uHeightmapTexture, vCoords + Pr.xz  * texelSize).x * uHeightScaleInMeters;
	Pl.y = texture(uHeightmapTexture, vCoords + Pl.xz  * texelSize).x * uHeightScaleInMeters;
	Pb.y = texture(uHeightmapTexture, vCoords + Pb.xz  * texelSize).x * uHeightScaleInMeters;
	Pt.y = texture(uHeightmapTexture, vCoords + Pt.xz  * texelSize).x * uHeightScaleInMeters;
	vec3 dPdu =  Pr - Pl;
	vec3 dPdv =  Pt - Pb;
	vec3 normal = normalize(cross(dPdu, dPdv));


	vec2 terrainSize = vec2(textureSize(uHeightmapTexture, 0));
	vec2 fragmentPosition = vCoords * terrainSize;
	float radius = uRadius;

	float minDist = 10000000.0;

	// find minimum distance to path
	for (int i = 0; i < uPointCount - 1; ++i) {
		vec2 fromPoint = uPoints[i];
		vec2 toPoint = uPoints[i + 1];

		float dist = linePointDist(fromPoint, toPoint, fragmentPosition);
		minDist = min(minDist, dist);
	}

	float weight = uStrength * smoothstep(radius, 0.0, minDist);
	float slope = max(0.0, dot(vec3(0.0, 1.0, 0.0), normal));	
	
	const float slopeOverlap = 0.05;
	slope= smoothstep(uMinSlope-slopeOverlap, uMinSlope, slope) * smoothstep(uMaxSlope+slopeOverlap, uMaxSlope, slope);	
	// slope = step(uMinSlope, slope) * (1.0 - step(uMaxSlope, slope));

	float value = uValue * slope;

	oSurfaceMap0 = texture(uSurfaceMapTexture, vec3(vCoords, 0.0));
	oSurfaceMap1 = texture(uSurfaceMapTexture, vec3(vCoords, 1.0));

	oSurfaceMap0 = mix(oSurfaceMap0, vec4(value), weight * vec4(equal(ivec4(uType), ivec4(0, 1, 2, 3))));
	oSurfaceMap1 = mix(oSurfaceMap1, vec4(value), weight * vec4(equal(ivec4(uType), ivec4(4, 5, 6, 7))));
}