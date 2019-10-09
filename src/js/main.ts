import { number3 } from "./globals";

const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;

function setup() {
	let test: number3 = [0, 0, 0];

	window.onresize = () => {
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
	};

	window.onresize(new UIEvent(""));

	let context = canvas.getContext("2d");
	if (context) {
		context.font = "30px Arial";
		context.fillStyle = "white";
		context.fillText("It's working!", 50, 200);
	}
}

setup();
