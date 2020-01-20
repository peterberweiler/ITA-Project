/* eslint-disable no-mixed-operators */
//
// from https://stackoverflow.com/a/47593316/4981349
//
// combination of xmur3 and sfc32
//
//

export function createRandom(seed: string) {
	for (var i = 0, h = 1779033703 ^ seed.length; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = h << 13 | h >>> 19;
	}
	// return function () {
	h = Math.imul(h ^ h >>> 16, 2246822507);
	h = Math.imul(h ^ h >>> 13, 3266489909);
	let a = (h ^= h >>> 16) >>> 0;

	h = Math.imul(h ^ h >>> 16, 2246822507);
	h = Math.imul(h ^ h >>> 13, 3266489909);
	let b = (h ^= h >>> 16) >>> 0;

	h = Math.imul(h ^ h >>> 16, 2246822507);
	h = Math.imul(h ^ h >>> 13, 3266489909);
	let c = (h ^= h >>> 16) >>> 0;

	h = Math.imul(h ^ h >>> 16, 2246822507);
	h = Math.imul(h ^ h >>> 13, 3266489909);
	let d = (h ^= h >>> 16) >>> 0;

	return () => {
		a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
		let t = (a + b) | 0;
		a = b ^ b >>> 9;
		b = c + (c << 3) | 0;
		c = (c << 21 | c >>> 11);
		d = d + 1 | 0;
		t = t + d | 0;
		c = c + t | 0;
		return (t >>> 0) / 4294967296;
	};
}
