#version 300 es

precision mediump float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoord;

uniform mat4 uViewProjectionMatrix;
uniform vec2 uPosition;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;
uniform sampler2D uHeightmapTexture;

void main(void) {
	float height = texture(uHeightmapTexture, uPosition.xy * uTexelSizeInMeters * (1.0 / vec2(textureSize(uHeightmapTexture, 0).xy))).r * uHeightScaleInMeters;
	vec3 position = aPosition + vec3(uPosition.x, height, uPosition.y);
	
	gl_Position = uViewProjectionMatrix * vec4(position, 1.0);
	vWorldPos = position;
	vNormal = aNormal;
	vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
}