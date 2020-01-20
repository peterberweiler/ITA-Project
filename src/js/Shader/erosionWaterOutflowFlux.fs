#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oWaterHeight;
layout (location = 1) out vec4 oWaterOutflowFlux;

uniform sampler2D uTerrainHeightTexture;
uniform sampler2D uWaterHeightTexture;
uniform sampler2D uWaterOutflowFluxTexture;
uniform float uDeltaTime;
uniform float uRainRate;
uniform float uPipeCrossSectionArea;
uniform float uPipeLength;

const float g = 9.81;


void main(void) {	
	float terrainHeight = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy), 0).x;
	float waterHeight = texelFetch(uWaterHeightTexture, ivec2(gl_FragCoord.xy), 0).x;
	
	float waterIncrement = uDeltaTime * uRainRate;
	waterHeight += waterIncrement;

	float combinedHeight = terrainHeight + waterHeight;

	vec4 waterOutflowFlux = texelFetch(uWaterOutflowFluxTexture, ivec2(gl_FragCoord.xy), 0);
	vec4 neighborHeight;
	neighborHeight.x = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).x;
	neighborHeight.y = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2( 1, 0), 0).x;
	neighborHeight.z = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0,  1), 0).x;
	neighborHeight.w = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).x;

	neighborHeight.x += texelFetch(uWaterHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).x + waterIncrement;
	neighborHeight.y += texelFetch(uWaterHeightTexture, ivec2(gl_FragCoord.xy) + ivec2( 1, 0), 0).x + waterIncrement;
	neighborHeight.z += texelFetch(uWaterHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0,  1), 0).x + waterIncrement;
	neighborHeight.w += texelFetch(uWaterHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).x + waterIncrement;
	
	vec4 heightDiff = combinedHeight - neighborHeight;
	float invPipelength = 1.0 / uPipeLength;
	waterOutflowFlux = max(vec4(0.0), waterOutflowFlux + uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength);

	if (int(gl_FragCoord.x) == 0) waterOutflowFlux.x = 0.0;
	if (int(gl_FragCoord.y) == 0) waterOutflowFlux.z = 0.0;
	if (int(gl_FragCoord.x) == int(textureSize(uTerrainHeightTexture, 0).x) - 1) waterOutflowFlux.y = 0.0;
	if (int(gl_FragCoord.y) == int(textureSize(uTerrainHeightTexture, 0).y) - 1) waterOutflowFlux.w = 0.0;

	float outfluxSum = waterOutflowFlux.x + waterOutflowFlux.y + waterOutflowFlux.z + waterOutflowFlux.w;
	waterOutflowFlux *= outfluxSum > 0.0 ? min(1.0, (waterHeight * uPipeLength * uPipeLength) / (outfluxSum * uDeltaTime)) : 1.0;

	oWaterOutflowFlux = waterOutflowFlux;
	oWaterHeight = vec4(waterHeight);
}