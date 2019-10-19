import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
let renderer: Renderer;
let camera: Camera;
let inputController: InputController;

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
	window.onresize = () => renderer.resized();
	renderer.resized();

	requestAnimationFrame(main);
}

function testButtonPressed() {
	//
	renderer.getHeightmapRenderer().scheduleUpdate();
}

function setupUI() {
	const cameraButton = <HTMLButtonElement>document.querySelector("#cameraButton");
	cameraButton.onclick = () => inputController.toggleFpsMode();

	const testButton = <HTMLButtonElement>document.querySelector("#testButton");
	testButton.onclick = testButtonPressed;
}

function update(now: number, deltaTime: number) {
	inputController.update(now, deltaTime);
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
