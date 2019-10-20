#version 300 es
precision highp float;

in vec2 vCoords;

uniform sampler2D uTexture;

uniform float uBrushRadius;
uniform float uBrushStrength;
uniform int uType;
uniform float uDirection;

uniform vec2 uDrawCoords[128];
uniform int uCount;

out float height;

void main(void) {	
	height = texture(uTexture, vCoords).r;

	for (int i = 0; i < uCount; i++) {

		vec2 drawCoord = uDrawCoords[i]; 

		float dist = distance(drawCoord, vCoords);

		float radius = uBrushRadius;

		float weight = smoothstep(radius, 0.0 , dist);

		// if (uType == 0) { // normal	
		height += weight * uBrushStrength * 0.05 * uDirection;
		// } 
		// else if (uType == 1) { // flatten
			// float centerHeight = texture(uTexture, drawCoord).r;
			
			// weight = uBrushStrength * 0.0001;		
			// float delta = (centerHeight - height) * uDirection;

			// height += delta*weight;
		// }		
	}

}