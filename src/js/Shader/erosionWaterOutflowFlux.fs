#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oState;
layout (location = 1) out vec4 oWaterOutflowFlux;

uniform sampler2D uStateTexture; // X: terrain height Y: water height Z: sediment W: hardness
uniform sampler2D uWaterOutflowFluxTexture;
uniform float uDeltaTime;
uniform float uRainRate;
uniform float uPipeCrossSectionArea;
uniform float uPipeLength;

const float g = 9.81;


void main(void) {	
	vec2 state = texelFetch(uStateTexture, ivec2(gl_FragCoord.xy), 0).xy;
	float terrainHeight = state.x;
	float waterHeight = state.y;
	
	float waterIncrement = uDeltaTime * uRainRate;
	waterHeight += waterIncrement;

	float combinedHeight = terrainHeight + waterHeight;

	vec4 waterOutflowFlux = texelFetch(uWaterOutflowFluxTexture, ivec2(gl_FragCoord.xy), 0).x;
	float invPipelength = 1.0 / uPipeLength;

	// left
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(-1, 0);
		vec2 neighborState = texelFetch(uStateTexture, neighborCoord, 0).xy;
		float neighborHeight = neighborState.x + neighborState.y + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.x += outflowIncrement;
	}

	// right
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(1, 0);
		vec2 neighborState = texelFetch(uStateTexture, neighborCoord, 0).xy;
		float neighborHeight = neighborState.x + neighborState.y + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.y += outflowIncrement;
	}

	// top
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(0, 1);
		vec2 neighborState = texelFetch(uStateTexture, neighborCoord, 0).xy;
		float neighborHeight = neighborState.x + neighborState.y + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.z += outflowIncrement;
	}

	// bottom
	{
		ivec2 neighborCoord = ivec2(gl_FragCoord.xy) + ivec2(0, -1);
		vec2 neighborState = texelFetch(uStateTexture, neighborCoord, 0).xy;
		float neighborHeight = neighborState.x + neighborState.y + waterIncrement;
		float heightDiff = combinedHeight - neighborHeight;
		float outflowIncrement = uDeltaTime * uPipeCrossSectionArea * (g * heightDiff) * invPipelength;
		waterOutflowFlux.w += outflowIncrement;
	}

	waterOutflowFlux = max(vec4(0.0), waterOutflowFlux);
	waterOutflowFlux *= max(1.0, (waterHeight * uPipeLength * uPipeLength) / (dot(waterOutflowFlux, vec4(1.0)) * uDeltaTime));
	
	oWaterOutflowFlux = waterOutflowFlux;
	oState = vec4(terrainHeight, waterHeight, texelFetch(uStateTexture, ivec2(gl_FragCoord.xy), 0).zw)
}