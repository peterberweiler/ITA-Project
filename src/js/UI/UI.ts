import { EventEmitter } from "events";
//@ts-ignore
import sortable from "html5sortable/dist/html5sortable.es";
import { color2hex, hex2color, hide } from "../HelperFunctions";
import Layers from "../Renderer/Terrain/Layers";
import Settings from "../Settings";
import UISelector from "./UISelector";

declare interface UIController {
	on(event: "debug0", listener: () => void): this;
	on(event: "debug1", listener: () => void): this;
	on(event: "debug2", listener: () => void): this;
	on(event: "debug3", listener: () => void): this;
	on(event: "debug4", listener: () => void): this;
	on(event: "debug5", listener: () => void): this;
	on(event: "radius-changed", listener: (value: number) => void): this;
	on(event: "strength-changed", listener: (value: number) => void): this;
	on(event: "min-slope-changed", listener: (value: number) => void): this;
	on(event: "max-slope-changed", listener: (value: number) => void): this;
	on(event: "flatten-brush-type-changed", listener: (type: number) => void): this;
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
	public readonly brushWindowTitle = document.querySelector<HTMLHeadingElement>("#brush-window .title")!;

	public readonly layersWindow = document.getElementById("layers-window") as HTMLDivElement
	public readonly layerEditWindow = document.getElementById("layer-edit-window") as HTMLDivElement

	public readonly settingsWindow = document.getElementById("settings-window") as HTMLDivElement
	public readonly sunPitch = document.getElementById("sun-pitch") as HTMLInputElement
	public readonly sunYaw = document.getElementById("sun-yaw") as HTMLInputElement

	public readonly layerBrushTypeSelector = new UISelector("#layer-type-selector", "div");
	public readonly layerBrushOptions = document.getElementById("layer-brush-options") as HTMLDivElement;

	public readonly brushTypeSelector = document.getElementById("brush-type-selector") as HTMLDivElement;
	public readonly brushTypeSelectorButtons = document.querySelectorAll<HTMLImageElement>("#brush-type-selector img");

	public readonly debugMenu = document.getElementById("debug-menu") as HTMLDivElement;
	public readonly debugCheckbox = document.getElementById("debug-mode-input") as HTMLInputElement;

	public readonly flattenBrushSelector = new UISelector("#flatten-brush-selector");

	constructor() {
		super();

		document.querySelector<HTMLButtonElement>("#debugButton0")!.onclick = this.emit.bind(this, "debug0");
		document.querySelector<HTMLButtonElement>("#debugButton1")!.onclick = this.emit.bind(this, "debug1");
		document.querySelector<HTMLButtonElement>("#debugButton2")!.onclick = this.emit.bind(this, "debug2");
		document.querySelector<HTMLButtonElement>("#debugButton3")!.onclick = this.emit.bind(this, "debug3");
		document.querySelector<HTMLButtonElement>("#debugButton4")!.onclick = this.emit.bind(this, "debug4");
		document.querySelector<HTMLButtonElement>("#debugButton5")!.onclick = this.emit.bind(this, "debug5");

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

		this.debugCheckbox.checked = Settings.getDebugMode();
		hide(this.debugMenu, !Settings.getDebugMode());

		this.debugCheckbox.onchange = () => {
			Settings.setDebugMode(this.debugCheckbox.checked);
			hide(this.debugMenu, !this.debugCheckbox.checked);
		};

		this.flattenBrushSelector.on("change", (i) => {
			this.emit("flatten-brush-type-changed", i);
		});

		this.layerBrushTypeSelector.on("change", (i) => {
			this.emit("layer-type-selected", i);
		});
	}

	selectMenuIndex(index: number): void {
		// make element selected
		this.menuItems.forEach(item => item.removeAttribute("selected"));
		this.menuItems[index].setAttribute("selected", "true");

		//TODO: don't use numbered ids
		switch (index) {
			case 0:
			case 1:
			case 2:
			case 3:
				this.brushWindow.classList.add("slide-out");

				setTimeout(() => {
					hide(this.brushWindow, false);
					hide(this.layersWindow, true);
					hide(this.settingsWindow, true);

					hide(this.brushTypeSelector, index !== 0 && index !== 1);

					this.layerBrushTypeSelector.hide(index !== 3);
					hide(this.layerBrushOptions, index !== 3);

					this.flattenBrushSelector.hide(index !== 2);
					this.brushWindowTitle.innerText = this.menuItems[index].getAttribute("title") || "";

					const buttonTop = this.menuItems[index].offsetTop;
					this.updateBrushWindowSizeAndPos(buttonTop);

					this.brushWindow.classList.remove("slide-out");
				}, 100);
				break;

			case 4:
				hide(this.brushWindow, true);
				hide(this.layersWindow, false);
				hide(this.settingsWindow, true);
				break;

			case 5:
				hide(this.brushWindow, true);
				hide(this.layersWindow, true);
				hide(this.settingsWindow, false);
				break;
		}

		// emit event
		this.emit("menu-selected", index);
	}

	updateBrushWindowSizeAndPos(top?: number) {
		if (top === undefined) { top = this.brushWindow.offsetTop; }

		const maxHeight = this.brushWindow.offsetParent!.clientHeight;
		this.brushWindow.style.maxHeight = Math.floor(maxHeight * 0.9) + "px";
		top = Math.min(top, maxHeight - this.brushWindow.clientHeight - 6);
		this.brushWindow.style.top = top + "px";
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

	updateLayerBrushTypeSelector(layers: Layers) {
		const children = this.layerBrushTypeSelector.getChildren();
		for (let i = 0; i < children.length; ++i) {
			const layerId = layers.layerOrder[i];
			const spans = children[i].getElementsByTagName("span");
			spans[0].style.backgroundColor = color2hex(layers.getLayerMaterial(layerId).getColor());
			spans[1].innerText = "Layer " + layerId;
			hide(children[i], !layers.getLayerActive(layerId));
		}

		this.layerBrushTypeSelector.select(0);
	}

	selectBrushType(index: number) {
		this.brushTypeSelectorButtons.forEach(item => item.removeAttribute("selected"));
		this.brushTypeSelectorButtons[index].setAttribute("selected", "true");

		this.emit("brush-type-selected", index);
	}
}

const UI = new UIController();
export default UI;

