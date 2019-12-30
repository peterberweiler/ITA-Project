export function hide(element: HTMLElement, hide: boolean = true) {
	if (hide) {
		element.setAttribute("hidden", "1");
	}
	else {
		element.removeAttribute("hidden");
	}
}

// color is an array with values between 0-1
export function hex2color(hex: string): number[] {
	const matches = hex.match(/[A-Za-z0-9]{2}/g);
	return matches ? matches.map((v) => parseInt(v, 16) / 255) : [0, 0, 0];
}

// color is an array with values between 0-1
export function color2hex(color: number[]) {
	return "#" + color
		.map((v) => Math.round(v * 255).toString(16).padStart(2, "0"))
		.join("");
}
