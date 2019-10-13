import { OrbitCamera } from "./Cameras";

type Mouse = {
	lastX: number;
	lastY: number;
	lastButton: number,
	moved: boolean,
	down: boolean,
}

export default class MouseOrbitCameraController {
	camera: OrbitCamera;
	canvas: HTMLCanvasElement;
	mouse: Mouse;

	constructor(camera: OrbitCamera, canvas: HTMLCanvasElement) {
		this.camera = camera;
		this.canvas = canvas;
		this.mouse = {
			lastX: 0,
			lastY: 0,
			lastButton: 0,
			moved: false,
			down: false
		};

		const mouseUp = this.mouseUp.bind(this);
		const mouseMove = this.mouseMove.bind(this);
		const mouseDown = this.mouseDown.bind(this);

		canvas.oncontextmenu = () => false;
		canvas.addEventListener("mousedown", mouseDown);
		canvas.addEventListener("touchstart", mouseDown);

		canvas.addEventListener("mousemove", mouseMove);
		canvas.addEventListener("touchmove", mouseMove);

		canvas.addEventListener("mouseup", mouseUp);
		canvas.addEventListener("touchend", mouseUp);
		canvas.addEventListener("touchcancel", mouseUp);

		canvas.addEventListener("wheel", (event: WheelEvent) => {
			const d = Math.sign(event.deltaY);
			this.camera.distance += (d * 0.1) * this.camera.distance;
			this.camera.updateViewMatrix();

			event.preventDefault();
			event.stopPropagation();
		});
	}

	mouseDown(event: any) {
		this.mouse.down = true;
		this.mouse.lastX = event.offsetX || event.layerX || (event.targetTouches && event.targetTouches[0].pageX) || this.mouse.lastX;
		this.mouse.lastY = event.offsetY || event.layerY || (event.targetTouches && event.targetTouches[0].pageY) || this.mouse.lastY;
		this.mouse.moved = false;
		this.mouse.lastButton = event.button;

		event.preventDefault();
		event.stopPropagation();
	}

	mouseMove(event: any) {
		if (this.mouse.down) {
			const x = event.offsetX || event.layerX || (event.targetTouches && event.targetTouches[0].pageX) || this.mouse.lastX;
			const y = event.offsetY || event.layerY || (event.targetTouches && event.targetTouches[0].pageY) || this.mouse.lastY;

			// if (this.mouse.lastButton === 1) {
			const dx = this.mouse.lastX - x;
			const dy = this.mouse.lastY - y;
			this.camera.hAngle += dx * 0.0075;
			this.camera.vAngle += dy * 0.0075;
			this.camera.updateViewMatrix();
			// }

			this.mouse.lastX = x;
			this.mouse.lastY = y;
			this.mouse.moved = true;
		}

		event.preventDefault();
		event.stopPropagation();
	}

	mouseUp(event: any) {
		// if (this.mouse.down === true && !this.mouse.moved &&
		// 	event.target === this.canvas && event.button === 0) {
		// 	// single left click on canvas
		// }
		this.mouse.down = false;

		event.preventDefault();
		event.stopPropagation();
	}
}
