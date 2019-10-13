import { OrbitCamera } from "./Renderer/Cameras";
import MouseOrbitCameraController from "./Renderer/MouseCameraController";
import Renderer from "./Renderer/Renderer";

const fragSource = require("./Shader/base.fs").default;
const vertSource = require("./Shader/base.vs").default;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
let renderer: Renderer;
let camera: OrbitCamera;
let mouseController: MouseOrbitCameraController;

let autorotate = true;

function setupRenderer() {
	camera = new OrbitCamera({
		viewDirecton: [0, 0, 100],
		center: [0, 0, 0],
		up: [0, 1, 0],
		distance: 0.1,
		fieldOfView: 45,
		zNear: 0.001,
		zFar: 1000,
	});

	mouseController = new MouseOrbitCameraController(camera, canvas);
	renderer = new Renderer(canvas, camera);
	window.onresize = () => renderer.resized();
	renderer.resized();

	//const shader = new Shader(vertSource, fragSource);
	//const mesh = new Mesh(
	//	[
	//		-1, -1, 0,
	//		-1, 1, 0,
	//		1, -1, 0,
	//		1, 1, 0,
	//	], [0, 3, 2, 0, 1, 3]
	//);
	//model = new Model(mesh, shader);

	requestAnimationFrame(main);
}

function setupUI() {
	const autorotatationButton = <HTMLButtonElement>document.querySelector("#autorotationButton");
	autorotatationButton.onclick = () => { autorotate = !autorotate; };
}

function update(now: number, deltaTime: number) {
	//if (autorotate) {
	//	mat4.rotateZ(model.transformation, model.transformation, 0.005);
	//	mat4.rotateY(model.transformation, model.transformation, 0.003);
	//	mat4.rotateX(model.transformation, model.transformation, 0.002);
	//}
}

//function render(now: number, deltaTime: number) {
//	model.draw();
//}

let lastRenderTime: number | null = null;

function main(now: number) {
	const deltaTime = (lastRenderTime && now) ? (now - lastRenderTime) : (1000 / 60);
	lastRenderTime = now;
	// fps = ((1000 / deltaTime * 0.4) + (fps * 0.6));

	renderer.render(now, deltaTime);
	//update(now, deltaTime);
	//renderer.beforeRender(now, deltaTime);
	//render(now, deltaTime);
	//renderer.afterRender(now, deltaTime);

	requestAnimationFrame(main);
	renderer.checkGLError();
}

setupRenderer();
setupUI();
