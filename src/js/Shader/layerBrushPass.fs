#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;

uniform vec2 uPoints[200];
uniform int uPointCount;
uniform int uType;
uniform float uRadius;
uniform float uStrength;

//TODO: add smart option

layout (location = 0) out vec4 oSurfaceMap0;
// layout (location = 1) out vec4 oSurfaceMap1;
// layout (location = 2) out vec4 oSurfaceMap2;
// layout (location = 3) out vec4 oSurfaceMap3;

float linePointDist(vec2 a, vec2 b, vec2 p) {
	vec2 n = b - a;
	float t = dot(p - a, n) / dot(n, n);
	t = min(max(t, 0.0), 1.0);

	vec2 s = a + t * n;
	return distance(s, p);
}

void main(void) {
	oSurfaceMap0 = texture(uTexture, vCoords);
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

	oSurfaceMap0[0] += weight * uStrength * float(uType == 0) ;
	oSurfaceMap0[1] += weight * uStrength * float(uType == 1) ;
	oSurfaceMap0[2] += weight * uStrength * float(uType == 2) ;
	oSurfaceMap0[3] += weight * uStrength * float(uType == 3) ;

	float sum = oSurfaceMap0[0] + oSurfaceMap0[1] + oSurfaceMap0[2] + oSurfaceMap0[3];
            //   + oSurfaceMap1[0] + oSurfaceMap1[1] + oSurfaceMap1[2] + oSurfaceMap1[3]
            //   + oSurfaceMap2[0] + oSurfaceMap2[1] + oSurfaceMap2[2] + oSurfaceMap2[3]
            //   + oSurfaceMap3[0] + oSurfaceMap3[1] + oSurfaceMap3[2] + oSurfaceMap3[3];
	oSurfaceMap0 /= sum;
	// oSurfaceMap1 /= sum;
	// oSurfaceMap2 /= sum;
	// oSurfaceMap3 /= sum;

}