import { EventEmitter } from "events";
import { hide } from "../HelperFunctions";

declare interface UISelector {
	on(event: "change", listener: (selectedIndex: number) => void): this;
}

class UISelector extends EventEmitter {
	private element: HTMLElement;
	private children: NodeListOf<HTMLElement>;

	constructor(element: HTMLElement | string, childrenQuerySelector = "span") {
		super();

		if (typeof element === "string") {
			const e = document.querySelector<HTMLElement>(element);
			if (!e) { throw new Error("Could't find element with selector: " + element); }
			this.element = e;
		}
		else {
			this.element = element;
		}

		this.children = this.element.querySelectorAll<HTMLElement>(childrenQuerySelector);

		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].addEventListener(
				"click",
				this.select.bind(this, i)
			);
		}
	}

	select(index: number) {
		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].removeAttribute("selected");
		}
		this.children[index].setAttribute("selected", "true");
		this.emit("change", index);
	}

	hide(hidden: boolean) {
		hide(this.element, hidden);
	}
}

export default UISelector;
