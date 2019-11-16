import EditorController from "./EditorController";
import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const menuItems = document.querySelectorAll<HTMLDivElement>("#menu .menu-item");

const radiusInput = document.getElementById("radius-input") as HTMLInputElement;
const strengthInput = document.getElementById("strength-input") as HTMLInputElement;
const radiusOutput = document.getElementById("radius-output") as HTMLInputElement;
const strengthOutput = document.getElementById("strength-output") as HTMLInputElement;

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
	editorController.updateShadows();

	requestAnimationFrame(main);
}

//TODO: create UI class and file

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

	radiusInput.oninput = () => {
		radiusOutput.value = radiusInput.value;
		editorController.setRadius(parseFloat(radiusInput.value));
	};
	strengthInput.oninput = () => {
		strengthOutput.value = strengthInput.value;
		editorController.setStrength(parseFloat(strengthInput.value));
	};

	let i = 0;
	menuItems.forEach(item => {
		const index = i++;
		item.onclick = () => {
			selectMenuIndex(index);
		};
	});

	selectMenuIndex(0);
}

function selectMenuIndex(index: number): void {
	menuItems.forEach(item => item.removeAttribute("selected"));
	menuItems[index].setAttribute("selected", "true");

	switch (index) {
		case 0: // height brush
			editorController.selectedBrush = editorController.brush.height;
			editorController.brush.height.direction = 1;

			break;
		case 1: // height brush
			editorController.selectedBrush = editorController.brush.height;
			editorController.brush.height.direction = -1;
			break;
		case 2: // flatten brush
			editorController.selectedBrush = editorController.brush.flatten;
			break;
		case 3:
			editorController.selectedBrush = null;
			break;
	}

	if (editorController.selectedBrush) {
		if ("radius" in editorController.selectedBrush) {
			radiusInput.value = editorController.selectedBrush.radius.toString();
			radiusOutput.value = editorController.selectedBrush.radius.toString();
		}
		if ("strength" in editorController.selectedBrush) {
			strengthInput.value = editorController.selectedBrush.strength.toString();
			strengthOutput.value = editorController.selectedBrush.strength.toString();
		}
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
			editorController.mouseDownAtPoint(x, y, deltaTime);
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
