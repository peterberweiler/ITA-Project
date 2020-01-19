import { mat4, vec3 } from "gl-matrix";

export default class TerrainDrawParams {
	viewProjection: mat4 = mat4.create();
	camPos: vec3 = vec3.create();
	cursorPosRadius: vec3 = vec3.create();
	lightDir: vec3 = vec3.create();
	texelSizeInMeters: number = 1;
	heightScaleInMeters: number = 1;
	enableAlphaBlending: boolean = false;
	drawCursor: boolean = false;
	time: number = 0;
	activeLayers: number = 0;
	layerOrder: number[] = [];
	heightMap: WebGLTexture | null = null;
	shadowMap: WebGLTexture | null = null;
	shadowMap2: WebGLTexture | null = null;
	weightMap: WebGLTexture | null = null;
	debugTexture: WebGLTexture | null = null;
	materialUBO: WebGLBuffer | null = null;
}
