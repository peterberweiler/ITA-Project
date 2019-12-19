// generates brush tileset and brush thumbnails

const { createCanvas, loadImage } = require("C:/npm/node_modules/canvas");
const PNG = require("C:/npm/node_modules/pngjs").PNG;

const fs = require("fs");
const tileSetSize = 1024;
const thumbSize = 64;

const BRUSH_DIR = "src/brushes/";
const OUT_DIR = "src/data/brushes/";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function createTileSet() {
	const canvas = createCanvas(tileSetSize, tileSetSize);
	const ctx = canvas.getContext("2d");

	// ctx.globalCompositeOperation = "multiply";

	ctx.clearRect(0, 0, tileSetSize, tileSetSize);

	const dataLength = tileSetSize * tileSetSize * 4;

	const tileSetPNG = new PNG({
		width: tileSetSize,
		height: tileSetSize
	});
	const tileSetData = tileSetPNG.data;

	for (let layer = 0; layer < 4; ++layer) {
		ctx.clearRect(0, 0, tileSetSize, tileSetSize);

		for (let i = 0; i < 4; ++i) {
			const brushIndex = (layer * 4) + i;
			try {
				const image = await loadImage(BRUSH_DIR + brushIndex + ".png");
				const posX = i % 2;
				const posY = Math.floor(i / 2);
				ctx.drawImage(image, posX * 512, posY * 512, 512, 512);
			}
			catch (error) {
				console.error("couldn't load brush " + brushIndex);
			}
		}
		const imageData = ctx.getImageData(0, 0, tileSetSize, tileSetSize);
		const data = imageData.data;

		for (let x = 0; x < dataLength; x += 4) {
			tileSetData[x + layer] = data[x];
		}
	}

	tileSetPNG.pack().pipe(fs.createWriteStream(OUT_DIR + "brushes.png"));
	console.log("saved tileset");
}

async function createThumbs() {
	const canvas = createCanvas(thumbSize, thumbSize);
	const ctx = canvas.getContext("2d");
	for (let i = 0; i < 16; ++i) {
		try {
			const image = await loadImage(BRUSH_DIR + i + ".png");
			ctx.clearRect(0, 0, thumbSize, thumbSize);
			ctx.drawImage(image, 0, 0, thumbSize, thumbSize);

			const imageData = ctx.getImageData(0, 0, thumbSize, thumbSize);
			const data = imageData.data;
			const dataLength = thumbSize * thumbSize * 4;
			for (let i = 0; i < dataLength; i += 4) {
				// alpha = red
				data[i + 3] = data[i + 0];
				// make color white
				data[i + 0] = 255;
				data[i + 1] = 255;
				data[i + 2] = 255;
			}
			ctx.putImageData(imageData, 0, 0);
			fs.writeFileSync(OUT_DIR + "thumb" + i + ".png", canvas.toBuffer("image/png"));
			console.log("saved thumb for " + i);
		}
		catch (error) {
			console.error("couldn't load brush " + i);
		}
	}
}

async function main() {
	await createTileSet();
	await createThumbs();
}

main();
