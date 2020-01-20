#version 300 es

#ifndef PI
#define PI (3.14159265359)
#endif // PI

precision mediump float;

uniform vec3 uCamPos;
uniform vec3 uLightDir;
uniform float uTexelSizeInMeters;
uniform float uHeightScaleInMeters;
uniform sampler2D uTerrainHeightTexture;
uniform sampler2D uWaterHeightTexture;
uniform sampler2D uTerrainShadowTexture;

layout(location = 0) out vec4 oColor;

in vec3 vWorldSpacePos;

struct LightingParams {
	vec3 albedo;
	vec3 N;
	vec3 V;
	float metalness;
	float roughness;
};

const float A = 0.15; // shoulder strength
const float B = 0.50; // linear strength
const float C = 0.10; // linear angle
const float D = 0.20; // toe strength
const float E = 0.02; // toe numerator
const float F = 0.30; // toe denominator
const vec3 W = vec3(11.2); // linear white point value

vec3 uncharted2Tonemap(vec3 x)
{
   return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

vec3 accurateLinearToSRGB(in vec3 linearCol)
{
	vec3 sRGBLo = linearCol * 12.92;
	vec3 sRGBHi = (pow(abs(linearCol), vec3(1.0/2.4)) * 1.055) - 0.055;
	vec3 sRGB = mix(sRGBLo, sRGBHi, vec3(greaterThan(linearCol, vec3(0.0031308))));
	return sRGB;
}

float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a2 = roughness*roughness;
    a2 *= a2;
    float NdotH2 = max(dot(N, H), 0.0);
    NdotH2 *= NdotH2;

    float nom   = a2;
    float denom = NdotH2 * (a2 - 1.0) + 1.0;

    denom = PI * denom * denom;

    return nom / max(denom, 0.0000001);
}

float GeometrySmith(float NdotV, float NdotL, float roughness) {
	float r = (roughness + 1.0);
    float k = (r*r) / 8.0;
    float ggx2 =  NdotV / max(NdotV * (1.0 - k) + k, 0.0000001);
    float ggx1 = NdotL / max(NdotL * (1.0 - k) + k, 0.0000001);

    return ggx1 * ggx2;
}


vec3 fresnelSchlick(float HdotV, vec3 F0) {
	float power = (-5.55473 * HdotV - 6.98316) * HdotV;
	return F0 + (1.0 - F0) * pow(2.0, power);
}

vec3 cookTorranceSpecularBrdf(const LightingParams params, vec3 radiance, vec3 L) {
	vec3 H = normalize(params.V + L);
	float NdotL = max(dot(params.N, L), 0.0);
	float NdotV = max(dot(params.N, params.V), 0.0);
	
	// Cook-Torrance BRDF
	float NDF = DistributionGGX(params.N, H, params.roughness);
	float G = GeometrySmith(NdotV, NdotL, params.roughness);
	vec3 F0 = mix(vec3(0.04), params.albedo, params.metalness);
	vec3 F = fresnelSchlick(max(dot(H, params.V), 0.0), F0);
	
	vec3 numerator = NDF * G * F;
	float denominator = max(4.0 * NdotV * NdotL, 1e-6);

	vec3 specular = numerator * (1.0 / denominator);
	
	// because of energy conversion kD and kS must add up to 1.0.
	// multiply kD by the inverse metalness so if a material is metallic, it has no diffuse lighting (and otherwise a blend)
	vec3 kD = (vec3(1.0) - F) * (1.0 - params.metalness);

	return (kD * params.albedo * (1.0 / PI) + specular) * radiance * NdotL;
}


float w0(float a)
{
	return (1.0/6.0)*(a*(a*(-a + 3.0) - 3.0) + 1.0);
}

float w1(float a)
{
	return (1.0/6.0)*(a*a*(3.0*a - 6.0) + 4.0);
}

float w2(float a)
{
	return (1.0/6.0)*(a*(a*(-3.0*a + 3.0) + 3.0) + 1.0);
}

float w3(float a)
{
	return (1.0/6.0)*(a*a*a);
}

// g0 and g1 are the two amplitude functions
float g0(float a)
{
	return w0(a) + w1(a);
}

float g1(float a)
{
	return w2(a) + w3(a);
}

// h0 and h1 are the two offset functions
float h0(float a)
{
	return -1.0 + w1(a) / (w0(a) + w1(a));
}

float h1(float a)
{
	return 1.0 + w3(a) / (w2(a) + w3(a));
}

vec4 textureBicubic(sampler2D tex, vec2 uv, vec2 res) {
	uv = uv * res + 0.5;
	vec2 iuv = floor(uv);
	vec2 fuv = fract(uv);

	float g0x = g0(fuv.x);
	float g1x = g1(fuv.x);
	float h0x = h0(fuv.x);
	float h1x = h1(fuv.x);
	float h0y = h0(fuv.y);
	float h1y = h1(fuv.y);

	vec2 p0 = (vec2(iuv.x + h0x, iuv.y + h0y) - 0.5) / res;
	vec2 p1 = (vec2(iuv.x + h1x, iuv.y + h0y) - 0.5) / res;
	vec2 p2 = (vec2(iuv.x + h0x, iuv.y + h1y) - 0.5) / res;
	vec2 p3 = (vec2(iuv.x + h1x, iuv.y + h1y) - 0.5) / res;

	return g0(fuv.y) * (g0x * texture(tex, p0) + g1x * texture(tex, p1)) + g1(fuv.y) * (g0x * texture(tex, p2) + g1x * texture(tex, p3));
}

vec4 textureBicubic(sampler2DArray tex, vec3 uv, vec2 res) {
	uv.xy = uv.xy * res + 0.5;
	vec2 iuv = floor(uv.xy);
	vec2 fuv = fract(uv.xy);

	float g0x = g0(fuv.x);
	float g1x = g1(fuv.x);
	float h0x = h0(fuv.x);
	float h1x = h1(fuv.x);
	float h0y = h0(fuv.y);
	float h1y = h1(fuv.y);

	vec2 p0 = (vec2(iuv.x + h0x, iuv.y + h0y) - 0.5) / res;
	vec2 p1 = (vec2(iuv.x + h1x, iuv.y + h0y) - 0.5) / res;
	vec2 p2 = (vec2(iuv.x + h0x, iuv.y + h1y) - 0.5) / res;
	vec2 p3 = (vec2(iuv.x + h1x, iuv.y + h1y) - 0.5) / res;

	return g0(fuv.y) * (g0x * texture(tex, vec3(p0, uv.z)) + g1x * texture(tex, vec3(p1, uv.z))) + g1(fuv.y) * (g0x * texture(tex, vec3(p2, uv.z)) + g1x * texture(tex, vec3(p3, uv.z)));
}

float linearDepth(float depth)
{
	float n = 0.1;
	float f = 10000.0;
    float z_n = 2.0 * depth - 1.0;
    return 2.0 * n * f / (f + n - z_n * (f - n));
}

void main(void) {

	vec2 texSize = vec2(textureSize(uTerrainHeightTexture, 0).xy);
	vec2 texelSize = (1.0 / texSize);
	vec2 texCoord = vWorldSpacePos.xz  * uTexelSizeInMeters * texelSize;

	vec3 P = vec3(vWorldSpacePos.x, textureBicubic(uTerrainHeightTexture, texCoord, texSize).x * uHeightScaleInMeters, vWorldSpacePos.z);
	P.y += textureBicubic(uWaterHeightTexture, texCoord, texSize).x * uHeightScaleInMeters;

	// Sample neighboring pixels
	vec3 Pr = vWorldSpacePos + vec3(uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pl = vWorldSpacePos + vec3(-uTexelSizeInMeters, 0.0, 0.0);
	vec3 Pb = vWorldSpacePos + vec3(0.0, 0.0, uTexelSizeInMeters);
	vec3 Pt = vWorldSpacePos + vec3(0.0, 0.0, -uTexelSizeInMeters);

	Pr.y = textureBicubic(uTerrainHeightTexture, Pr.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters + textureBicubic(uWaterHeightTexture, Pr.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters;
	Pl.y = textureBicubic(uTerrainHeightTexture, Pl.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters + textureBicubic(uWaterHeightTexture, Pl.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters;
	Pb.y = textureBicubic(uTerrainHeightTexture, Pb.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters + textureBicubic(uWaterHeightTexture, Pb.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters;
	Pt.y = textureBicubic(uTerrainHeightTexture, Pt.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters + textureBicubic(uWaterHeightTexture, Pt.xz  * uTexelSizeInMeters * texelSize, texSize).x * uHeightScaleInMeters;

	// Calculate tangent basis vectors using the difference
	vec3 dPdu =  Pr - Pl;
	vec3 dPdv =  Pt - Pb;

	vec3 N = normalize(cross(dPdu, dPdv));

	LightingParams lightingParams;
	lightingParams.albedo = vec3(0.0, 0.0, 1.0);
	lightingParams.N = N;
	lightingParams.V = normalize(uCamPos - P);
	lightingParams.metalness = 0.0;
	lightingParams.roughness = 0.01;

	float terrainShadowHeight = texture(uTerrainShadowTexture, texCoord).x;
	float currentHeight = P.y;
	float penumbraZone = 25.0;
	float distToShadowHeight = -clamp(currentHeight - terrainShadowHeight, -penumbraZone, 0.0);
	float shadowAlpha = 1.0 - distToShadowHeight / penumbraZone;
	float shadow = smoothstep(0.0, 1.0, shadowAlpha);

	vec3 color = cookTorranceSpecularBrdf(lightingParams, vec3(10.0), normalize(uLightDir)) * shadow;

	vec3 skyColor = pow(vec3(0.529, 0.808, 0.922), vec3(2.2));

	// ambient
	vec3 ambientColor = mix(vec3(0.18), skyColor, vec3(N.y) * 0.5 + 0.5);
	color += ambientColor * 2.0 * (1.0 / PI) * lightingParams.albedo;

	// fog
	float fogAlpha = exp(-0.66 * linearDepth(gl_FragCoord.z) / 10000.0);
	color += mix(skyColor, color, clamp(fogAlpha * fogAlpha, 0.0, 1.0));


	color = uncharted2Tonemap(1.0 * color);
	vec3 whiteScale = 1.0/uncharted2Tonemap(W);
	color *= whiteScale;
    // gamma correct
    color = accurateLinearToSRGB(color);//pow(color, vec3(1.0/2.2));

	float alpha = max(dot(lightingParams.V, lightingParams.N), 0.0);
	alpha *= alpha;
	alpha *= alpha;
	clamp(alpha, 0.0, 0.7);
	oColor = vec4(color, 1.0 - alpha);
}