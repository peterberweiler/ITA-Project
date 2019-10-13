/*
 * This file contains a general camera and an orbit camera.
 *
 * The camera generates the view and projection matricies.
 *
 */

import { mat4, vec3 } from "gl-matrix";

// max angle for looking up/down
const maxVerticalAngle = Math.PI / 2 * 0.9;

type CameraOptions = {
	center?: vec3 | number[],
	eye?: vec3 | number[],
	up?: vec3 | number[],
	zNear?: number,
	zFar?: number,
	aspectRatio?: number,
	fieldOfView?: number,
};

export class Camera {
	public center: vec3;
	public eye: vec3;
	public up: vec3;

	public zNear: number;
	public zFar: number;

	public aspectRatio: number;
	public fieldOfView: number;

	public viewMatrix: mat4;
	public projectionMatrix: mat4;

	constructor(options: CameraOptions) {
		this.center = vec3.clone(options.center || [0, 0, 0]);
		this.eye = vec3.clone(options.eye || [0, 10, 0]);
		this.up = vec3.normalize(vec3.create(), options.up || [0, 1, 0]);

		this.zNear = options.zNear || 0;
		this.zFar = options.zFar || 1000;

		this.aspectRatio = options.aspectRatio || (16 / 9);
		this.fieldOfView = (options.fieldOfView || 60) * Math.PI / 180;

		this.viewMatrix = mat4.create();
		this.projectionMatrix = mat4.create();

		setTimeout(() => {
			this.updateViewMatrix();
			this.updateProjectionMatrix();
		});
	}

	updateViewMatrix() {
		mat4.lookAt(this.viewMatrix, this.eye, this.center, this.up);
	}

	updateProjectionMatrix() {
		mat4.perspective(
			this.projectionMatrix,
			this.fieldOfView,
			this.aspectRatio,
			this.zNear,
			this.zFar
		);
	}
}

type OrbitCameraOptions = CameraOptions & {
	viewDirecton?: vec3 | number[],
	distance?: number,
	hAngle?: number,
	vAngle?: number
};

export class OrbitCamera extends Camera {
	public viewDirecton: vec3;
	public distance: number;
	public hAngle: number; // horizontal
	public vAngle: number; // vertical

	constructor(options: OrbitCameraOptions) {
		super(options);
		this.viewDirecton = vec3.clone(options.viewDirecton || [0, 1, 0]);
		this.distance = options.distance || 10;
		this.hAngle = options.hAngle || 0;
		this.vAngle = options.vAngle || 0;
	}

	updateViewMatrix() {
		this.vAngle = Math.min(maxVerticalAngle, Math.max(-maxVerticalAngle, this.vAngle));
		this.distance = Math.max(Number.EPSILON, this.distance);

		vec3.scale(this.eye, this.viewDirecton, -this.distance);

		vec3.add(this.eye, this.eye, this.center);
		vec3.rotateX(this.eye, this.eye, this.center, this.vAngle);
		vec3.rotateY(this.eye, this.eye, this.center, this.hAngle);
		super.updateViewMatrix();
	}
}
