import EditorController from "./EditorController";
import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import UI from "./UI/UI";

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
	heightmapController.queuePass(heightmapController.generateSurfacePass);
	editorController.updateShadows();

	requestAnimationFrame(main);
}

function setupUI() {
	UI.on("toggle-camera", () => inputController.toggleFpsMode());

	UI.on("debug1", () => editorController.invertHeightmap());
	UI.on("debug2", () => editorController.randomHeightChange());

	UI.on("debug3", () => {
		heightmapController.queuePass(heightmapController.generateSurfacePass);
	});
	UI.on("debug4", () => renderer.getTerrain().surface.loadDefault());
	UI.on("debug5", () => heightmapController.textures.heightMap.current().updateFloatRedData([1024, 1024], new Float32Array(1024 * 1024)));

	UI.on("radius-changed", (value) => editorController.setRadius(value));
	UI.on("strength-changed", (value) => editorController.setStrength(value));

	UI.on("min-slope-changed", (value) => editorController.setValueForAllBrushes("minSlope", value));
	UI.on("max-slope-changed", (value) => editorController.setValueForAllBrushes("maxSlope", value));

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

			case 3: // Layer Brush
				editorController.selectedBrush = editorController.brush.layer;
				break;

			case 4: // Layers
			case 5: // Settings
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
			if ("minSlope" in editorController.selectedBrush) {
				console.log(editorController.selectedBrush);
				UI.minSlopeInput.value = editorController.selectedBrush.minSlope.toString();
			}
			if ("maxSlope" in editorController.selectedBrush) {
				UI.maxSlopeInput.value = editorController.selectedBrush.maxSlope.toString();
			}
		}
	});

	UI.on("layer-type-selected", (index: number) => {
		editorController.brush.layer.type = index;
	});

	UI.on("brush-type-selected", (index: number) => {
		editorController.brush.height.type = index;
	});

	UI.selectMenuIndex(0);
	UI.on("sun-changed", (pitch: number, yaw: number) => {
		pitch *= Math.PI * 2;
		yaw *= Math.PI * 2;
		const dir: [number, number, number] = [
			Math.cos(yaw) * Math.cos(pitch),
			Math.sin(yaw) * Math.cos(pitch),
			Math.sin(pitch),
		];

		renderer.sunDir = dir;
		heightmapController.shadowPass.lightDir = dir;
		editorController.updateShadows();
	});
}

function update(now: number, deltaTime: number) {
	inputController.update(now, deltaTime);

	renderer.setCanvasMouseState(inputController.mouse.over, inputController.mouse.lastX, inputController.mouse.lastY);

	//TODO: move this into inputcontroller

	if (inputController.mouse.buttonDown && inputController.mouse.lastButton === 0 && inputController.mouse.over) {
		const worldSpacePos = renderer.getTerrain().getMouseWorldSpacePos();
		if (worldSpacePos[0] || worldSpacePos[1] || worldSpacePos[2]) {
			let x = worldSpacePos[0];
			let y = worldSpacePos[2];

			// only update 3d mouse if 2d mouse moved
			if (inputController.terrainWorldSpaceMouse.lastCanvasMouseX !== inputController.mouse.lastX ||
				inputController.terrainWorldSpaceMouse.lastCanvasMouseY !== inputController.mouse.lastY) {
				x = worldSpacePos[0];
				y = worldSpacePos[2];
				inputController.terrainWorldSpaceMouse.lastCanvasMouseX = inputController.mouse.lastX;
				inputController.terrainWorldSpaceMouse.lastCanvasMouseY = inputController.mouse.lastY;
			}
			else {
				x = inputController.terrainWorldSpaceMouse.lastX;
				y = inputController.terrainWorldSpaceMouse.lastY;
			}

			// apply mouse down
			if (!inputController.terrainWorldSpaceMouse.pressed) {
				inputController.terrainWorldSpaceMouse.lastX = x;
				inputController.terrainWorldSpaceMouse.lastY = y;
				inputController.terrainWorldSpaceMouse.pressed = true;
			}

			editorController.mouseDownAtPoint(
				x, y,
				inputController.terrainWorldSpaceMouse.lastX, inputController.terrainWorldSpaceMouse.lastY,
				deltaTime
			);
			inputController.terrainWorldSpaceMouse.lastX = x;
			inputController.terrainWorldSpaceMouse.lastY = y;
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
