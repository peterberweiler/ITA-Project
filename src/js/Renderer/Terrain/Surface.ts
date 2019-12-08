import Texture from "../Texture";

class ImageTexturePair {
	image: HTMLImageElement
	texture: Texture
	loaded = false;

	constructor() {
		this.texture = new Texture();
		this.texture.updateRGBAData([1, 1], null);

		this.image = new Image();
		this.image.onload = this.onImageLoaded.bind(this);
	}

	onImageLoaded() {
		setTimeout(() => {
			console.time(this.image.src);
			this.texture.updateRGBDataWithImage(this.image);
			this.loaded = true;
			console.timeEnd(this.image.src);
		}, Math.random() * 1000);
	}

	setImageSource(src: string) {
		this.image.src = src;
	}
}

export class SurfaceType {
	albedomap = new ImageTexturePair();
	oamap = new ImageTexturePair();
	heightmap = new ImageTexturePair();
	normalmap = new ImageTexturePair();
	roughnessmap = new ImageTexturePair();

	constructor() {
		//
	}
}

export default class Surface {
	types: SurfaceType[] = [];

	constructor() {
		for (let i = 0; i < 16; ++i) {
			this.types[i] = new SurfaceType();
		}
	}

	loadDefault() {
		this.types[0].albedomap.setImageSource("/data/grass1/grass1-albedo.png");
		this.types[0].oamap.setImageSource("/data/grass1/grass1-ao.png");
		this.types[0].heightmap.setImageSource("/data/grass1/grass1-height.png");
		this.types[0].normalmap.setImageSource("/data/grass1/grass1-normal.png");
		this.types[0].roughnessmap.setImageSource("/data/grass1/grass1-roughness.png");

		this.types[1].albedomap.setImageSource("/data/rockface1/rockface1_albedo.png");
		this.types[1].oamap.setImageSource("/data/rockface1/rockface1_ao.png");
		this.types[1].heightmap.setImageSource("/data/rockface1/rockface1_height.png");
		this.types[1].normalmap.setImageSource("/data/rockface1/rockface1_normal.png");
		this.types[1].roughnessmap.setImageSource("/data/rockface1/rockface1_roughness.png");
	}
}
