import HeightmapRenderer from "./HeightmapRenderer/HeightmapRenderer";
import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";

const fragSource = require("./Shader/base.fs").default;
const vertSource = require("./Shader/base.vs").default;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
let renderer: Renderer;
let camera: Camera;
let inputController: InputController;
let heightmapRenderer: HeightmapRenderer;

function setupRenderer() {
	camera = new Camera(
		[-20, 10, -20],
		[0, 135, 0],
		16 / 9,
		(45 / 180) * Math.PI,
		0.001,
		1000,
	);

	inputController = new InputController(camera, canvas);
	renderer = new Renderer(canvas, camera);
	window.onresize = () => renderer.resized();
	renderer.resized();

	heightmapRenderer = new HeightmapRenderer(renderer.getTerrain().getHeightmapTexture());

	requestAnimationFrame(main);
}

function testButtonPressed() {
	//
	heightmapRenderer.scheduleUpdate();
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
	heightmapRenderer.render();
	renderer.render(now, deltaTime);

	requestAnimationFrame(main);
	renderer.checkGLError();
}

setupRenderer();
setupUI();
