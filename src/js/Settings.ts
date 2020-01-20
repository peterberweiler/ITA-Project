/**
 * Settings uses the Web Storage API to safe persistent data
 */

export interface InitData {
	size: number
	scale: number
	maxHeight: number
	minHeight: number
}
const DEBUG_MODE_KEY = "debugMode";
const CAMERA_MODE_KEY = "cameraMode";
const INIT_DATA_KEY = "initData";

class SettingsController {
	constructor() {
		// default values
		if (window.localStorage.getItem(DEBUG_MODE_KEY) === null) { this.setDebugMode(false); }
		if (window.localStorage.getItem(CAMERA_MODE_KEY) === null) { this.setCameraMode(true); }
	}

	setDebugMode(enabled: boolean) {
		window.localStorage.setItem(DEBUG_MODE_KEY, enabled ? "1" : "0");
	}

	getDebugMode(): boolean {
		return window.localStorage.getItem(DEBUG_MODE_KEY) === "1";
	}

	setCameraMode(enabled: boolean) {
		window.localStorage.setItem(CAMERA_MODE_KEY, enabled ? "1" : "0");
	}

	getCameraMode(): boolean {
		return window.localStorage.getItem(CAMERA_MODE_KEY) === "1";
	}

	setInitData(data: InitData) {
		window.localStorage.setItem(INIT_DATA_KEY, JSON.stringify(data));
	}
	getInitData(): InitData {
		let storedData;
		try {
			storedData = JSON.parse(window.localStorage.getItem(INIT_DATA_KEY) || "{}");
		}
		catch {
			storedData = {};
		}
		let data = {} as InitData;
		data.size = storedData.size || 1024;
		data.scale = storedData.scale || 1;
		data.maxHeight = storedData.maxHeight || 3000;
		data.minHeight = storedData.minHeight || -3000;
		return data;
	}
}

const Settings = new SettingsController();
export default Settings;
