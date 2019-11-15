#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;

uniform float uData[200];
uniform int uDataLength;

out vec4 oHeight;

void main(void) {	
	float height = texture(uTexture, vCoords).r;

	for (int i = 0; i < uDataLength; i+=5) {

		vec2 drawCoord = vec2(uData[i], uData[i+1]); 
		int type = int(uData[i+2]);
		float radius = uData[i+3];
		float strength = uData[i+4];

		float dist = distance(drawCoord, vCoords);
		float weight = smoothstep(radius, 0.0 , dist);

		if (type == 0) { // normal	
			height += weight * strength;
		} 
		else if (type == 1) { // flatten
			float centerHeight = texture(uTexture, drawCoord).r;

			float delta = (centerHeight - height) * weight;
			height += delta*strength;

		}		
	}

	oHeight = vec4(height, 0.0, 0.0, 1.0);
}