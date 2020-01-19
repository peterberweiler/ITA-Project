#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oState;

uniform sampler2D uStateTexture; // X: terrain height Y: water height Z: sediment W: hardness
uniform sampler2D uVelocityTexture;
uniform float uDeltaTime;
uniform float uTexelSizeInMeters;

void main(void) {
	// move sediment
	vec2 velocity = texelFetch(uVelocityTexture, ivec2(gl_FragCoord.xy), 0).xy * uDeltaTime;
	vec2 texelSize = 1.0 / vec2(textureSize(uSedimentTexture, 0).xy);
	vec2 texCoord = vCoords - velocity / uTexelSizeInMeters * texelSize;
	float sediment = textureLod(uStateTexture, texCoord, 0.0).x;
	vec4 state = texelFetch(uStateTexture, ivec2(gl_FragCoord.xy), 0);
	state.z = sediment;
	oState = state;
}