import HeightmapController from "./Renderer/Terrain/HeightmapController";
import { HeightBrushPass } from "./Renderer/Terrain/Passes";

export default class EditorController {
	private heightmapController: HeightmapController

	public brush = {
		height: {
			radius: 100,
			strength: 50,
			direction: 1,
		},
		flatten: {
			radius: 100,
			strength: 50,
		},
		layer: {
			radius: 15,
			strength: 50,
			type: 0,
			minSlope: -0.1,
			maxSlope: 1.1,
		}
	}

	selectedBrush: any = this.brush.height;

	constructor(heightmapController: HeightmapController) {
		this.heightmapController = heightmapController;
	}

	invertHeightmap() {
		this.heightmapController.queuePass(this.heightmapController.invertPass);
		this.updateShadows();
	}

	randomHeightChange() {
		this.heightmapController.heightBrushPass.queueData({
			points: [...Array(20)].map(() => Math.random() * 1024),
			type: HeightBrushPass.FLATTEN,
			radius: 50,
			strength: 8,
		});

		this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
		this.updateShadows();
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
					type: HeightBrushPass.NORMAL,
					radius: this.brush.height.radius,
					strength: this.brush.height.strength * this.brush.height.direction * deltaTime * 0.001,
				});

				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				break;
			}

			case this.brush.flatten: {
				this.heightmapController.heightBrushPass.queueData({
					points: [x, y, lastX, lastY],
					type: HeightBrushPass.FLATTEN,
					radius: this.brush.flatten.radius,
					strength: this.brush.flatten.strength * deltaTime * 0.001,
				});

				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				break;
			}

			case this.brush.layer: {
				this.heightmapController.layerBrushPass.queueData({
					points: [x, y, lastX, lastY],
					type: this.selectedBrush.type,
					radius: this.selectedBrush.radius,
					strength: this.selectedBrush.strength * deltaTime * 0.001,
					minSlope: this.selectedBrush.minSlope,
					maxSlope: this.selectedBrush.maxSlope,
				});

				this.heightmapController.queuePass(this.heightmapController.layerBrushPass);
				break;
			}

			default:
				return;
		}
		this.updateShadows();
	}

	updateShadows() {
		this.heightmapController.queuePass(this.heightmapController.shadowPass);
	}

	setRadius(value: number) {
		this.setValueForAllBrushes("radius", value);
	}

	setStrength(value: number) {
		this.setValueForAllBrushes("strength", value);
	}

	setValueForAllBrushes(name: string, value: number) {
		if (name in this.selectedBrush) {
			this.selectedBrush[name] = value;
		}
	}
}
