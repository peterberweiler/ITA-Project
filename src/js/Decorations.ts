import { vec2 } from "gl-matrix";

export type Decoration = [number, number];

const SIZE = [1024, 1024];

class DecorationsController {
	private trees: Decoration[] = [];
	private changed = false;

	constructor() {
		//
	}

	/** in worldspace units */
	addTrees(count: number, pos: [number, number], radius: number, minDistToOtherTrees: number) {
		// try multiple times with different random positions
		for (let i = 0; i < 16 * count; ++i) {
			const dir = [0, radius * Math.random()];
			const newPos: [number, number] = [0, 0];
			//@ts-ignore
			vec2.rotate(newPos, dir, [0, 0], Math.random() * Math.PI * 2);

			newPos[0] += pos[0];
			newPos[1] += pos[1];

			if (this.checkPosition(newPos, minDistToOtherTrees)) {
				this.trees.push(newPos);
				this.changed = true;

				if (--count <= 0) {
					return;
				}
			}
		}
	}

	private checkPosition(pos: [number, number], minDistToOtherTrees: number) {
		if (pos[0] < 0 || pos[0] > SIZE[0] || pos[1] < 0 || pos[1] > SIZE[1]) {
			return false;
		}

		for (let tree of this.trees) {
			if (vec2.dist(pos, tree) < minDistToOtherTrees) {
				return false;
			}
		}
		return true;
	}

	removeTrees(count: number, pos: [number, number], radius: number) {
		// remove the trees that were added last
		for (let i = this.trees.length - 1; i >= 0; --i) {
			const dist = vec2.dist(pos, this.trees[i]);
			if (dist <= radius) {
				this.trees.splice(i, 1);
				this.changed = true;

				if (--count <= 0) {
					return;
				}
			}
		}
	}

	hasChange() {
		return this.changed;
	}

	clearChange() {
		this.changed = false;
	}

	getTrees() {
		return this.trees;
	}

	setTrees(trees: Decoration[]) {
		this.trees = trees;
		this.changed = true;
	}
}

const Decorations = new DecorationsController();
export default Decorations;
