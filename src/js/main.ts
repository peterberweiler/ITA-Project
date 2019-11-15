import EditorController from "./EditorController";
import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const menuItems = document.querySelectorAll<HTMLDivElement>("#menu .menu-item");

let renderer: Renderer;
let camera: Camera;
let inputController: InputController;
let heightmapController: HeightmapController;
let editorController: EditorController;

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
	editorController = new EditorController(heightmapController);
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
		editorController.invertHeightmap();
	};
	(<HTMLButtonElement>document.querySelector("#testButton2")).onclick = () => {
		editorController.randomHeightChange();
	};
	(<HTMLButtonElement>document.querySelector("#testButton3")).onclick = () => {
		heightmapController.queuePass(heightmapController.shadowPass);
	};
	(<HTMLButtonElement>document.querySelector("#testButton4")).onclick = () => {
		//
	};
	(<HTMLButtonElement>document.querySelector("#testButton5")).onclick = () => {
		//
	};

	let i = 0;
	menuItems.forEach(item => {
		const index = i++;
		item.onclick = () => {
			selectMenuIndex(index);
		};
	});
}

function selectMenuIndex(index: number): void {
	menuItems.forEach(item => item.removeAttribute("selected"));
	menuItems[index].setAttribute("selected", "true");

	switch (index) {
		case 0: // height brush
			editorController.selectBrush(editorController.brush.height);
			break;
		case 1: // flatten brush
			editorController.selectBrush(editorController.brush.flatten);
			break;
	}
}

function update(now: number, deltaTime: number) {
	inputController.update(now, deltaTime);

	renderer.setCanvasMouseState(inputController.mouse.over, inputController.mouse.lastX, inputController.mouse.lastY);

	if (inputController.mouse.buttonDown && inputController.mouse.lastButton === 0) {
		const worldSpacePos = renderer.getTerrain().getMouseWorldSpacePos();
		if (worldSpacePos[0] || worldSpacePos[1] || worldSpacePos[2]) {
			const x = worldSpacePos[0] / 1024;
			const y = worldSpacePos[2] / 1024;
			editorController.mouseDownAtPoint(x, y);
		}
	}
}

let lastRenderTime: number | null = null;

function main(now: number) {
	const deltaTime = (lastRenderTime && now) ? (now - lastRenderTime) : (1000 / 60);
	lastRenderTime = now;
	// fps = ((1000 / deltaTime * 0.4) + (fps * 0.6));

	update(now, deltaTime);
	renderer.render(now, deltaTime);

	requestAnimationFrame(main);
	Renderer.checkGLError();
}

setupRenderer();
setupUI();
