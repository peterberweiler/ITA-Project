#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;
uniform sampler2D uBrushesTexture;

uniform vec2 uPoints[200];
uniform int uPointCount;
uniform int uType;
uniform float uRadius;
uniform float uStrength;

out vec4 oHeight;

float linePointDist(vec2 a, vec2 b, vec2 p, inout vec2 pointOnLine) {
	vec2 n = b - a;
	float t = dot(p - a, n) / dot(n, n);
	t = min(max(t, 0.0), 1.0);

	pointOnLine = a + t * n;
	return distance(pointOnLine, p);
}

void main(void) {
	float height = texture(uTexture, vCoords).r;
	vec2 terrainSize = vec2(textureSize(uTexture, 0));
	vec2 fragmentPosition = vCoords * terrainSize;

	float minDist = 10000000.0;
	vec2 closestPoint = fragmentPosition;

	// find minimum distance to path
	for (int i = 0; i < uPointCount - 1; ++i) {
		vec2 fromPoint = uPoints[i];
		vec2 toPoint = uPoints[i + 1];
		
		vec2 pointOnLine;
		float dist = linePointDist(fromPoint, toPoint, fragmentPosition, pointOnLine);
		if (dist < minDist) { //TODO: optimize
			minDist = dist;
			closestPoint = pointOnLine;
		}
	}

	if (uType < 16) { // normal	mode		
		vec2 brushCoords = fragmentPosition - closestPoint;
		brushCoords /= uRadius * 2.0;
		brushCoords += vec2(0.5);
		brushCoords = max(vec2(0.0), min(vec2(1.0), brushCoords));
		
		int brushTextureLayer = uType / 4;
		int brushTextureIndex = uType % 4;
		brushCoords += vec2(brushTextureIndex % 2, brushTextureIndex / 2);
		brushCoords *= 0.5;
		float brushWeight = texture(uBrushesTexture, brushCoords)[brushTextureLayer];

		float weight = step(minDist, uRadius); // enforce radius boundary
		height += weight * uStrength * brushWeight;
	}
	else if (uType == 16) { // flatten mode
		float weight = smoothstep(uRadius, 0.0, minDist); 
		float centerHeight = texture(uTexture, uPoints[0] / terrainSize).r;

		float delta = centerHeight - height;
		float flattenStrength = 0.03; // this number just feels right in comparison to normal mode
		height += delta * weight * uStrength * flattenStrength;

	}
	// height = texture(uBrushesTexture, vCoords*2.0).r * 300.0;
	oHeight = vec4(height, 0.0, 0.0, 1.0);
}