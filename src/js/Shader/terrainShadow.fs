#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uHeightMap;
uniform vec3 uLightDir;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;

out vec4 oRayLength;

void main(void) {	
	float currentHeight = textureLod(uHeightMap, vCoords, 0).x;
	
	vec2 heightMapSize = vec2(textureSize(uHeightMap, 0).xy);
	vec2 heightMapTexelSize = 1.0 / heightMapSize;

	vec2 currentHeightMapCoord = vCoords * heightMapSize * heightMapTexelSize;
	vec3 startWorldPos;
	startWorldPos.xz = currentHeightMapCoord * heightMapSize * uTexelSizeInMeters;
	startWorldPos.y = currentHeight * uHeightScaleInMeters;
	vec3 rayPos = startWorldPos;

	vec2 rayDir = normalize(uLightDir.xz);
	float step = abs(rayDir.x) >= abs(rayDir.y) ? abs(rayDir.x) : abs(rayDir.y);
	rayDir = rayDir / step * heightMapTexelSize;
	vec3 rayDir3D = uLightDir / step * vec3(uTexelSizeInMeters, uHeightScaleInMeters, uTexelSizeInMeters);

	while(all(lessThan(currentHeightMapCoord, vec2(1.0)) && all(greaterThanEqual(currentHeightMapCoord, vec2(0.0))))){
		currentHeightMapCoord += rayDir;
		rayPos += rayDir3D;
		if (texelFetch(uHeightMap, ivec2(currentHeightMapCoord * heightMapSize), 0).x > rayPos.y){
			break;
		}
	}

	oRayLength = vec4(distance(startWorldPos, rayPos));
}