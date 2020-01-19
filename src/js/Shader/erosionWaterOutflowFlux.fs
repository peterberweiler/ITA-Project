#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oTerrainHeight;
layout (location = 1) out vec4 oWaterHeight;
layout (location = 2) out vec4 oWaterOutflowFlux;

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
	float invPipelength = 1.0 / uPipeLength;

	// left
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(-1, 0);
		float neighborHeight = texelFetch(uTerrainHeightTexture, neighborCoord, 0).x + texelFetch(uWaterHeightTexture, neighborCoord, 0).x + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.x += outflowIncrement;
	}

	// right
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(1, 0);
		float neighborHeight = texelFetch(uTerrainHeightTexture, neighborCoord, 0).x + texelFetch(uWaterHeightTexture, neighborCoord, 0).x + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.y += outflowIncrement;
	}

	// top
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(0, 1);
		float neighborHeight = texelFetch(uTerrainHeightTexture, neighborCoord, 0).x + texelFetch(uWaterHeightTexture, neighborCoord, 0).x + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.z += outflowIncrement;
	}

	// bottom
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(0, -1);
		float neighborHeight = texelFetch(uTerrainHeightTexture, neighborCoord, 0).x + texelFetch(uWaterHeightTexture, neighborCoord, 0).x + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.w += outflowIncrement;
	}

	waterOutflowFlux = max(vec4(0.0), waterOutflowFlux);
	waterOutflowFlux *= max(1.0, (waterHeight * uPipeLength * uPipeLength) / (dot(waterOutflowFlux, vec4(1.0)) * uDeltaTime));
	
	oWaterOutflowFlux = waterOutflowFlux;
	oTerrainHeight = vec4(terrainHeight);
	oWaterHeight = vec4(waterHeight);
}