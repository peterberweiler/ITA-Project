/**
 * Settings uses the Web Storage API to safe persistent data
 */

class SettingsController {
	private DEBUG_MODE_KEY = "debugMode";
	private CAMERA_MODE_KEY = "cameraMode";

	constructor() {
		// default values
		if (window.localStorage.getItem(this.DEBUG_MODE_KEY) === null) { this.setDebugMode(false); }
		if (window.localStorage.getItem(this.CAMERA_MODE_KEY) === null) { this.setCameraMode(true); }
	}

	setDebugMode(enabled: boolean) {
		window.localStorage.setItem(this.DEBUG_MODE_KEY, enabled ? "1" : "0");
	}

	getDebugMode(): boolean {
		return window.localStorage.getItem(this.DEBUG_MODE_KEY) === "1";
	}

	setCameraMode(enabled: boolean) {
		window.localStorage.setItem(this.CAMERA_MODE_KEY, enabled ? "1" : "0");
	}

	getCameraMode(): boolean {
		return window.localStorage.getItem(this.CAMERA_MODE_KEY) === "1";
	}
}

const Settings = new SettingsController();
export default Settings;
