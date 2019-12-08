#version 300 es

precision highp float;

in vec2 vCoords;

uniform sampler2D uHeightmapTexture;

uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;

uniform float uMinSlopes[16];
uniform float uMaxSlopes[16];
uniform float uMinHeights[16];
uniform float uMaxHeights[16];

layout (location = 0) out vec4 oSurfaceMap0;
layout (location = 1) out vec4 oSurfaceMap1;
layout (location = 2) out vec4 oSurfaceMap2;
layout (location = 3) out vec4 oSurfaceMap3;

//TODO: turn this into a brush

vec4 calculateSurfaceMap(int surfaceMapIndex, float height, float slope)
{
	vec4 result;
	for(int i = 0; i < 4; ++i)
	{
		int typeIndex = surfaceMapIndex * 4 + i;

		float minSlope = uMinSlopes[typeIndex];
		float maxSlope = uMaxSlopes[typeIndex];
		float midSlope = (minSlope + maxSlope) * 0.5;

		float minHeight = uMinHeights[typeIndex];
		float maxHeight = uMaxHeights[typeIndex];
		float midHeight = (minHeight + maxHeight) * 0.5;

		float fadeInOutHeight = smoothstep(minHeight, midHeight, height) * smoothstep(maxHeight, midHeight, height);
		float fadeInOutSlope = smoothstep(minSlope, midSlope, slope) * smoothstep(maxSlope, midSlope, slope);
		
		result[i] = fadeInOutHeight * fadeInOutSlope;
	
	}

	return result;
}


void main(void) {	
	float height = texture(uHeightmapTexture, vCoords).r;
	
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

	// calculate slope
	float slope = max(0.0, dot(vec3(0.0, 1.0, 0.0), normal));	


	oSurfaceMap0 = calculateSurfaceMap(0, height, slope);
	oSurfaceMap1 = calculateSurfaceMap(1, height, slope);
	oSurfaceMap2 = calculateSurfaceMap(2, height, slope);
	oSurfaceMap3 = calculateSurfaceMap(3, height, slope);

	//TODO: randomize the areas where surface types overlap
	// use perlin noise if sum > 1
	//
	//     float noise = perlin2D()
	// 	   noise *= max(0.0, sum - 1.0);
	//     oSurfaceMap[0][0] += noise

	// normalize all weights
	float sum = oSurfaceMap0[0] + oSurfaceMap0[1] + oSurfaceMap0[2] + oSurfaceMap0[3]
              + oSurfaceMap1[0] + oSurfaceMap1[1] + oSurfaceMap1[2] + oSurfaceMap1[3]
              + oSurfaceMap2[0] + oSurfaceMap2[1] + oSurfaceMap2[2] + oSurfaceMap2[3]
              + oSurfaceMap3[0] + oSurfaceMap3[1] + oSurfaceMap3[2] + oSurfaceMap3[3];
	oSurfaceMap0 /= sum;
	oSurfaceMap1 /= sum;
	oSurfaceMap2 /= sum;
	oSurfaceMap3 /= sum;

	// oSurfaceMap[0] = vec4(1.0);
	// oSurfaceMap[0] = vec4(slope);
	// oSurfaceMap[0] = vec4(normal, 1.0);
	// oSurfaceMap[0] = vec4(height/100.0);
}