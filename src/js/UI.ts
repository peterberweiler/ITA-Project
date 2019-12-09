import { EventEmitter } from "events";

class UIController extends EventEmitter {
	public readonly menuItems = document.querySelectorAll<HTMLDivElement>("#menu .menu-item");

	public readonly radiusInput = document.getElementById("radius-input") as HTMLInputElement;
	public readonly strengthInput = document.getElementById("strength-input") as HTMLInputElement;
	public readonly radiusOutput = document.getElementById("radius-output") as HTMLInputElement;
	public readonly strengthOutput = document.getElementById("strength-output") as HTMLInputElement;

	constructor() {
		super();

		document.querySelector<HTMLButtonElement>("#testButton1")!.onclick = this.emit.bind(this, "debug1");
		document.querySelector<HTMLButtonElement>("#testButton2")!.onclick = this.emit.bind(this, "debug2");
		document.querySelector<HTMLButtonElement>("#testButton3")!.onclick = this.emit.bind(this, "debug3");
		document.querySelector<HTMLButtonElement>("#testButton4")!.onclick = this.emit.bind(this, "debug4");
		document.querySelector<HTMLButtonElement>("#testButton5")!.onclick = this.emit.bind(this, "debug5");

		document.querySelector<HTMLButtonElement>("#cameraButton")!.onclick = this.emit.bind(this, "toggle-camera");

		this.radiusInput.oninput = () => {
			this.radiusOutput.value = this.radiusInput.value;
			this.emit("radius-changed", parseFloat(this.radiusInput.value));
		};
		this.strengthInput.oninput = () => {
			this.strengthOutput.value = this.strengthInput.value;
			this.emit("strength-changed", parseFloat(this.strengthInput.value));
		};

		let i = 0;
		this.menuItems.forEach(item => {
			const index = i++;
			item.onclick = () => {
				this.selectMenuIndex(index);
			};
		});

		this.selectMenuIndex(0);
	}

	selectMenuIndex(index: number): void {
		this.menuItems.forEach(item => item.removeAttribute("selected"));
		this.menuItems[index].setAttribute("selected", "true");

		this.emit("menu-selected", index);
	}
}

export const UI = new UIController();

