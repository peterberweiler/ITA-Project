#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;

uniform vec2 uPoints[200];
uniform int uPointCount;
uniform int uType;
uniform float uRadius;
uniform float uStrength;

out vec4 oHeight;

float linePointDist(vec2 a, vec2 b, vec2 p) {
	vec2 n = b - a;
	float t = dot(p - a, n) / dot(n, n);
	t = min(max(t, 0.0), 1.0);

	vec2 s = a + t * n;
	return distance(s, p);
}

void main(void) {
	float height = texture(uTexture, vCoords).r;
	vec2 terrainSize = vec2(textureSize(uTexture, 0));
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

	float weight = smoothstep(radius, 0.0, minDist);

	if (uType == 0) { // normal	mode
		height += weight * uStrength;
	}
	else if (uType == 1) { // flatten mode
		float centerHeight = texture(uTexture, uPoints[0] / terrainSize).r;

		float delta = centerHeight - height;
		float flattenStrength = 0.03; // this number just feels right in comparison to normal mode
		height += delta * weight * uStrength * flattenStrength;

	}

	oHeight = vec4(height, 0.0, 0.0, 1.0);
}