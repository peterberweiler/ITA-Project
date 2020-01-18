//@ts-ignore
import Decorations from "./Decorations";
import EditorController from "./EditorController";
import * as HelperFunctions from "./HelperFunctions";
import InputController from "./Renderer/InputController";
import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import Layers from "./Renderer/Terrain/Layers";
import Settings from "./Settings";

const SIZE: [number, number] = [1024, 1024];

export function save(heightmapController: HeightmapController, inputController: InputController, editorController: EditorController, layers: Layers, renderer: Renderer) {
	/**
	 * Data to save:
	 * 		- Settings
	 * 		- Brush: Size and Strength
	 *  	- Layerbrush: Size and Strength
	 * 		- Layers
	 * 		- Trees
	 * 		- Heightmap
	 */
	var data = {
		'sundirection': [] as any,
		'debugmode': false,
		'fpsmode': false,
		brush: [] as any,//{ 'radius': 0, 'strength': 0 },
		layers: [] as any,
		trees: [] as any
	};

	data.sundirection.push(renderer.sunDir);

	//data.table.push({ id: 1, square: 2 });
	data.debugmode = Settings.getDebugMode();

	data.fpsmode = inputController.isFpsMode();

	data.brush = editorController.brush;

	data.layers = layers;

	const trees = Decorations.getTrees();
	trees.forEach((tree) => {
		data.trees.push(tree);
	});

	var jsondata = JSON.stringify(data);

	//navigator.msSaveOrOpenBlob(new Blob([jsondata], { type: "application/json" }), "TerrainEditorSession.json");
	HelperFunctions.downloadBlob("TerrainEditorSave.json", new Blob([jsondata]));
}

export function load() {
	const selectedFile = document.querySelector<HTMLInputElement>("#file-picker")!.files![0];
	var reader = new FileReader();

	let text;

	reader.onload = function (event) {
		text = event.target!.result;
	}
	reader.readAsText(selectedFile);

	const data = JSON.parse(<string>(<unknown>text));
	console.log(data);
	return data;
}

export function createOBJ(hmData: Float32Array) {
	let { indices, vertices } = createFlatMesh(SIZE[0], SIZE[1]);
	let data = [];
	for (let i = 0, m = 0; i < vertices.length; i += 3, m += 1) {
		data.push("\nv", vertices[i] * SIZE[0], hmData[m], vertices[i + 2] * SIZE[1]);
	}
	data.push("\n");
	for (let i = 0; i < indices.length; i += 3) {
		data.push("\nf", indices[i] + 1, indices[i + 1] + 1, indices[i + 2] + 1);
	}
	data.push("\n");
	return data.join(" ");
}

function createFlatMesh(resolutionX: number, resolutionY: number) {
	let vertices = new Float32Array(resolutionX * resolutionY * 3);
	let indices = new Uint32Array(((resolutionX - 1) * (resolutionY - 1) * 6));

	for (let x = 0; x < resolutionX; ++x) {
		for (let z = 0; z < resolutionY; ++z) {
			const vindex = ((z * resolutionX) + x) * 3;

			vertices[vindex] = x / (resolutionX - 1);
			vertices[vindex + 1] = 0;
			vertices[vindex + 2] = z / (resolutionY - 1);
		}
	}

	for (let x = 0; x < resolutionX - 1; ++x) {
		for (let z = 0; z < resolutionY - 1; ++z) {
			const index0 = ((z * resolutionX) + x);
			const index1 = index0 + resolutionX;
			const index2 = index0 + resolutionX + 1;
			const index3 = index0 + 1;

			// 2 triangles
			const iindex = ((z * (resolutionX - 1)) + x) * 6;
			indices[iindex + 0] = index0;
			indices[iindex + 1] = index1;
			indices[iindex + 2] = index2;
			indices[iindex + 3] = index0;
			indices[iindex + 4] = index2;
			indices[iindex + 5] = index3;
		}
	}
	return { vertices, indices };
}