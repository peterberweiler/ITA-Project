#version 300 es

precision highp float;
precision highp sampler2DArray;

in vec2 vCoords;

uniform sampler2D uHeightmapTexture;
uniform sampler2DArray uSurfaceMapTexture;

uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;

uniform float uMinSlopes[8];
uniform float uMaxSlopes[8];
uniform float uMinHeights[8];
uniform float uMaxHeights[8];

uniform vec2 uPoints[16];
uniform int uPointCount;
uniform float uRadius;
uniform float uStrength;

layout (location = 0) out vec4 oSurfaceMap0;
layout (location = 1) out vec4 oSurfaceMap1;

float linePointDist(vec2 a, vec2 b, vec2 p) {
	vec2 n = b - a;
	float t = dot(p - a, n) / dot(n, n);
	t = min(max(t, 0.0), 1.0);

	vec2 s = a + t * n;
	return distance(s, p);
}

float peak(float x)
{
	return max(0.0, 1.0 - abs(2.0*x - 1.0));
}

float peak(float minVal, float maxVal, float value)
{
	return peak((value - minVal)/(maxVal - minVal));
}

float getBrushWeight() 
{
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

	return uStrength * smoothstep(radius, 0.0, minDist);	
}

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

		// float fadeInOutHeight = smoothstep(minHeight, midHeight, height) * smoothstep(maxHeight, midHeight, height);
		// float fadeInOutSlope = smoothstep(minSlope, midSlope, slope) * smoothstep(maxSlope, midSlope, slope);
		
		float fadeInOutHeight = peak(minHeight, maxHeight, height);
		float fadeInOutSlope = peak(minSlope, maxSlope, slope);

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


	if (uPointCount == 0){
		oSurfaceMap0 = calculateSurfaceMap(0, height, slope);
		oSurfaceMap1 = calculateSurfaceMap(1, height, slope);
	}else{
		float weight = clamp(getBrushWeight(), 0.0, 1.0);	
		
		oSurfaceMap0 = mix(texture(uSurfaceMapTexture, vec3(vCoords, 0.0)), calculateSurfaceMap(0, height, slope), weight);
		oSurfaceMap1 = mix(texture(uSurfaceMapTexture, vec3(vCoords, 1.0)), calculateSurfaceMap(1, height, slope), weight);
	}	
}