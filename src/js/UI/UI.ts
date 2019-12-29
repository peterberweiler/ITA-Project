import { EventEmitter } from "events";
//@ts-ignore
import sortable from "html5sortable/dist/html5sortable.es";
import Layers from "../Renderer/Terrain/Layers";

function hide(element: HTMLElement, hide: boolean = true) {
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

declare interface UIController {
	on(event: "toggle-camera", listener: () => void): this;
	on(event: "debug1", listener: () => void): this;
	on(event: "debug2", listener: () => void): this;
	on(event: "debug3", listener: () => void): this;
	on(event: "debug4", listener: () => void): this;
	on(event: "debug5", listener: () => void): this;
	on(event: "radius-changed", listener: (value: number) => void): this;
	on(event: "strength-changed", listener: (value: number) => void): this;
	on(event: "min-slope-changed", listener: (value: number) => void): this;
	on(event: "max-slope-changed", listener: (value: number) => void): this;
	on(event: "menu-selected", listener: (menuIndex: number) => void): this;
	on(event: "layer-type-selected", listener: (index: number) => void): this;
	on(event: "brush-type-selected", listener: (index: number) => void): this;
	on(event: "sun-changed", listener: (pitch: number, yaw: number) => void): this;
	on(event: "layer-order-changed", listener: (order: number[]) => void): this;
	on(event: "layer-changed", listener: (id: number, color: number[], roughness: number, active: boolean) => void): this;
}

class UIController extends EventEmitter {
	public readonly menuItems = document.querySelectorAll<HTMLDivElement>("#menu .menu-item");
	public readonly layerList = document.querySelector<HTMLDivElement>("#layers-window .sortable")!;
	public readonly layerListTemplate = document.querySelector<HTMLTemplateElement>("#layers-window template")!;

	public readonly radiusInput = document.getElementById("radius-input") as HTMLInputElement;
	public readonly strengthInput = document.getElementById("strength-input") as HTMLInputElement;
	public readonly radiusOutput = document.getElementById("radius-output") as HTMLInputElement;
	public readonly strengthOutput = document.getElementById("strength-output") as HTMLInputElement;
	public readonly minSlopeInput = document.getElementById("min-slope-input") as HTMLInputElement;
	public readonly maxSlopeInput = document.getElementById("max-slope-input") as HTMLInputElement;

	public readonly windows = document.querySelectorAll<HTMLDivElement>(".window");
	public readonly brushWindow = document.getElementById("brush-window") as HTMLDivElement
	public readonly layersWindow = document.getElementById("layers-window") as HTMLDivElement
	public readonly layerEditWindow = document.getElementById("layer-edit-window") as HTMLDivElement

	public readonly settingsWindow = document.getElementById("settings-window") as HTMLDivElement
	public readonly sunPitch = document.getElementById("sun-pitch") as HTMLInputElement
	public readonly sunYaw = document.getElementById("sun-yaw") as HTMLInputElement

	public readonly layerTypeSelector = document.getElementById("layer-type-selector") as HTMLDivElement;
	public readonly layerTypeSelectorButtons = document.querySelectorAll<HTMLSpanElement>("#layer-type-selector span");

	public readonly brushTypeSelector = document.getElementById("brush-type-selector") as HTMLDivElement;
	public readonly brushTypeSelectorButtons = document.querySelectorAll<HTMLImageElement>("#brush-type-selector img");

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

		this.minSlopeInput.oninput = () => {
			this.emit("min-slope-changed", parseFloat(this.minSlopeInput.value));
		};
		this.maxSlopeInput.oninput = () => {
			this.emit("max-slope-changed", parseFloat(this.maxSlopeInput.value));
		};

		this.sunYaw.oninput = this.sunPitch.oninput = () => {
			this.emit("sun-changed", parseFloat(this.sunPitch.value), parseFloat(this.sunYaw.value));
		};

		let i = 0;
		this.menuItems.forEach(item => {
			const index = i++;
			item.onclick = () => {
				this.selectMenuIndex(index);
			};
		});

		i = 0;
		this.layerTypeSelectorButtons.forEach(item => {
			const index = i++;
			item.onclick = () => {
				this.selectLayerType(index);
			};
		});

		i = 0;
		this.brushTypeSelectorButtons.forEach(item => {
			const index = i++;
			item.onclick = () => {
				this.selectBrushType(index);
			};
		});

		sortable(this.layerList, {
			handle: ".anchor",
		});

		sortable(this.layerList)[0].addEventListener("sortupdate", (_event: any) => {
			// event.detail.item
			// event.detail.destination

			const newOrder = [];
			for (let i = 0; i < this.layerList.children.length; ++i) {
				const child = this.layerList.children[i];
				const id = parseInt(child.getAttribute("layerId") || "0");
				newOrder.push(id);
			}
			this.emit("layer-order-changed", newOrder);
		});
	}

	selectMenuIndex(index: number): void {
		// make element selected
		this.menuItems.forEach(item => item.removeAttribute("selected"));
		this.menuItems[index].setAttribute("selected", "true");

		// show correct window
		this.windows.forEach(window => window.setAttribute("hidden", "true"));

		//TODO: don't use numbered ids
		switch (index) {
			case 0:
			case 1:
			case 2:
			case 3:
				this.brushWindow.removeAttribute("hidden");

				hide(this.brushTypeSelector, index !== 0 && index !== 1);
				hide(this.layerTypeSelector, index !== 3);
				break;

			case 4:
				this.layersWindow.removeAttribute("hidden");
				break;

			case 5:
				this.settingsWindow.removeAttribute("hidden");
				break;
		}

		// emit event
		this.emit("menu-selected", index);
	}

	selectLayerType(index: number) {
		this.layerTypeSelectorButtons.forEach(item => item.removeAttribute("selected"));
		this.layerTypeSelectorButtons[index].setAttribute("selected", "true");

		this.emit("layer-type-selected", index);
	}

	setupLayerList(layers: Layers) {
		// add elements to layer
		for (let id = 0; id < 8; ++id) {
			const newLayer = this.layerListTemplate.content.querySelector<HTMLDivElement>("div")!.cloneNode(true) as HTMLDivElement;
			const material = layers.getLayerMaterial(id);
			newLayer.querySelector<HTMLSpanElement>(".title")!.innerText = "Layer " + id;
			const colorInput = newLayer.querySelector<HTMLInputElement>(".color-input")!;
			const roughnessInput = newLayer.querySelector<HTMLInputElement>(".roughness-input")!;
			const enableButton = newLayer.querySelector<HTMLInputElement>(".enable-button")!;
			const disableButton = newLayer.querySelector<HTMLInputElement>(".disable-button")!;

			const layerChanged = () => {
				const color = hex2color(colorInput.value);
				const roughness = parseFloat(roughnessInput.value) || 0;
				const active = !newLayer.hasAttribute("disabled");
				this.emit("layer-changed", id, color, roughness, active);
			};

			const setLayerUIActive = (active: boolean) => {
				if (active) { newLayer.removeAttribute("disabled"); }
				else { newLayer.setAttribute("disabled", "1"); }
				colorInput.disabled = !active;
				roughnessInput.disabled = !active;
			};

			colorInput.value = color2hex(material.getColor());
			roughnessInput.value = material.getRoughness().toString();
			colorInput.oninput = layerChanged;
			roughnessInput.oninput = layerChanged;

			setLayerUIActive(layers.getLayerActive(id));

			enableButton.onclick = () => {
				setLayerUIActive(true);
				layerChanged();
			};

			disableButton.onclick = () => {
				setLayerUIActive(false);
				layerChanged();
			};

			// material.getRoughness
			newLayer.setAttribute("layerId", id.toString());

			this.layerList.appendChild(newLayer);
		}

		// reload sortable after items where added
		sortable(this.layerList, "reload");
	}

	//TODO: create selector ui class

	selectBrushType(index: number) {
		this.brushTypeSelectorButtons.forEach(item => item.removeAttribute("selected"));
		this.brushTypeSelectorButtons[index].setAttribute("selected", "true");

		this.emit("brush-type-selected", index);
	}
}

const UI = new UIController();
export default UI;

