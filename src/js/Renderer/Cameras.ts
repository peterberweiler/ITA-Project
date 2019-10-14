import { mat4, quat, vec3 } from "gl-matrix";

export class Camera {
	public position: vec3;
	public orientation: quat;

	public aspectRatio: number;
	public fovy: number;

	public zNear: number;
	public zFar: number;

	public viewMatrix: mat4;
	public projectionMatrix: mat4;

	constructor(position: vec3 | [number, number, number], orientation: [number, number, number], aspectRatio: number, fovy: number, near: number, far: number) {
		this.position = vec3.clone(position);
		this.orientation = quat.fromEuler(quat.create(), orientation[0], orientation[1], orientation[2]);
		this.aspectRatio = aspectRatio;
		this.fovy = fovy;
		this.zNear = near;
		this.zFar = far;
		this.viewMatrix = mat4.identity(mat4.create());
		this.projectionMatrix = mat4.create();
		mat4.lookAt(this.viewMatrix, this.position, [0, 0, 0], [0, 1, 0]);
		this.updateProjectionMatrix();
	}

	getForwardDirection() {
		return vec3.clone([this.viewMatrix[2], this.viewMatrix[4 + 2], this.viewMatrix[8 + 2]]);
	}

	getPosition() {
		return this.position;
	}

	updateProjectionMatrix() {
		this.projectionMatrix = mat4.perspective(mat4.create(), this.fovy, this.aspectRatio, this.zNear, this.zFar);
	}
}

export class CameraController {
	public camera: Camera;
	public center: vec3;
	public distance: number;
	public theta: number;
	public phi: number;

	constructor(camera: Camera, center: vec3 | [number, number, number] = [0, 0, 0], distance: number = 10, theta: number = 0, phi: number = (Math.PI * 0.5)) {
		this.camera = camera;
		this.center = vec3.clone(center);
		this.distance = distance;
		this.theta = theta;
		this.phi = phi;
		this.updateFPS([0, 0, 0], 0, 0);
	}

	updateArcBall(angleDelta: [number, number], distanceDelta: number) {
		this.distance += distanceDelta * this.distance;
		this.distance = Math.max(0.0, this.distance);

		this.theta = Math.min(Math.max(this.theta + angleDelta[1], 0.0001), Math.PI - 0.0001);
		this.phi += angleDelta[0];

		quat.fromEuler(this.camera.orientation, this.phi, this.theta, 0);

		this.camera.position[0] = this.center[0] + (this.distance * Math.sin(this.theta) * Math.sin(this.phi));
		this.camera.position[1] = this.center[1] + (this.distance * Math.cos(this.theta));
		this.camera.position[2] = this.center[2] + (this.distance * Math.sin(this.theta) * Math.cos(this.phi));

		mat4.lookAt(this.camera.viewMatrix, this.camera.position, this.center, [0, 1, 0]);
	}

	updateFPS(translationOffset: vec3 | [number, number, number], pitchOffset: number, yawOffset: number) {
		let tmp = quat.fromEuler(quat.create(), (pitchOffset / Math.PI) * 180, 0, 0); // euler angles are expected to be in degrees
		let tmp1 = quat.setAxisAngle(quat.create(), [0, 1, 0], yawOffset);
		quat.multiply(tmp, tmp, this.camera.orientation);
		quat.multiply(this.camera.orientation, tmp, tmp1);
		quat.normalize(this.camera.orientation, this.camera.orientation);

		let orientation = mat4.fromQuat(mat4.create(), this.camera.orientation);

		let forward = vec3.clone([orientation[2], orientation[4 + 2], orientation[8 + 2]]);
		let up = vec3.clone([orientation[1], orientation[4 + 1], orientation[8 + 1]]);
		let right = vec3.clone([orientation[0], orientation[4 + 0], orientation[8 + 0]]);

		vec3.add(this.camera.position, this.camera.position, [forward[0] * translationOffset[2], forward[1] * translationOffset[2], forward[2] * translationOffset[2]]);
		vec3.add(this.camera.position, this.camera.position, [up[0] * translationOffset[1], up[1] * translationOffset[1], up[2] * translationOffset[1]]);
		vec3.add(this.camera.position, this.camera.position, [right[0] * translationOffset[0], right[1] * translationOffset[0], right[2] * translationOffset[0]]);

		mat4.multiply(this.camera.viewMatrix, orientation, mat4.translate(mat4.create(), mat4.create(), [-this.camera.position[0], -this.camera.position[1], -this.camera.position[2]]));
	}
}
