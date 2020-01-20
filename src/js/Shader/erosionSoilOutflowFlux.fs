#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oSoilOutflowFluxPlus;
layout (location = 1) out vec4 oSoilOutflowFluxCross;

uniform sampler2D uTerrainHeightTexture;
uniform sampler2D uSedimentHardnessTexture;
uniform float uDeltaTime;
uniform float uCellSize;
uniform float uThermalErosionRate;
uniform float uTalusAngleTangentCoeff;
uniform float uTalusAngleTangentBias;


void main(void) {	
	float terrainHeight = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy), 0).x;
	
	vec4 plusNeighborHeights;
	plusNeighborHeights.x = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).x;
	plusNeighborHeights.y = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2( 1, 0), 0).x;
	plusNeighborHeights.z = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0,  1), 0).x;
	plusNeighborHeights.w = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).x;

	// rotated right by 45°
	vec4 crossNeighborHeights;
	crossNeighborHeights.x = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(-1,  1), 0).x;
	crossNeighborHeights.y = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2( 1, -1), 0).x;
	crossNeighborHeights.z = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2( 1,  1), 0).x;
	crossNeighborHeights.w = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, -1), 0).x;

	vec4 plusHeightDiff = max(vec4(0.0), terrainHeight - plusNeighborHeights);
	vec4 crossHeightDiff = max(vec4(0.0), terrainHeight - crossNeighborHeights);

	float maxHeightDiff = max(max(plusHeightDiff.x, plusHeightDiff.y), max(plusHeightDiff.z, plusHeightDiff.w));
	maxHeightDiff = max(maxHeightDiff, max(max(crossHeightDiff.x, crossHeightDiff.y), max(crossHeightDiff.z, crossHeightDiff.w)));

	float hardness = texelFetch(uSedimentHardnessTexture, ivec2(gl_FragCoord.xy), 0).y;
	float soilVolume = uDeltaTime * maxHeightDiff * 0.5 * uCellSize * uCellSize * uThermalErosionRate;// * hardness;

	vec4 plusTanAngle = plusHeightDiff / uCellSize;
	vec4 crossTanAngle = crossHeightDiff / length(vec2(uCellSize, uCellSize));

	float theshold = hardness * uTalusAngleTangentCoeff + uTalusAngleTangentBias;

	vec4 plusK = mix(vec4(0.0), plusHeightDiff, greaterThan(plusTanAngle, vec4(theshold)));
	vec4 crossK = mix(vec4(0.0), crossHeightDiff, greaterThan(crossTanAngle, vec4(theshold)));

	float sumK = plusK.x + plusK.y + plusK.z + plusK.w;// + crossK.x + crossK.y + crossK.z + crossK.w;
	vec4 plusOutFlux = sumK > 0.0 ? soilVolume * plusK / sumK : vec4(0.0);
	vec4 crossOutFlux = sumK > 0.0 ? soilVolume * crossK / sumK : vec4(0.0);

	oSoilOutflowFluxPlus = plusOutFlux;
	oSoilOutflowFluxCross = crossOutFlux;
}