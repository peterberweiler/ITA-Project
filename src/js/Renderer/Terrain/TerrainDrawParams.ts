import { mat4, vec3 } from "gl-matrix";

export default class TerrainDrawParams {
	viewProjection: mat4 = mat4.create();
	camPos: vec3 = vec3.create();
	texelSizeInMeters: number = 1;
	heightScaleInMeters: number = 1;
	heightMap: WebGLTexture | null = null;
	shadowMap: WebGLTexture | null = null;
	weightMap: WebGLTexture | null = null;
}
