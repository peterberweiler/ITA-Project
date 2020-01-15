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
	float height = texture(uHeightmapTexture, aObjectPosition.xy * uTexelSizeInMeters * (1.0 / vec2(textureSize(uHeightmapTexture, 0).xy))).r * uHeightScaleInMeters;
	
	// calc scale and rotation mat
	float scale = 0.7 + 0.6 * fract(aObjectPosition.x * aObjectPosition.y);
	float angle = 3.1415 * 2.0 * fract(aObjectPosition.x + aObjectPosition.y);
	float c = cos(angle);
	float s = sin(angle);
	mat2 rotationMatrix = mat2(c, s, -s, c);
	//

	vec3 position = aPosition * scale;
	position.xz *= rotationMatrix;  //rotate position around y axis
	position += vec3(aObjectPosition.x, height, aObjectPosition.y);

	gl_Position = uViewProjectionMatrix * vec4(position, 1.0);
	vWorldPos = position;
	vNormal = aNormal;
	vNormal.xz *= rotationMatrix; //rotate normal around y axis

	vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
}