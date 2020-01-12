//@ts-ignore
// import { PNG } from "pngjs/browser";
import { PNG } from "pngjs";
import * as HelperFunctions from "./HelperFunctions";
import Framebuffer from "./Renderer/Framebuffer";
import { gl } from "./Renderer/Global";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
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
	const data = getHeightMapData(heightmapController);
	const objSource = createOBJ(data);
	HelperFunctions.downloadBlob("terrain.obj", new Blob([objSource]));
}

export function getLayerWeightData(heightmapController: HeightmapController) {
	const fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.viewport(0, 0, SIZE[0], SIZE[1]);

	const data = [
		new Float32Array(SIZE[0] * SIZE[1] * 4),
		new Float32Array(SIZE[0] * SIZE[1] * 4)
	];
	gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, heightmapController.textures.layers.weightMapCurrent, 0, 0);
	gl.readPixels(0, 0, SIZE[0], SIZE[1], gl.RGBA, gl.FLOAT, data[0]);

	gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, heightmapController.textures.layers.weightMapCurrent, 0, 1);
	gl.readPixels(0, 0, SIZE[0], SIZE[1], gl.RGBA, gl.FLOAT, data[1]);

	gl.deleteFramebuffer(fb);
	Framebuffer.unbind();
	return data;
}

export function getHeightMapData(heightmapController: HeightmapController) {
	const fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.viewport(0, 0, SIZE[0], SIZE[1]);

	const data = new Float32Array(SIZE[0] * SIZE[1]);
	const texId = heightmapController.textures.heightMap.current().id;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texId, 0);
	gl.readPixels(0, 0, SIZE[0], SIZE[1], gl.RED, gl.FLOAT, data);

	gl.deleteFramebuffer(fb);
	Framebuffer.unbind();
	return data;
}

export function downloadPNGHeightmap8Bit(heightmapController: HeightmapController) {
	const hmData = getHeightMapData(heightmapController);
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
}

export function downloadPNGHeightmap16Bit(heightmapController: HeightmapController) {
	const hmData = getHeightMapData(heightmapController);
	const { min, max } = HelperFunctions.arrayMinMax(hmData);
	const bitmap = new Uint16Array(SIZE[0] * SIZE[1]);

	for (let i = 0; i < bitmap.length; ++i) {
		bitmap[i] = Math.round((hmData[i] - min) / (max - min) * 65535);
	}
	UI.setExportFileInfo(min, max);
	downloadGrayscale16BitPNG(bitmap, "heightmap_16bit.png", SIZE);
}

export function downloadPNGLayers8Bit(heightmapController: HeightmapController) {
	UI.setExportFileInfo();
	const data = getLayerWeightData(heightmapController);
	const buffer = new Uint8Array(SIZE[0] * SIZE[1] * 4);

	for (let layerId = 0; layerId < 8; ++layerId) {
		if (heightmapController.textures.layers.getLayerActive(layerId)) {
			const layerData = data[Math.floor(layerId / 4)];
			const layerDataOffset = layerId % 4;

			for (let i = 0; i < buffer.length; i += 4) {
				const value = Math.round(layerData[layerDataOffset + i] * 255);

				buffer[i] = value;
				buffer[i + 1] = value;
				buffer[i + 2] = value;
				buffer[i + 3] = 255;
			}
			const result = HelperFunctions.rgbaDataToPNGDataURL(buffer, SIZE);

			setTimeout(() => {
				HelperFunctions.downloadURI("layer" + layerId + ".png", result);
			}, layerId * 200);
		}
	}
}

export function downloadPNGLayers16Bit(heightmapController: HeightmapController) {
	UI.setExportFileInfo();
	const data = getLayerWeightData(heightmapController);

	for (let layerId = 0; layerId < 8; ++layerId) {
		if (heightmapController.textures.layers.getLayerActive(layerId)) {
			const layerData = data[Math.floor(layerId / 4)];
			const layerDataOffset = layerId % 4;

			const bitmap = new Uint16Array(SIZE[0] * SIZE[1]);
			for (let i = 0; i < bitmap.length; ++i) {
				bitmap[i] = Math.round(layerData[layerDataOffset + (i * 4)] * 65535);
			}

			setTimeout(() => {
				downloadGrayscale16BitPNG(bitmap, "layer" + layerId + "_16bit.png", SIZE);
			}, layerId * 200);
		}
	}
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
	const data = getHeightMapData(heightmapController);
	HelperFunctions.downloadBlob("Heightmap_Red32F.raw", new Blob([data]));
}

