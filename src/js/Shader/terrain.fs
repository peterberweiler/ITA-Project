#version 300 es

precision mediump float;

uniform sampler2D uHeightmapTexture;
uniform vec3 uColor;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;

in vec3 vWorldSpacePos;

out vec4 color;

vec3 minDiff(vec3 P, vec3 Pr, vec3 Pl)
{
    vec3 V1 = Pr - P;
    vec3 V2 = P - Pl;
    return (dot(V1, V1) < dot(V2, V2)) ? V1 : V2;
}

void main(void) {
	vec2 texelSize = (1.0 / vec2(textureSize(uHeightmapTexture, 0).xy));
	vec2 texCoord = vWorldSpacePos.xz  * uTexelSizeInMeters * texelSize;

	if (texCoord.x > 1.0 || texCoord.y > 1.0 || texCoord.x < 0.0 || texCoord.y < 0.0){
		discard;
	}

	vec3 P = vec3(vWorldSpacePos.x, texture(uHeightmapTexture, texCoord).x * uHeightScaleInMeters, vWorldSpacePos.z);
	// Sample neighboring pixels
	vec3 Pr = vWorldSpacePos + vec3(uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pl = vWorldSpacePos + vec3(-uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pb = vWorldSpacePos + vec3(0.0, 0.0, uTexelSizeInMeters);
	vec3 Pt = vWorldSpacePos + vec3(0.0, 0.0, -uTexelSizeInMeters);

	Pr.y = texture(uHeightmapTexture, Pr.xz  * uTexelSizeInMeters * texelSize).x * uHeightScaleInMeters;
	Pl.y = texture(uHeightmapTexture, Pl.xz  * uTexelSizeInMeters * texelSize).x * uHeightScaleInMeters;
	Pb.y = texture(uHeightmapTexture, Pb.xz  * uTexelSizeInMeters * texelSize).x * uHeightScaleInMeters;
	Pt.y = texture(uHeightmapTexture, Pt.xz  * uTexelSizeInMeters * texelSize).x * uHeightScaleInMeters;

	// Calculate tangent basis vectors using the minimum difference
	vec3 dPdu = minDiff(P, Pr, Pl);
	vec3 dPdv = minDiff(P, Pt, Pb);
	
	vec3 N = normalize(cross(dPdu, dPdv));

	color = vec4(dot(N, normalize(vec3(0.0, 1.0, 0.5))) * vec3(0.0, 0.5, 0.1), 1.0);
}