#version 300 es
precision highp float;

out vec2 vCoords;

void main(void) {
	float x = -1.0 + float((gl_VertexID & 1) << 2);
	float y = -1.0 + float((gl_VertexID & 2) << 1);
	vCoords.x = (x+1.0)*0.5;
	vCoords.y = (y+1.0)*0.5;
	gl_Position = vec4(x, y, 0, 1);
}