import { vec3 } from "gl-matrix";
import { Camera, CameraController } from "./Cameras";

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

	public mouse = {
		canvas: {
			last: [0, 0],
			current: [0, 0],
			over: false,
		},
		terrain: {
			input: [0, 0],
			last: [0, 0],
			current: [0, 0],
			over: false,
		},
		button: 0,
		buttonDown: false,
	}

	private keyDown: any = {}
	fpsMode = true;
	isRunning = false;

	constructor(camera: Camera, canvas: HTMLCanvasElement) {
		this.camera = camera;
		this.cameraController = new CameraController(this.camera);
		this.canvas = canvas;

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

		canvas.addEventListener("mouseleave", () => { this.mouse.canvas.over = false; });

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
		const x = event.clientX || (event.targetTouches && event.targetTouches[0].pageX) || 0;
		const y = event.clientY || (event.targetTouches && event.targetTouches[0].pageY) || 0;
		this.mouse.canvas.current[0] = x;
		this.mouse.canvas.current[1] = y;
		this.mouse.canvas.last[0] = x;
		this.mouse.canvas.last[1] = y;

		this.mouse.terrain.current[0] = this.mouse.terrain.input[0];
		this.mouse.terrain.current[1] = this.mouse.terrain.input[1];
		this.mouse.terrain.last[0] = this.mouse.terrain.input[0];
		this.mouse.terrain.last[1] = this.mouse.terrain.input[1];

		this.mouse.buttonDown = true;
		this.mouse.button = event.button;
	}

	mouseMove(event: any) {
		this.mouse.canvas.last[0] = this.mouse.canvas.current[0];
		this.mouse.canvas.last[1] = this.mouse.canvas.current[1];
		this.mouse.canvas.current[0] = event.clientX || (event.targetTouches && event.targetTouches[0].pageX) || 0;
		this.mouse.canvas.current[1] = event.clientY || (event.targetTouches && event.targetTouches[0].pageY) || 0;

		this.mouse.terrain.last[0] = this.mouse.terrain.current[0];
		this.mouse.terrain.last[1] = this.mouse.terrain.current[1];
		this.mouse.terrain.current[0] = this.mouse.terrain.input[0];
		this.mouse.terrain.current[1] = this.mouse.terrain.input[1];
		this.mouse.terrain.over = !!(this.mouse.terrain.input[0] || this.mouse.terrain.input[1]);

		if (this.mouse.buttonDown) {
			if (this.mouse.button === 2) {
				const dx = this.mouse.canvas.last[0] - this.mouse.canvas.current[0];
				const dy = this.mouse.canvas.last[1] - this.mouse.canvas.current[1];

				if (!this.fpsMode) {
					this.cameraController.updateArcBall([dx * 0.0075, dy * 0.0075], 0);
				}
				else {
					this.cameraController.updateFPS([0, 0, 0], dy * -0.0075, dx * -0.0075);
				}
			}
		}
		this.mouse.canvas.over = true;
	}

	mouseUp(_event: any) {
		// if (this.mouse.down === true && !this.mouse.moved &&
		// 	event.target === this.canvas && event.button === 0) {
		// 	// single left click on canvas
		// }
		this.mouse.buttonDown = false;
	}

	setTerrainMousePos(worldSpacePos: vec3 | number[]) {
		this.mouse.terrain.input[0] = worldSpacePos[0];
		this.mouse.terrain.input[1] = worldSpacePos[2];
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
