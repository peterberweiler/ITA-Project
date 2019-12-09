import EditorController from "./EditorController";
import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import { UI } from "./UI";

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

	const canvas = document.getElementById("canvas") as HTMLCanvasElement;
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

function setupUI() {
	UI.on("toggle-camera", () => inputController.toggleFpsMode());

	UI.on("debug1", () => editorController.invertHeightmap());
	UI.on("debug2", () => editorController.randomHeightChange());

	UI.on("debug3", () => {
		heightmapController.generateSurfacePass.setSurfaceTypes([
			[0.5, 1, -150, 100], // snow
			[0, 0.8, -200, 100], // stone
			[0.7, 1, -1000, -150], // grass
			[0, 0.8, -1000, -30], // dirt
		]);
		heightmapController.queuePass(heightmapController.generateSurfacePass);
	});
	UI.on("debug4", () => renderer.getTerrain().surface.loadDefault());
	// UI.on("debug5", () => { });

	UI.on("radius-changed", (value) => editorController.setRadius(value));
	UI.on("strength-changed", (value) => editorController.setStrength(value));

	UI.on("menu-selected", (menuIndex) => {
		switch (menuIndex) {
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
				UI.radiusInput.value = editorController.selectedBrush.radius.toString();
				UI.radiusOutput.value = editorController.selectedBrush.radius.toString();
			}
			if ("strength" in editorController.selectedBrush) {
				UI.strengthInput.value = editorController.selectedBrush.strength.toString();
				UI.strengthOutput.value = editorController.selectedBrush.strength.toString();
			}
		}
	});
}

function update(now: number, deltaTime: number) {
	inputController.update(now, deltaTime);

	renderer.setCanvasMouseState(inputController.mouse.over, inputController.mouse.lastX, inputController.mouse.lastY);

	if (inputController.mouse.buttonDown && inputController.mouse.lastButton === 0 && inputController.mouse.over) {
		const worldSpacePos = renderer.getTerrain().getMouseWorldSpacePos();
		if (worldSpacePos[0] || worldSpacePos[1] || worldSpacePos[2]) {
			const x = worldSpacePos[0];
			const y = worldSpacePos[2];

			if (inputController.terrainWorldSpaceMouse.pressed) {
				editorController.mouseDownAtPoint(
					x, y,
					inputController.terrainWorldSpaceMouse.lastX, inputController.terrainWorldSpaceMouse.lastY,
					deltaTime
				);
			}
			else {
				editorController.mouseDownAtPoint(x, y, x, y, deltaTime);
			}
			inputController.terrainWorldSpaceMouse.lastX = x;
			inputController.terrainWorldSpaceMouse.lastY = y;
			inputController.terrainWorldSpaceMouse.pressed = true;
		}
	}
	else {
		inputController.terrainWorldSpaceMouse.pressed = false;
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
