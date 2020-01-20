#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oTerrainHeight;

uniform sampler2D uTerrainHeightTexture;
uniform sampler2D uSoilFluxPlusTexture;
uniform sampler2D uSoilFluxCrossTexture;

void main(void) {
	vec4 plusInflowingFlux;
	plusInflowingFlux.x = texelFetch(uSoilFluxPlusTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).y;
	plusInflowingFlux.y = texelFetch(uSoilFluxPlusTexture, ivec2(gl_FragCoord.xy) + ivec2( 1, 0), 0).x;
	plusInflowingFlux.z = texelFetch(uSoilFluxPlusTexture, ivec2(gl_FragCoord.xy) + ivec2( 0, 1), 0).w;
	plusInflowingFlux.w = texelFetch(uSoilFluxPlusTexture, ivec2(gl_FragCoord.xy) + ivec2( 0,-1), 0).z;

	vec4 plusOutflowingFlux = texelFetch(uSoilFluxPlusTexture, ivec2(gl_FragCoord.xy), 0);
	float plusInflowingSoil = plusInflowingFlux.x + plusInflowingFlux.y + plusInflowingFlux.z + plusInflowingFlux.w;
	float plusOutflowingSoil = plusOutflowingFlux.x + plusOutflowingFlux.y + plusOutflowingFlux.z + plusOutflowingFlux.w;
	float plusVolumeChange = plusInflowingSoil - plusOutflowingSoil;

	float terrainHeight = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy), 0).x;

	terrainHeight += plusVolumeChange;

	vec4 crossInflowingFlux;
	crossInflowingFlux.x = texelFetch(uSoilFluxCrossTexture, ivec2(gl_FragCoord.xy) + ivec2(-1,  1), 0).y;
	crossInflowingFlux.y = texelFetch(uSoilFluxCrossTexture, ivec2(gl_FragCoord.xy) + ivec2( 1, -1), 0).x;
	crossInflowingFlux.z = texelFetch(uSoilFluxCrossTexture, ivec2(gl_FragCoord.xy) + ivec2( 1,  1), 0).w;
	crossInflowingFlux.w = texelFetch(uSoilFluxCrossTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, -1), 0).z;

	vec4 crossOutflowingFlux = texelFetch(uSoilFluxCrossTexture, ivec2(gl_FragCoord.xy), 0);
	float crossInflowingSoil = crossInflowingFlux.x + crossInflowingFlux.y + crossInflowingFlux.z + crossInflowingFlux.w;
	float crossOutflowingSoil = crossInflowingFlux.x + crossInflowingFlux.y + crossInflowingFlux.z + crossInflowingFlux.w;
	float crossVolumeChange = crossInflowingSoil - crossOutflowingSoil;

	terrainHeight += crossVolumeChange;

	oTerrainHeight = vec4(terrainHeight);
}