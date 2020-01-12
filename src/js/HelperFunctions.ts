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

export function rgbaDataToPNGDataURL(dataBuffer: Uint8Array, size: [number, number]) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	canvas.width = size[0];
	canvas.height = size[1];

	let imgData = ctx.createImageData(size[0], size[1]);
	imgData.data.set(dataBuffer);

	ctx.putImageData(imgData, 0, 0);

	const result = canvas.toDataURL();

	canvas.width = canvas.height = 1;
	return result;
}

export function openInNewTab(url: string) {
	const a = document.createElement("a");
	a.style.display = "none";
	a.target = "_blank";
	a.href = url;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

export function downloadBlob(filename: string, blob: Blob) {
	if (navigator.msSaveOrOpenBlob) {
		navigator.msSaveOrOpenBlob(blob, filename);
	}
	else {
		const a = document.createElement("a");
		a.download = filename;
		a.style.display = "none";
		document.body.appendChild(a);
		const url = URL.createObjectURL(blob);
		a.href = url;
		a.onclick = () => requestAnimationFrame(() => URL.revokeObjectURL(url));
		a.click();
		document.body.removeChild(a);
	}
}

export function uriToBlob(uri: string) {
	const byteString = window.atob(uri.split(",")[1]);
	const mimeString = uri.split(",")[0].split(":")[1].split(";")[0];
	const buffer = new ArrayBuffer(byteString.length);
	const intArray = new Uint8Array(buffer);
	for (let i = 0; i < byteString.length; i++) {
		intArray[i] = byteString.charCodeAt(i);
	}
	return new Blob([buffer], { type: mimeString });
}

/**
 * @param {string} filename
 * @param {string} uri
 */
export function downloadURI(filename: string, uri: string) {
	if (navigator.msSaveOrOpenBlob) {
		navigator.msSaveOrOpenBlob(uriToBlob(uri), filename);
	}
	else {
		const a = document.createElement("a");
		a.download = filename;
		a.style.display = "none";
		document.body.appendChild(a);
		try {
			const blob = uriToBlob(uri);
			const url = URL.createObjectURL(blob);
			a.href = url;
			a.onclick = () => requestAnimationFrame(() => URL.revokeObjectURL(url));
		}
		catch (_) {
			a.href = uri;
		}
		a.click();
		document.body.removeChild(a);
	}
}

export function arrayMinMax(array: ArrayLike<number>) {
	let min = array[0];
	let max = array[0];

	for (let i = 1; i < array.length; ++i) {
		const v = array[i];
		if (v < min) { min = v; }
		if (v > max) { max = v; }
	}

	return { min, max };
}
