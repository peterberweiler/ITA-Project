#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oTerrainHeight;
layout (location = 1) out vec4 oWaterHeight;
layout (location = 2) out vec4 oVelocity;
layout (location = 3) out vec4 oSedimentHardness;

uniform sampler2D uTerrainHeightTexture;
uniform sampler2D uWaterHeightTexture;
uniform sampler2D uSedimentHardnessTexture;
uniform sampler2D uWaterOutflowFluxTexture;
uniform float uDeltaTime;
uniform float uPipeLength;
uniform float uSedimentCapacity;
uniform float uMaxErosionDepth;
uniform float uSuspensionRate;
uniform float uDepositionRate;
uniform float uSedimentSofteningRate;
uniform float uEvaporationRate;


void main(void) {	
	// calculate water height change
	vec4 inflowingFlux;
	inflowingFlux.x = texelFetch(uWaterOutflowFluxTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).y;
	inflowingFlux.y = texelFetch(uWaterOutflowFluxTexture, ivec2(gl_FragCoord.xy) + ivec2( 1, 0), 0).x;
	inflowingFlux.z = texelFetch(uWaterOutflowFluxTexture, ivec2(gl_FragCoord.xy) + ivec2( 0, 1), 0).w;
	inflowingFlux.w = texelFetch(uWaterOutflowFluxTexture, ivec2(gl_FragCoord.xy) + ivec2( 0,-1), 0).z;
	vec4 outflowingFlux = texelFetch(uWaterOutflowFluxTexture, ivec2(gl_FragCoord.xy), 0);
	float inflowingWater = inflowingFlux.x + inflowingFlux.y + inflowingFlux.z + inflowingFlux.w;
	float outflowingWater = outflowingFlux.x + outflowingFlux.y + outflowingFlux.z + outflowingFlux.w;
	float waterHeightChange = uDeltaTime * (inflowingWater - outflowingWater);

	// update water height with in/out-flowing water
	float waterHeight = texelFetch(uWaterHeightTexture, ivec2(gl_FragCoord.xy), 0).x + waterHeightChange / (uPipeLength * uPipeLength);

	// calculate water flow velocity
	vec2 velocity = 0.5 * (inflowingFlux.xz - outflowingFlux.xz + inflowingFlux.yw - outflowingFlux.yw);

	// calculate normal
	vec3 dhdx = vec3(2.0 * uPipeLength, texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(1, 0), 0).x - texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).x, 0.0);
	vec3 dhdy = vec3(0.0, texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0, 1), 0).x - texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).x, 2.0 * uPipeLength);
	vec3 N = normalize(cross(dhdx, dhdy));

	// calculate sediment capacity of water
	float lmax = clamp((uMaxErosionDepth - waterHeight) / uMaxErosionDepth, 0.0, 1.0);
	float localTiltAngle = min(abs(N.y), 0.05);
	float velocityLength = dot(velocity, velocity) > 1e-7 ? length(velocity) : 0.0;
	float waterSedimentCapacity = uSedimentCapacity * localTiltAngle * velocityLength * lmax;

	float terrainHeight = texelFetch(uTerrainHeightTexture, ivec2(gl_FragCoord.xy), 0).x;
	vec2 sedimentHardness = texelFetch(uSedimentHardnessTexture, ivec2(gl_FragCoord.xy), 0).xy;
	float sediment = sedimentHardness.x;
	float hardness = sedimentHardness.y;
	
	// suspend or depose soil
	bool deposeSoil = sediment >= waterSedimentCapacity;
	float sedimentDelta = deposeSoil
					? -(uDepositionRate * (sediment - waterSedimentCapacity))
					: (hardness * uSuspensionRate * (waterSedimentCapacity - sediment));
	sedimentDelta *= uDeltaTime;

	terrainHeight -= sedimentDelta;
	sediment += sedimentDelta;
	waterHeight += sedimentDelta;

	// soften terrain, if soil was deposed
	hardness = deposeSoil
					? max(0.1, hardness - uDeltaTime * uSedimentSofteningRate * uSuspensionRate * (sediment - sedimentDelta - waterSedimentCapacity))
					: hardness;

	// evaporation
	waterHeight = waterHeight * (1.0 - uEvaporationRate * uDeltaTime);

	oTerrainHeight = vec4(terrainHeight);
	oWaterHeight = vec4(waterHeight);
	oVelocity = vec4(velocity, 0.0, 1.0);
	oSedimentHardness = vec4(sediment, hardness, 0.0, 1.0);
}