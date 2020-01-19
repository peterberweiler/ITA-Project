#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oState;
layout (location = 1) out vec4 oVelocity;

uniform sampler2D uStateTexture; // X: terrain height Y: water height Z: sediment W: hardness
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
	float inflowingWater = dot(inflowingFlux, vec4(1.0));
	float outflowingWater = dot(outflowingFlux, vec4(1.0));
	float waterHeightChange = uDeltaTime * (inflowingWater - outflowingWater);

	vec4 state = texelFetch(uStateTexture, ivec2(gl_FragCoord.xy), 0)

	// update water height with in/out-flowing water
	float waterHeight = state.y + waterHeightChange / (uPipeLength * uPipeLength);

	// calculate water flow velocity
	vec2 velocity = 0.5 * (inflowingFlux.xz - outflowingFlux.xz + inflowingFlux.yw - outflowingFlux.yw);

	// calculate normal
	vec3 dhdx = vec3(2.0 * uPipeLength, texelFetch(uStateTexture, ivec2(gl_FragCoord.xy) + ivec2(1, 0), 0).x - texelFetch(uStateTexture, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).x, 0.0);
	vec3 dhdy = vec3(0.0, texelFetch(uStateTexture, ivec2(gl_FragCoord.xy) + ivec2(0, 1), 0).x - texelFetch(uStateTexture, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).x, 2.0 * uPipeLength);
	vec3 N = normalize(cross(dhdx, dhdy))

	// calculate sediment capacity of water
	float lmax = clamp((uMaxErosionDepth - waterHeight) / uMaxErosionDepth, 0.0, 1.0);
	float localTiltAngle = max(abs(N.y), 0.05);
	float waterSedimentCapacity = uSedimentCapacity * localTiltAngle * length(velocity) * lmax;

	float terrainHeight = state.x;
	float sediment = state.z;
	float hardness = state.w;
	
	// suspend or depose soil
	bool deposeSoil = sediment >= waterSedimentCapacity;
	float sedimentDelta = deposeSoil
					? -(uDepositionRate * (sediment - waterSedimentCapacity))
					: (hardness * uSuspensionRate * (waterSedimentCapacity - sediment));
	sedimentDelta *= uDeltaTime

	terrainHeight -= sedimentDelta;
	sediment += sedimentDelta;
	waterHeight += sedimentDelta;

	// soften terrain, if soil was deposed
	hardness = deposeSoil
					? max(uHardnessMin, hardness - uDeltaTime * uSedimentSofteningRate * uSuspensionRate * (sediment - sedimentDelta - waterSedimentCapacity))
					: hardness;

	// evaporation
	waterHeight = waterHeight * (1.0 - uEvaporationRate * uDeltaTime);

	oState = vec4(terrainHeight, waterHeight, sediment, hardness);
	oVelocity = vec4(velocity, 0.0, 1.0);
}