import HeightmapController from "./Renderer/Terrain/HeightmapController";
import { HeightBrushPass } from "./Renderer/Terrain/Passes";

export default class EditorController {
	private heightmapController: HeightmapController

	public brush = {
		height: {
			radius: 0.1,
			strength: 2,
			direction: 1,
		},
		flatten: {
			radius: 0.1,
			strength: 0.04,
		},
	}

	private selectedBrush = this.brush.height;

	constructor(heightmapController: HeightmapController) {
		this.heightmapController = heightmapController;
	}

	invertHeightmap() {
		this.heightmapController.queuePass(this.heightmapController.invertPass);
	}

	randomHeightChange() {
		this.heightmapController.heightBrushPass.addPoint(Math.random(), Math.random(), HeightBrushPass.NORMAL, 0.05, 1500);
		this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
	}

	mouseDownAtPoint(x: number, y: number) {
		switch (this.selectedBrush) {
			case this.brush.height: {
				this.heightmapController.heightBrushPass.addPoint(x, y, HeightBrushPass.NORMAL,
					this.brush.height.radius, this.brush.height.strength * this.brush.height.direction
				);
				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				break;
			}

			case this.brush.flatten: {
				this.heightmapController.heightBrushPass.addPoint(x, y, HeightBrushPass.FLATTEN,
					this.brush.flatten.radius, this.brush.flatten.strength
				);
				this.heightmapController.queuePass(this.heightmapController.heightBrushPass);
				break;
			}
		}
	}

	selectBrush(selectedBrush: any) {
		this.selectedBrush = selectedBrush;
	}
}
