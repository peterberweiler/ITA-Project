import { EventEmitter } from "events";
import Decorations from "./Decorations";
import HeightmapController from "./Renderer/Terrain/HeightmapController";
import { HeightBrushPass } from "./Renderer/Terrain/Passes/HeightBrushPass";

interface Brush {
	radius: number,
	strength: number,
}

interface TypedBrush extends Brush {
	type: number,
}

interface HeightBrush extends TypedBrush {
	direction: number,
}

interface LayerBrush extends TypedBrush {
	minSlope: number,
	maxSlope: number,
}

interface DecorationBrush extends Brush {
	remove: boolean,
	accumulator: number,
}

declare interface UIController {
	on(event: "height-changed", listener: () => void): this;
}

export default class EditorController extends EventEmitter {
	private heightmapController: HeightmapController

	public brush = {
		height: {
			radius: 100,
			strength: 50, //1-100
			direction: 1,
			type: 0,
		} as HeightBrush,
		flatten: {
			radius: 100,
			strength: 50, //1-100
			type: 0
		} as TypedBrush,
		layer: {
			radius: 15,
			strength: 50, //1-100
			type: 0,
			minSlope: 0, //0-1
			maxSlope: 1, //0-1
		} as LayerBrush,
		decoration: {
			radius: 100,
			strength: 50,
			remove: false,
			accumulator: 0,
		} as DecorationBrush,
		erosion: {
			radius: 100,
			strength: 50, //1-100
		} as Brush,
	}

	selectedBrush: Brush | null = this.brush.height;

	constructor(heightmapController: HeightmapController) {
		super();
		this.heightmapController = heightmapController;
	}

	/**
	 *
	 * @param x [0, 1]
	 * @param y [0, 1]
	 * @param lastX [0, 1]
	 * @param lastY [0, 1]
	 * @param deltaTime in seconds
	 */
	mouseDownAtPoint(x: number, y: number, lastX: number, lastY: number, deltaTime: number) {
		switch (this.selectedBrush) {
			case this.brush.height: {
				this.heightmapController.heightBrushPass.queueData({
					points: [x, y, lastX, lastY],
					type: HeightBrushPass.NORMAL + this.brush.height.type,
					radius: this.brush.height.radius,
					strength: this.brush.height.strength * this.brush.height.direction * deltaTime * 0.001,
					water: false,
				});

				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				this.emit("height-changed");
				break;
			}

			case this.brush.flatten: {
				this.heightmapController.heightBrushPass.queueData({
					points: [x, y, lastX, lastY],
					type: HeightBrushPass.FLATTEN + this.brush.flatten.type,
					radius: this.brush.flatten.radius,
					strength: this.brush.flatten.strength * deltaTime * 0.001,
					water: false,
				});

				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				this.emit("height-changed");
				break;
			}

			case this.brush.layer: {
				const value = (this.selectedBrush.strength - 1) / 99;

				const minSlope = Math.min(this.brush.layer.minSlope, this.brush.layer.maxSlope);
				const maxSlope = Math.max(this.brush.layer.minSlope, this.brush.layer.maxSlope);

				this.heightmapController.layerBrushPass.queueData({
					points: [x, y, lastX, lastY],
					type: this.brush.layer.type,
					radius: this.brush.layer.radius,
					value: value,
					strength: deltaTime * 0.01,
					minSlope,
					maxSlope,
				});

				this.heightmapController.queuePass(this.heightmapController.layerBrushPass);
				break;
			}

			case this.brush.decoration: {
				const area = Math.max(1500, this.brush.decoration.radius * this.brush.decoration.radius * Math.PI);
				this.brush.decoration.accumulator += 0.000000048 * deltaTime * this.brush.decoration.strength * area;

				const count = Math.floor(this.brush.decoration.accumulator);
				if (count >= 1) {
					this.brush.decoration.accumulator -= count;

					if (this.brush.decoration.remove) {
						Decorations.removeTrees(count, [x, y], this.brush.decoration.radius);
					}
					else {
						Decorations.addTrees(count, [x, y], this.brush.decoration.radius, 4);
					}
				}
				break;
			}

			case this.brush.erosion: {
				this.heightmapController.heightBrushPass.queueData({
					points: [x, y, lastX, lastY],
					type: HeightBrushPass.NORMAL + 1,
					radius: this.brush.erosion.radius,
					strength: this.brush.erosion.strength * deltaTime * 0.002,
					water: true,
				});
				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				break;
			}
		}
	}

	setRadius(value: number) {
		this.setValueForAllBrushes("radius", value);
	}

	setStrength(value: number) {
		this.setValueForAllBrushes("strength", value);
	}

	setValueForAllBrushes(name: string, value: number) {
		if (this.selectedBrush && name in this.selectedBrush) {
			//@ts-ignore
			this.selectedBrush[name] = value;
		}
	}
}
