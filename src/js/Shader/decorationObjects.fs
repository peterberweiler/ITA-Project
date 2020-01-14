#version 300 es

#ifndef PI
#define PI (3.14159265359)
#endif // PI

#define ALPHA_CUTOFF (0.9)
#define MIP_SCALE (0.25)

precision mediump float;

out vec4 oColor;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uCamPos;
uniform vec3 uLightDir;
uniform sampler2D uAlbedoTexture;

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

float linearDepth(float depth)
{
	float n = 0.1;
	float f = 10000.0;
    float z_n = 2.0 * depth - 1.0;
    return 2.0 * n * f / (f + n - z_n * (f - n));
}

// Does not take into account GL_TEXTURE_MIN_LOD/GL_TEXTURE_MAX_LOD/GL_TEXTURE_LOD_BIAS,
// nor implementation-specific flexibility allowed by OpenGL spec
float mip_map_level(in vec2 texture_coordinate) // in texel units
{
    vec2  dx_vtc        = dFdx(texture_coordinate);
    vec2  dy_vtc        = dFdy(texture_coordinate);
    float delta_max_sqr = max(dot(dx_vtc, dx_vtc), dot(dy_vtc, dy_vtc));
    float mml = 0.5 * log2(delta_max_sqr);
    return max( 0.0, mml ); // Thanks @Nims
}

vec3 accurateSRGBToLinear(in vec3 sRGBCol)
{
	vec3 linearRGBLo = sRGBCol * (1.0 / 12.92);
	vec3 linearRGBHi = pow((sRGBCol + vec3(0.055)) * vec3(1.0 / 1.055), vec3(2.4));
	vec3 linearRGB = mix(linearRGBLo, linearRGBHi, vec3(greaterThan(sRGBCol, vec3(0.04045))));
	return linearRGB;
}

void main(void) {

	vec4 albedo = texture(uAlbedoTexture, vTexCoord);

	albedo.a *= 1.0 + mip_map_level(vec2(textureSize(uAlbedoTexture, 0)) * vTexCoord) * MIP_SCALE;
	if(albedo.a < ALPHA_CUTOFF)
	{
		discard;
	}

	LightingParams lightingParams;
	lightingParams.albedo = accurateSRGBToLinear(albedo.rgb);
	lightingParams.N = normalize(vNormal);
	lightingParams.V = normalize(uCamPos - vWorldPos);
	lightingParams.metalness = 0.0;
	lightingParams.roughness = 0.9;

	vec3 color = cookTorranceSpecularBrdf(lightingParams, vec3(10.0), normalize(uLightDir));

	vec3 skyColor = pow(vec3(0.529, 0.808, 0.922), vec3(2.2));

	// ambient
	vec3 ambientColor = mix(vec3(0.18), skyColor, vec3(lightingParams.N.y) * 0.5 + 0.5);
	color += ambientColor * 6.0 * (1.0 / PI) * lightingParams.albedo;

	// fog
	float fogAlpha = exp(-0.66 * linearDepth(gl_FragCoord.z) / 10000.0);
	color += mix(skyColor, color, clamp(fogAlpha * fogAlpha, 0.0, 1.0));


	color = uncharted2Tonemap(1.0 * color);
	vec3 whiteScale = 1.0/uncharted2Tonemap(W);
	color *= whiteScale;
    // gamma correct
    color = accurateLinearToSRGB(color);//pow(color, vec3(1.0/2.2));

	oColor = vec4(color, 1.0);
}