/**
 * Settings uses the Web Storage API to safe persistent data
 */

class SettingsController {
	private DEBUG_MODE_KEY = "debugMode";

	setDebugMode(enabled: boolean) {
		window.localStorage.setItem(this.DEBUG_MODE_KEY, enabled ? "1" : "0");
	}

	getDebugMode(): boolean {
		return window.localStorage.getItem(this.DEBUG_MODE_KEY) === "1";
	}
}

const Settings = new SettingsController();
export default Settings;
