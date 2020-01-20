import Decorations from "./Decorations";
import { downloadBlob } from "./HelperFunctions";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import Layers, { SerializedLayers } from "./Renderer/Terrain/Layers";

interface SaveData {
	layers: SerializedLayers,
	trees: ArrayLike<number>,
	heightmap: string,
	layerWeightmaps: string[],
}

export function save(heightmapController: HeightmapController, layers: Layers) {
	var data = {} as SaveData;

	data.layers = layers.serialize();

	data.trees = Decorations.serializeTrees();

	data.heightmap = float32ArrayToBase64(heightmapController.getHeightMapData());

	data.layerWeightmaps = heightmapController.getLayerWeightData().map(float32ArrayToBase64);

	const jsondata = JSON.stringify(data);
	downloadBlob("terrain.json", new Blob([jsondata]));
}

export function load(file: File, heightmapController: HeightmapController, layers: Layers) {
	const reader = new FileReader();

	reader.onload = (event) => {
		if (!event.target) { return; }
		const text = event.target.result as string;
		const data = JSON.parse(text) as SaveData;

		const heightmapData = base64ToFloat32Array(data.heightmap);
		const layerWeightData = data.layerWeightmaps.map(base64ToFloat32Array) as [Float32Array, Float32Array];

		heightmapController.setHeightMapData(heightmapData);
		heightmapController.setLayerWeightData(layerWeightData);

		Decorations.deserializeTrees(data.trees);

		layers.deserialize(data.layers);
	};
	reader.onerror = (error) => {
		console.error(error);
		reader.abort();
	};
	reader.readAsText(file);
}

function float32ArrayToBase64(array: Float32Array) {
	// Quelle: https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
	let binary = "";
	let bytes = new Uint8Array(array.buffer);
	let len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

function base64ToFloat32Array(base64: string) {
	let binaryString = window.atob(base64);
	let len = binaryString.length;
	let bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return new Float32Array(bytes.buffer);
}
