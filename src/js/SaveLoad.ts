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
		brush: [] as any,
		layers: [] as any,
		trees: [] as any,
		heightmap: ""
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

	//data.heightmap = base64ArrayBuffer(heightmapController.getHeightMapData());
	data.heightmap = _arrayBufferToBase64(heightmapController.getHeightMapData());

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

	let heightmapData = _base64ToArrayBuffer(data.heightmap);
	data.heightmap = heightmapData;

	return data;
}

function _arrayBufferToBase64(buffer: Float32Array) {
	// Quelle: https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

function _base64ToArrayBuffer(base64: string) {
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}