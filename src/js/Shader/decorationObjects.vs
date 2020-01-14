#version 300 es

precision mediump float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;
in vec2 aObjectPosition;

out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoord;

uniform mat4 uViewProjectionMatrix;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;
uniform sampler2D uHeightmapTexture;

void main(void) {
	vec2 objectPosition = aObjectPosition;//vec2(512.0);
	float height = texture(uHeightmapTexture, objectPosition.xy * uTexelSizeInMeters * (1.0 / vec2(textureSize(uHeightmapTexture, 0).xy))).r * uHeightScaleInMeters;
	vec3 position = aPosition + vec3(objectPosition.x, height, objectPosition.y);
	
	gl_Position = uViewProjectionMatrix * vec4(position, 1.0);
	vWorldPos = position;
	vNormal = aNormal;
	vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
}