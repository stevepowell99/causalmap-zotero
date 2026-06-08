var CausalMap;

function log(msg) {
	Zotero.debug("Causal Map for Zotero: " + msg);
}

function install() {
	log("Installed 0.4.3");
}

async function startup({ id, version, rootURI }) {
	log("Starting 0.4.3");
	Services.scriptloader.loadSubScript(rootURI + 'src/causalmap.js');
	CausalMap.init({ id, version, rootURI });
	CausalMap.addToAllWindows();
}

function onMainWindowLoad({ window }) {
	CausalMap.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	CausalMap.removeFromWindow(window);
}

function shutdown() {
	log("Shutting down 0.4.3");
	if (CausalMap) {
		CausalMap.removeFromAllWindows();
	}
	CausalMap = undefined;
}

function uninstall() {
	log("Uninstalled 0.4.3");
}
