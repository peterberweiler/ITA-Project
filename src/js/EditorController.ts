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
		this.heightmapController.heightBrushPass.addPoint(Math.random(), Math.random(), HeightBrushPass.NORMAL, 0.05, 1500);
		this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
		this.updateShadows();
	}

	mouseDownAtPoint(x: number, y: number, deltaTime: number) {
		switch (this.selectedBrush) {
			case this.brush.height: {
				this.heightmapController.heightBrushPass.addPoint(x, y, HeightBrushPass.NORMAL,
					this.brush.height.radius,
					this.brush.height.strength * this.brush.height.direction * deltaTime * 0.001
				);
				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				break;
			}

			case this.brush.flatten: {
				this.heightmapController.heightBrushPass.addPoint(x, y, HeightBrushPass.FLATTEN,
					this.brush.flatten.radius,
					this.brush.flatten.strength * deltaTime * 0.001
				);
				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
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
		if ("radius" in this.selectedBrush) {
			this.selectedBrush.radius = value;
		}
	}

	setStrength(value: number) {
		if ("strength" in this.selectedBrush) {
			this.selectedBrush.strength = value;
		}
	}
}
