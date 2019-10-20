import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
let renderer: Renderer;
let camera: Camera;
let inputController: InputController;
let heightmapController: HeightmapController;

function setupRenderer() {
	camera = new Camera(
		[512, 768, -768],
		[-30, 180, 0],
		16 / 9,
		(45 / 180) * Math.PI,
		0.1,
		10000,
	);

	inputController = new InputController(camera, canvas);
	renderer = new Renderer(canvas, camera);
	heightmapController = renderer.getHeightmapRenderer();
	window.onresize = () => renderer.resized();
	renderer.resized();

	// dummy heightmap
	heightmapController.queuePass(heightmapController.perlinPass);

	requestAnimationFrame(main);
}

function setupUI() {
	const cameraButton = <HTMLButtonElement>document.querySelector("#cameraButton");
	cameraButton.onclick = () => inputController.toggleFpsMode();

	(<HTMLButtonElement>document.querySelector("#testButton1")).onclick = () => {
		heightmapController.queuePass(heightmapController.invertPass);
	};
	(<HTMLButtonElement>document.querySelector("#testButton2")).onclick = () => {
		heightmapController.heightBrushPass.addPoint(Math.random(), Math.random());
		heightmapController.queuePass(heightmapController.heightBrushPass);
	};
	(<HTMLButtonElement>document.querySelector("#testButton3")).onclick = () => {
		//
	};
	(<HTMLButtonElement>document.querySelector("#testButton4")).onclick = () => {
		//
	};
	(<HTMLButtonElement>document.querySelector("#testButton5")).onclick = () => {
		//
	};
}

function update(now: number, deltaTime: number) {
	inputController.update(now, deltaTime);

	renderer.setCanvasMouseState(inputController.mouse.over, inputController.mouse.lastX, inputController.mouse.lastY);
}

let lastRenderTime: number | null = null;

function main(now: number) {
	const deltaTime = (lastRenderTime && now) ? (now - lastRenderTime) : (1000 / 60);
	lastRenderTime = now;
	// fps = ((1000 / deltaTime * 0.4) + (fps * 0.6));

	update(now, deltaTime);
	renderer.render(now, deltaTime);

	requestAnimationFrame(main);
	renderer.checkGLError();
}

setupRenderer();
setupUI();
