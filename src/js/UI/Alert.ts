import { show } from "../HelperFunctions";

const alertQueue: Alert[] = [];

const alertElement = document.getElementById("alert")! as HTMLDivElement;

const alertTextElement = alertElement.querySelector<HTMLSpanElement>("span")!;
const alertButtons = alertElement.querySelectorAll<HTMLButtonElement>("button");

// Alert.element.querySelector("button").onclick = Alert.ok.bind(Alert);

alertButtons.forEach((button, i) => {
	button.onclick = () => {
		if (alertQueue[0] && alertQueue[0].callback) {
			alertQueue[0].callback(i);
		}
		alertQueue.shift();
		animateUpdateAlerts();
	};
});

interface Alert {
	message: string
	type: AlertType
	callback?: (button: AlertButton) => void
}

// correspondes with the order of buttons in the dom
export const enum AlertButton {
	Ok = 0,
	Yes = 1,
	No = 2,
	Cancel = 3,
}

export const enum AlertType {
	Ok,
	OkCancel,
	YesNo,
	YesNoCancel,
}

function updateButtons(type: AlertType) {
	show(alertButtons[AlertButton.Ok], type === AlertType.Ok || type === AlertType.OkCancel);
	show(alertButtons[AlertButton.Yes], type === AlertType.YesNo || type === AlertType.YesNoCancel);
	show(alertButtons[AlertButton.No], type === AlertType.YesNo || type === AlertType.YesNoCancel);
	show(alertButtons[AlertButton.Cancel], type === AlertType.OkCancel || type === AlertType.YesNoCancel);
}

function animateUpdateAlerts() {
	alertElement.setAttribute("hidden", "true");
	setTimeout(updateAlerts, 160);
}

function updateAlerts() {
	if (alertQueue.length === 0) {
		alertElement.setAttribute("hidden", "true");
	}
	else {
		alertTextElement.innerHTML = alertQueue[0].message;
		updateButtons(alertQueue[0].type);
		alertElement.removeAttribute("hidden");
	}
}

export function showAlert(message: string, type: AlertType, callback?: (button: AlertButton) => void) {
	alertQueue.push(
		{
			message, type, callback
		}
	);
	updateAlerts();
}

