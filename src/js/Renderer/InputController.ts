import { vec3 } from "gl-matrix";
import { Camera, CameraController } from "./Cameras";

type Mouse = {
	lastX: number;
	lastY: number;
	lastButton: number,
	moved: boolean,
	down: boolean,
}

const FPS_TRANSLATION_CONTROL_KEYS = {
	"87": [0.0, 0.0, -0.1], // W
	"65": [-0.1, 0.0, 0.0], // A
	"83": [0.0, 0.0, 0.1], // S
	"68": [0.1, 0.0, 0.0], // D
	"67": [0.0, -0.1, 0.0], // C
	"32": [0.0, 0.1, 0.0], // space
};

export default class InputController {
	camera: Camera;
	cameraController: CameraController
	canvas: HTMLCanvasElement;
	mouse: Mouse;
	keyDown: any = {}
	fpsMode = true;

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
			if (!this.fpsMode) {
				this.cameraController.updateArcBall([0, 0], Math.sign(event.deltaY) * 0.01);
			}
			event.preventDefault();
			event.stopPropagation();
		});

		window.addEventListener("keydown", this.keyboardChange.bind(this, true));
		window.addEventListener("keyup", this.keyboardChange.bind(this, false));

		// window loses focus => release all keys
		window.addEventListener("blur", () => { this.keyDown = {}; });
	}

	// the state of any keyboard key changed
	keyboardChange(isDown: boolean, event: KeyboardEvent) {
		if (this.fpsMode) {
			if (event.keyCode in FPS_TRANSLATION_CONTROL_KEYS) {
				this.keyDown[event.keyCode] = isDown;
				event.stopPropagation();
				event.preventDefault();
			}
		}
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
			if (!this.fpsMode) {
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

	update(now: number, deltaTime: number) {
		if (this.fpsMode) {
			for (const key in FPS_TRANSLATION_CONTROL_KEYS) {
				if (this.keyDown[key]) {
					//@ts-ignore
					const translationOffset = vec3.scale([0, 0, 0], FPS_TRANSLATION_CONTROL_KEYS[key], deltaTime * 0.15);
					this.cameraController.updateFPS(translationOffset, 0, 0);
				}
			}
		}
	}

	toggleFpsMode() {
		this.fpsMode = !this.fpsMode;

		if (this.fpsMode) {
			this.cameraController.updateFPS([0, 0, 0], 0, 0);
		}
		else {
			this.cameraController.updateArcBall([0, 0], 0);
		}
	}
}
