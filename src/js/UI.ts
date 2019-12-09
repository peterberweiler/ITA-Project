import { EventEmitter } from "events";
//@ts-ignore
import sortable from "html5sortable/dist/html5sortable.es";

class UIController extends EventEmitter {
	public readonly menuItems = document.querySelectorAll<HTMLDivElement>("#menu .menu-item");
	public readonly layerList = document.querySelector<HTMLUListElement>("#layers-window ul");

	public readonly radiusInput = document.getElementById("radius-input") as HTMLInputElement;
	public readonly strengthInput = document.getElementById("strength-input") as HTMLInputElement;
	public readonly radiusOutput = document.getElementById("radius-output") as HTMLInputElement;
	public readonly strengthOutput = document.getElementById("strength-output") as HTMLInputElement;

	public readonly windows = document.querySelectorAll<HTMLDivElement>(".window");
	public readonly brushWindow = document.getElementById("brush-window") as HTMLDivElement
	public readonly layersWindow = document.getElementById("layers-window") as HTMLDivElement
	public readonly layerEditWindow = document.getElementById("layer-edit-window") as HTMLDivElement
	public readonly settingsWindow = document.getElementById("settings-window") as HTMLDivElement

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
		switch (index) {
			case 0:
			case 1:
			case 2:
				this.brushWindow.removeAttribute("hidden");
				break;

			case 3:
				this.layersWindow.removeAttribute("hidden");
				break;

			case 4:
				this.settingsWindow.removeAttribute("hidden");
				break;
		}

		// emit event
		this.emit("menu-selected", index);
	}
}

export const UI = new UIController();
