//@ts-ignore
import Decorations from "./Decorations";
import EditorController from "./EditorController";
import * as HelperFunctions from "./HelperFunctions";
import InputController from "./Renderer/InputController";
//import Renderer from "./Renderer/Renderer";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import Layers from "./Renderer/Terrain/Layers";

const SIZE: [number, number] = [1024, 1024];

export function save(heightmapController: HeightmapController, inputController: InputController, editorController: EditorController, layers: Layers/*, renderer: Renderer*/) {
	/**
	 * Data to save:
	 * 		- Layers
	 * 		- Trees
	 * 		- Heightmap: Heightmapdata und Layerweightdata
	 */
	var data = {
		/*
		'sundirection': [] as any,
		'debugmode': false,
		'fpsmode': false,
		brush: [] as any,
		*/
		layers: [] as any,
		trees: [] as any,
		heightmap: { heightmapdata: "", Layerweightdata: { data0: "", data1: "" } }
	};

	/*
	data.sundirection.push(renderer.sunDir);

	//data.table.push({ id: 1, square: 2 });
	data.debugmode = Settings.getDebugMode();

	data.fpsmode = inputController.isFpsMode();

	data.brush = editorController.brush;
	*/

	data.layers = layers;

	const trees = Decorations.getTrees();
	trees.forEach((tree) => {
		data.trees.push(tree);
	});

	//data.heightmap = base64ArrayBuffer(heightmapController.getHeightMapData());
	data.heightmap.heightmapdata = _arrayBufferToBase64(heightmapController.getHeightMapData());

	let [data0, data1] = heightmapController.getLayerWeightData();
	data.heightmap.Layerweightdata.data0 = _arrayBufferToBase64(data0);
	data.heightmap.Layerweightdata.data1 = _arrayBufferToBase64(data1);

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
	};
	reader.readAsText(selectedFile);

	const data = JSON.parse(<string>(<unknown>text));
	console.log(data);

	let decodedheightmapdata = _base64ToArrayBuffer(data.heightmap.heightmapdata);
	data.heightmap.heightmapdata = decodedheightmapdata;

	let decodeddata0 = _base64ToArrayBuffer(data.heightmapdata.Layerweightdata.data0);
	let decodeddata1 = _base64ToArrayBuffer(data.heightmapdata.Layerweightdata.data1);
	data.heightmapdata.Layerweightdata.data0 = decodeddata0;
	data.heightmapdata.Layerweightdata.data1 = decodeddata1;

	return data;
}

function _arrayBufferToBase64(buffer: Float32Array) {
	// Quelle: https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
	var binary = "";
	var bytes = new Uint8Array(buffer.buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

function _base64ToArrayBuffer(base64: string) {
	var binaryString = window.atob(base64);
	var len = binaryString.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
}
