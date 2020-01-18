import Decorations from "./Decorations";
import EditorController from "./EditorController";
import * as ImportExport from "./ImportExport";
import { Camera } from "./Renderer/Cameras";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import Layers from "./Renderer/Terrain/Layers";
import Terrain from "./Renderer/Terrain/Terrain";
import * as SaveLoad from "./SaveLoad";
import Settings from "./Settings";
import UI from "./UI/UI";

let renderer: Renderer;
let camera: Camera;
let inputController: InputController;
let heightmapController: HeightmapController;
let editorController: EditorController;
let layers: Layers;
let terrain: Terrain;
let decorationUpdateFrameCounter = 0;

function setupRenderer() {
	camera = new Camera(
		[512, 768, -768],
		[-30, 180, 0],
		16 / 9,
		(45 / 180) * Math.PI,
		0.1,
		10000,
	);

	const isFpsCameraMode = Settings.getCameraMode();
	const canvas = document.getElementById("canvas") as HTMLCanvasElement;
	inputController = new InputController(camera, canvas);
	inputController.setFpsMode(isFpsCameraMode);
	UI.wheelEnabled = isFpsCameraMode;
	renderer = new Renderer(canvas, camera);
	terrain = renderer.getTerrain();
	heightmapController = renderer.getHeightmapRenderer();
	layers = heightmapController.textures.layers;

	editorController = new EditorController(heightmapController);
	window.onresize = () => {
		renderer.resized();
		UI.updateBrushWindowSizeAndPos();
	};

	renderer.resized();

	// dummy heightmap
	heightmapController.queuePass(heightmapController.perlinPass);
	heightmapController.queuePass(heightmapController.generateSurfacePass);

	requestAnimationFrame(main);
}

function setupUI() {
	UI.on("debug0", () => {
		const fpsMode = !inputController.isFpsMode();
		inputController.setFpsMode(fpsMode);
		UI.wheelEnabled = fpsMode;
	});

	// UI.on("debug1", () => {});
	// UI.on("debug2", () => {});

	UI.on("debug3", () => {
		heightmapController.queuePass(heightmapController.generateSurfacePass);
	});
	// UI.on("debug4", () => renderer.getTerrain().surface.loadDefault());
	UI.on("debug5", () => heightmapController.textures.heightMap.current().updateFloatRedData([1024, 1024], new Float32Array(1024 * 1024)));

	UI.on("radius-changed", (value) => editorController.setRadius(value));
	UI.on("strength-changed", (value) => editorController.setStrength(value));

	UI.on("min-slope-changed", (value) => editorController.setValueForAllBrushes("minSlope", value));
	UI.on("max-slope-changed", (value) => editorController.setValueForAllBrushes("maxSlope", value));

	UI.on("menu-selected", (route) => {
		switch (route) {
			case "increase-brush": // height brush
				editorController.selectedBrush = editorController.brush.height;
				editorController.brush.height.direction = 1;
				break;

			case "decrease-brush": // height brush
				editorController.selectedBrush = editorController.brush.height;
				editorController.brush.height.direction = -1;
				break;

			case "flatten-brush": // flatten brush
				editorController.selectedBrush = editorController.brush.flatten;
				break;

			case "layer-brush": // Layer Brush
				editorController.selectedBrush = editorController.brush.layer;
				break;

			case "decoration-brush": // Layer Brush
				editorController.selectedBrush = editorController.brush.decoration;
				break;

			case "layers": // Layers
			case "settings": // Settings
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
				//@ts-ignore
				UI.minSlopeInput.value = editorController.selectedBrush.minSlope.toString();
			}
			if ("maxSlope" in editorController.selectedBrush) {
				//@ts-ignore
				UI.maxSlopeInput.value = editorController.selectedBrush.maxSlope.toString();
			}
		}
	});

	UI.on("layer-type-selected", (index: number) => {
		editorController.brush.layer.type = layers.layerOrder[index];
	});

	UI.on("brush-type-selected", (index: number) => {
		editorController.brush.height.type = index;
	});

	UI.on("flatten-brush-type-changed", (type: number) => {
		editorController.brush.flatten.type = type;
	});

	UI.on("decoration-brush-type-changed", (type: number) => {
		editorController.brush.decoration.remove = type !== 0;
	});

	UI.on("layer-order-changed", (order: number[]) => {
		layers.layerOrder = order;
		UI.updateLayerBrushTypeSelector(layers);
	});

	UI.on("layer-changed", (id, color, roughness, active) => {
		const material = layers.getLayerMaterial(id);
		material.setColor(color);
		material.setRoughness(roughness);
		layers.setLayerActive(id, active);

		UI.updateLayerBrushTypeSelector(layers);
	});

	UI.on("sun-changed", (pitch: number, yaw: number) => {
		pitch *= Math.PI * 0.5;
		pitch += Math.PI * 0.5;
		pitch = Math.PI - pitch;

		yaw *= Math.PI * 2;
		yaw = (2 * Math.PI) - yaw;
		const dir: [number, number, number] = [
			Math.sin(pitch) * Math.sin(yaw),
			Math.cos(pitch),
			Math.sin(pitch) * Math.cos(yaw),
		];

		renderer.sunDir = dir;
		terrain.shadowsNeedUpdate = true;
	});

	UI.on("camera-mode-changed", (fpsMode: boolean) => {
		inputController.setFpsMode(fpsMode);
		UI.wheelEnabled = fpsMode;
	});

	UI.on("export", mode => {
		switch (mode) {
			case 0:
				ImportExport.downloadPNGHeightmap8Bit(heightmapController);
				break;
			case 1:
				ImportExport.downloadPNGHeightmap16Bit(heightmapController);
				break;
			case 2:
				ImportExport.downloadFloatHeightMap(heightmapController);
				break;
			case 3:
				ImportExport.downloadOBJ(heightmapController);
				break;
			case 4:
				ImportExport.downloadPNGLayers8Bit(heightmapController);
				break;
			case 5:
				ImportExport.downloadPNGLayers16Bit(heightmapController);
				break;
		}
	});

	UI.on("save", () => {
		SaveLoad.save(heightmapController, inputController, editorController, layers, renderer);
	});

	UI.on("load", () => {
		const loadedData = SaveLoad.load();
		renderer.sunDir = loadedData.sunDir;
	});

	UI.setupLayerList(layers);

	UI.updateLayerBrushTypeSelector(layers);
	UI.selectMenuIndex(0);

	editorController.on("height-changed", () => {
		terrain.shadowsNeedUpdate = true;
	});
}

function update(now: number, deltaTime: number) {
	inputController.update(now, deltaTime);

	renderer.setCanvasMouseState(
		inputController.mouse.canvas.over,
		inputController.mouse.canvas.current[0],
		inputController.mouse.canvas.current[1],
		inputController.mouse.terrain.current[0],
		inputController.mouse.terrain.current[1],
		editorController.selectedBrush ? editorController.selectedBrush.radius || 0 : 0,
	);

	inputController.setTerrainMousePos(terrain.getMouseWorldSpacePos());

	if (inputController.mouse.buttonDown && inputController.mouse.button === 0 && inputController.mouse.terrain.over) {
		// left button down
		editorController.mouseDownAtPoint(
			inputController.mouse.terrain.current[0],
			inputController.mouse.terrain.current[1],
			inputController.mouse.terrain.last[0],
			inputController.mouse.terrain.last[1],
			deltaTime
		);
	}

	if (Decorations.hasChange()) {
		++decorationUpdateFrameCounter;
		if (decorationUpdateFrameCounter >= 5) { // update decoration data only every fifth frame
			decorationUpdateFrameCounter = 0;

			const trees = Decorations.getTrees();
			const data = new Float32Array(trees.length * 2);
			for (let i = 0, j = 0; i < trees.length; ++i, j += 2) {
				data[j] = trees[i][0];
				data[j + 1] = trees[i][1];
			}
			terrain.decorationObjects.updateTreePositions(data);

			Decorations.clearChange();
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
