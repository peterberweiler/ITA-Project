//@ts-ignore
// import { PNG } from "pngjs/browser";
import { PNG } from "pngjs";
import * as HelperFunctions from "./HelperFunctions";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import { DownloadPass } from "./Renderer/Terrain/Passes/DownloadPass";
import UI from "./UI/UI";

const SIZE: [number, number] = [1024, 1024];

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

export function downloadOBJ(heightmapController: HeightmapController) {
	UI.setExportFileInfo();
	getHeightMapData(heightmapController, (hmData: Float32Array) => {
		const objSource = createOBJ(hmData);
		HelperFunctions.downloadBlob("terrain.obj", new Blob([objSource]));
	});
}

export function getHeightMapData(heightmapController: HeightmapController, callback: (data: Float32Array) => void) {
	heightmapController.downloadPass.queueDownload({
		textureId: heightmapController.textures.heightMap.current().id,
		mode: DownloadPass.R_FLOAT_MODE,
		callback
	});

	heightmapController.queuePass(heightmapController.downloadPass);
}

export function downloadPNGHeightmap8Bit(heightmapController: HeightmapController) {
	getHeightMapData(heightmapController, (hmData: Float32Array) => {
		const { min, max } = HelperFunctions.arrayMinMax(hmData);

		const buffer = new Uint8Array(SIZE[0] * SIZE[1] * 4);
		for (let i = 0; i < hmData.length; ++i) {
			const height = Math.round((hmData[i] - min) / (max - min) * 255);

			const index = i * 4;
			buffer[index] = height;
			buffer[index + 1] = height;
			buffer[index + 2] = height;
			buffer[index + 3] = 255;
		}

		UI.setExportFileInfo(min, max);
		const result = HelperFunctions.rgbaDataToPNGDataURL(buffer, SIZE);
		HelperFunctions.downloadURI("Heightmap.png", result);
	});
}

export function downloadPNGHeightmap16Bit(heightmapController: HeightmapController) {
	getHeightMapData(heightmapController, (hmData: Float32Array) => {
		const { min, max } = HelperFunctions.arrayMinMax(hmData);
		const bitmap = new Uint16Array(SIZE[0] * SIZE[1]);

		for (let i = 0; i < bitmap.length; ++i) {
			bitmap[i] = Math.round((hmData[i] - min) / (max - min) * 65535);
		}
		UI.setExportFileInfo(min, max);
		downloadGrayscale16BitPNG(bitmap, "heightmap_16bit.png", SIZE);
	});
}

function downloadGrayscale16BitPNG(data: Uint16Array, filename: string, size: [number, number]) {
	const png = new PNG({
		width: size[0],
		height: size[1],
		bitDepth: 16,
		colorType: 0,
		inputColorType: 0,
		inputHasAlpha: false,
	});

	png.data = new Buffer(data.buffer);

	var fileBuffer = PNG.sync.write(png, {
		bitDepth: 16,
		colorType: 0,
		inputColorType: 0,
		inputHasAlpha: false,
	});
	HelperFunctions.downloadBlob(filename, new Blob([fileBuffer]));
}

export function downloadFloatHeightMap(heightmapController: HeightmapController) {
	UI.setExportFileInfo();
	getHeightMapData(heightmapController, (hmData: Float32Array) => {
		HelperFunctions.downloadBlob("Heightmap_Red32F.raw", new Blob([hmData]));
	});
}

