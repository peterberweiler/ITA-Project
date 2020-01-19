#version 300 es
precision highp float;

in vec2 vCoords;

layout (location = 0) out vec4 oSedimentHardness;

uniform sampler2D uSedimentHardnessTexture;
uniform sampler2D uVelocityTexture;
uniform float uDeltaTime;
uniform float uTexelSizeInMeters;

void main(void) {
	// move sediment
	vec2 velocity = texelFetch(uVelocityTexture, ivec2(gl_FragCoord.xy), 0).xy * uDeltaTime;
	vec2 texelSize = 1.0 / vec2(textureSize(uSedimentHardnessTexture, 0).xy);
	vec2 texCoord = vCoords - velocity / uTexelSizeInMeters * texelSize;
	float sediment = textureLod(uSedimentHardnessTexture, texCoord, 0.0).x;
	oSedimentHardness = vec4(sediment, texelFetch(uSedimentHardnessTexture, ivec2(gl_FragCoord.xy), 0).y, 0.0, 1.0);
}