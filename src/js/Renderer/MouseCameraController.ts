import { Camera, CameraController } from "./Cameras";

type Mouse = {
	lastX: number;
	lastY: number;
	lastButton: number,
	moved: boolean,
	down: boolean,
}

let fpsMode = true;

export default class MouseCameraController {
	camera: Camera;
	cameraController: CameraController
	canvas: HTMLCanvasElement;
	mouse: Mouse;

	constructor(camera: Camera, canvas: HTMLCanvasElement) {
		this.camera = camera;
		this.cameraController = new CameraController(this.camera);
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
			if (!fpsMode) {
				this.cameraController.updateArcBall([0, 0], event.deltaY * 0.01);
			}
			event.preventDefault();
			event.stopPropagation();
		});

		let cameraController = this.cameraController;
		document.addEventListener("keydown", function (event) {
			if (fpsMode) {
				if (event.keyCode === 87) { // W
					cameraController.updateFPS([0.0, 0.0, -0.1], 0, 0);
				}
				if (event.keyCode === 65) { // A
					cameraController.updateFPS([-0.1, 0.0, 0.0], 0, 0);
				}
				if (event.keyCode === 83) { // S
					cameraController.updateFPS([0.0, 0.0, 0.1], 0, 0);
				}
				if (event.keyCode === 68) { // D
					cameraController.updateFPS([0.1, 0.0, 0.0], 0, 0);
				}
				if (event.keyCode === 67) { // C
					cameraController.updateFPS([0.0, -0.1, 0.0], 0, 0);
				}
				if (event.keyCode === 32) { // space
					cameraController.updateFPS([0.0, 0.1, 0.0], 0, 0);
				}
			}
		}, false);
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
			if (!fpsMode) {
				this.cameraController.updateArcBall([dx * 0.0075, dy * 0.0075], 0);
			}
			else {
				this.cameraController.updateFPS([0, 0, 0], dy * -0.0075, dx * -0.0075);
			}
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
