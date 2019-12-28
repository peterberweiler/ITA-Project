import { EventEmitter } from "events";
//@ts-ignore
import sortable from "html5sortable/dist/html5sortable.es";

function hide(element: HTMLElement, hide: boolean = true) {
	if (hide) {
		element.setAttribute("hidden", "1");
	}
	else {
		element.removeAttribute("hidden");
	}
}

class UIController extends EventEmitter {
	public readonly menuItems = document.querySelectorAll<HTMLDivElement>("#menu .menu-item");
	public readonly layerList = document.querySelector<HTMLUListElement>("#layers-window ul");

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
			// forcePlaceholderSize: true,
			// placeholderClass: "ph-class",
			// hoverClass: "bg-maroon yellow"
		});

		// reload sortable after items where added
		// sortable(this.layerList, "reload");

		sortable(this.layerList)[0].addEventListener("sortupdate", (event: any) => {

			// This event is triggered when the user stopped sorting and the DOM position has changed.
			// event.detail.item - {HTMLElement} dragged element

			// Destination Container Data
			// event.detail.destination.index - {Integer} Index of the element within Sortable Items Only
			// event.detail.destination.elementIndex - {Integer} Index of the element in all elements in the Sortable Container
			// event.detail.destination.container - {HTMLElement} Sortable Container that element was moved out of (or copied from)
			// event.detail.destination.itemsBeforeUpdate - {Array} Sortable Items before the move
			// event.detail.destination.items - {Array} Sortable Items after the move
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

	//TODO: create selector ui class

	selectBrushType(index: number) {
		this.brushTypeSelectorButtons.forEach(item => item.removeAttribute("selected"));
		this.brushTypeSelectorButtons[index].setAttribute("selected", "true");

		this.emit("brush-type-selected", index);
	}
}

const UI = new UIController();
export default UI;

