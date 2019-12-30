import { vec3 } from "gl-matrix";
import { Camera, CameraController } from "./Cameras";

type Mouse = {
	lastX: number;
	lastY: number;
	lastButton: number,
	movedSinceButtonDown: boolean,
	over: boolean,
	buttonDown: boolean,
}

//TODO: maybe capture mouse

const FPS_TRANSLATION_CONTROL_KEYS = {
	"87": [0.0, 0.0, -1], // W
	"65": [-1, 0.0, 0.0], // A
	"83": [0.0, 0.0, 1], // S
	"68": [1, 0.0, 0.0], // D
	"67": [0.0, -1, 0.0], // C
	"32": [0.0, 1, 0.0], // space
};

const R_KEY = 82;

// all keys that should be listened to
const CONTROL_KEYS = {
	...FPS_TRANSLATION_CONTROL_KEYS,
	// 16: true,
};

export default class InputController {
	private readonly camera: Camera;
	private readonly cameraController: CameraController
	private readonly canvas: HTMLCanvasElement;
	public mouse: Mouse;
	private keyDown: any = {}
	fpsMode = true;
	isRunning = false;

	//TODO: only update 3d mouse if 2d mouse moved (retain 3d mouse position during draw)

	terrainWorldSpaceMouse = {
		pressed: false,
		lastX: 0,
		lastY: 0,
		lastCanvasMouseX: -Number.MAX_SAFE_INTEGER,
		lastCanvasMouseY: -Number.MAX_SAFE_INTEGER,
	};

	constructor(camera: Camera, canvas: HTMLCanvasElement) {
		this.camera = camera;
		this.cameraController = new CameraController(this.camera);
		this.canvas = canvas;
		this.mouse = {
			lastX: 0,
			lastY: 0,
			lastButton: 0,
			movedSinceButtonDown: false,
			over: false,
			buttonDown: false
		};

		const mouseUp = this.mouseUp.bind(this);
		const mouseMove = this.mouseMove.bind(this);
		const mouseDown = this.mouseDown.bind(this);

		document.oncontextmenu = () => false;
		canvas.addEventListener("mousedown", mouseDown);
		canvas.addEventListener("touchstart", mouseDown);

		document.addEventListener("mousemove", mouseMove);
		document.addEventListener("touchmove", mouseMove);

		document.addEventListener("mouseup", mouseUp);
		document.addEventListener("touchend", mouseUp);
		document.addEventListener("touchcancel", mouseUp);

		canvas.addEventListener("mouseleave", () => { this.mouse.over = false; });

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
			if (event.keyCode in CONTROL_KEYS) {
				this.keyDown[event.keyCode] = isDown;
				event.stopPropagation();
				event.preventDefault();
			}
			if (!isDown && event.keyCode === R_KEY) {
				this.isRunning = !this.isRunning;
			}
		}
	}

	mouseDown(event: any) {
		this.mouse.buttonDown = true;
		this.mouse.lastX = event.clientX || (event.targetTouches && event.targetTouches[0].pageX) || this.mouse.lastX;
		this.mouse.lastY = event.clientY || (event.targetTouches && event.targetTouches[0].pageY) || this.mouse.lastY;
		this.mouse.movedSinceButtonDown = false;
		this.mouse.lastButton = event.button;
	}

	mouseMove(event: any) {
		const x = event.clientX || (event.targetTouches && event.targetTouches[0].pageX) || this.mouse.lastX;
		const y = event.clientY || (event.targetTouches && event.targetTouches[0].pageY) || this.mouse.lastY;

		if (this.mouse.buttonDown) {
			if (this.mouse.lastButton === 2) {
				const dx = this.mouse.lastX - x;
				const dy = this.mouse.lastY - y;
				if (!this.fpsMode) {
					this.cameraController.updateArcBall([dx * 0.0075, dy * 0.0075], 0);
				}
				else {
					this.cameraController.updateFPS([0, 0, 0], dy * -0.0075, dx * -0.0075);
				}
			}

			this.mouse.movedSinceButtonDown = true;
		}
		this.mouse.lastX = x;
		this.mouse.lastY = y;

		this.mouse.over = true;
	}

	mouseUp(event: any) {
		// if (this.mouse.down === true && !this.mouse.moved &&
		// 	event.target === this.canvas && event.button === 0) {
		// 	// single left click on canvas
		// }
		this.mouse.buttonDown = false;
	}

	update(now: number, deltaTime: number) {
		if (this.fpsMode) {
			for (const key in FPS_TRANSLATION_CONTROL_KEYS) {
				if (this.keyDown[key]) {
					let speed = deltaTime * 0.5;
					if (this.isRunning) { speed *= 3; }
					//@ts-ignore
					const translationOffset = vec3.scale([0, 0, 0], FPS_TRANSLATION_CONTROL_KEYS[key], speed);
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
