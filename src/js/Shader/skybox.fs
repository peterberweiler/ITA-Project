#version 300 es

precision mediump float;

uniform mat4 uInvViewProjection;
uniform vec3 uSunDir;

in vec4 vRay;
layout(location = 0) out vec4 oColor;
layout(location = 1) out vec4 oDepth;

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

//
// Fast skycolor function by Íñigo Quílez
// https://www.shadertoy.com/view/MdX3Rr
//
vec3 getSkyColor(vec3 rd) {
	vec3 sunDir = normalize(uSunDir);
    float sundot = clamp(dot(rd,sunDir),0.0,1.0);
	vec3 col = vec3(0.2,0.5,0.85)*1.1 - max(rd.y,0.01)*max(rd.y,0.01)*0.5;
    col = mix( col, 0.85*vec3(0.7,0.75,0.85), pow(1.0-max(rd.y,0.0), 6.0) );

    col += 0.25*vec3(1.0,0.7,0.4)*pow( sundot,5.0 );
    col += 0.25*vec3(1.0,0.8,0.6)*pow( sundot,64.0 );
    col += 0.20*vec3(1.0,0.8,0.6)*pow( sundot,512.0 );
    
    col += clamp((0.1-rd.y)*10., 0., 1.) * vec3(.0,.1,.2);
    col += 0.2*vec3(1.0,0.8,0.6)*pow( sundot, 8.0 );
    return col;
}

void main(void) {
	vec4 ray = uInvViewProjection * vRay;
	ray.xyz /= ray.w;
	ray.xyz = normalize(ray.xyz);

	//float alpha = ray.y * 0.5 + 0.5;
	//alpha = pow(alpha, 0.5);
	//vec3 sky = mix(vec3(0.2, 0.1, 0.05), vec3(0.529, 0.808, 0.922) * 1.2, alpha);
//
	//vec3 sunDir = normalize(vec3(0.0, 1.118, 0.559));
	//vec3 sun = vec3(1.0, 0.89, 0.77) * min(pow(max(0.0, dot(ray.xyz, sunDir)), 2000.0), 1.0);
//
	//vec3 color = sky + sun;
	vec3 color = getSkyColor(ray.xyz);

	oColor = vec4(color, 1.0);
	//float alpha = ray.y * 0.5 + 0.5;
	//alpha = pow(alpha, 0.5);
	//oColor.rgb = mix(vec3(0.2, 0.1, 0.05), vec3(0.529, 0.808, 0.922), alpha);
	//oColor.a = 1.0;
	oDepth = vec4(0.0);
}