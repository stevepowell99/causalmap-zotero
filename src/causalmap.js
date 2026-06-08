var CausalMap = {
	id: null,
	version: null,
	rootURI: null,
	addedElementIds: [],

	APP_URL: 'https://app.causalmap.app',
	FUNCTION_URL: 'https://ltonrdstoclpnhefgmtz.supabase.co/functions/v1/zotero',
	SUPABASE_KEY: 'sb_publishable_WLCeYAsN1HVDZIsabc8sKg_FzxwjCQ0',
	// Set this pref to a localhost URL (e.g. http://localhost:8000) to test against a local webapp.
	APP_URL_PREF: 'extensions.causalmap.appUrl',
	CONSENT_PREF: 'extensions.causalmap.consentAccepted',
	MENU_LABEL: 'Make a Causal Map',

	// Rough autocoding cost: about 30 pages per credit (~90k characters).
	CHARS_PER_CREDIT: 90000,
	FREE_CREDITS_PER_MONTH: 10,

	init({ id, version, rootURI }) {
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
	},

	log(msg) {
		Zotero.debug('Causal Map for Zotero: ' + msg);
	},

	addToAllWindows() {
		for (let win of Zotero.getMainWindows()) {
			if (win.ZoteroPane) this.addToWindow(win);
		}
	},

	removeFromAllWindows() {
		for (let win of Zotero.getMainWindows()) {
			if (win.ZoteroPane) this.removeFromWindow(win);
		}
	},

	addToWindow(window) {
		let doc = window.document;
		// Right-click a collection.
		this._addMenuItem(doc, 'zotero-collectionmenu', 'causalmap-collectionmenu', () => this.run(window, 'collection'));
		// Right-click selected items.
		this._addMenuItem(doc, 'zotero-itemmenu', 'causalmap-itemmenu', () => this.run(window, 'items'));
		// Tools menu (collection by default).
		this._addMenuItem(doc, 'menu_ToolsPopup', 'causalmap-toolsmenu', () => this.run(window, 'collection'));
	},

	_addMenuItem(doc, parentId, itemId, onCommand) {
		let parent = doc.getElementById(parentId);
		if (!parent || doc.getElementById(itemId)) return;
		let menuitem = doc.createXULElement('menuitem');
		menuitem.id = itemId;
		menuitem.setAttribute('label', this.MENU_LABEL);
		menuitem.classList.add('menuitem-iconic');
		// menuitem icons render via list-style-image (CSS), not the image attribute.
		menuitem.style.listStyleImage = `url("${this.rootURI}icons/causalmap.png")`;
		menuitem.addEventListener('command', onCommand);
		parent.appendChild(menuitem);
		this.addedElementIds.push(itemId);
	},

	removeFromWindow(window) {
		let doc = window.document;
		for (let id of this.addedElementIds) {
			doc.getElementById(id)?.remove();
		}
	},

	// Main flow: gather text, pair with the logged-in browser, import as that user, open the project.
	async run(window, mode) {
		try {
			// Single item only for now; collection and multi-select are coming soon.
			if (mode === 'collection') {
				Services.prompt.alert(window, 'Causal Map',
					'Mapping a whole collection is coming soon. For now, right-click a single item and choose "Make a Causal Map".');
				return;
			}

			let pane = Zotero.getActiveZoteroPane();
			let items = (pane.getSelectedItems() || []).filter(it => it.isRegularItem && it.isRegularItem());
			if (items.length === 0) {
				Services.prompt.alert(window, 'Causal Map', 'Select a single item first, then try again.');
				return;
			}
			if (items.length > 1) {
				Services.prompt.alert(window, 'Causal Map',
					'Mapping multiple items at once is coming soon. Select a single item for now.');
				return;
			}
			let item = items[0];
			let defaultName = item.getField('title') || item.getDisplayTitle() || 'Zotero item';

			if (!this._hasConsent()) {
				let consentText = 'This sends the full text of the selected item to Causal Map (app.causalmap.app), under your account, for AI processing.\n\n'
					+ 'Only process material you have the right to. Continue?';
				if (!Services.prompt.confirm(window, 'Causal Map', consentText)) return;
				this._setConsent();
			}

			let nameInput = { value: defaultName };
			if (!Services.prompt.prompt(window, 'Causal Map', 'Project name:', nameInput, null, {})) return;
			let projectName = (nameInput.value || '').trim() || defaultName;

			let text = await this._getItemText(item);
			if (!text) {
				Services.prompt.alert(window, 'Causal Map',
					'No extractable text found. The item needs an attachment with indexed full text (for example a PDF Zotero has indexed).');
				return;
			}
			let sources = [{
				id: item.key,
				title: item.getField('title') || item.getDisplayTitle(),
				content: text,
				authors: this._getAuthors(item),
				year: this._getYear(item),
				doi: item.getField('DOI') || '',
				url: item.getField('url') || ''
			}];
			let totalChars = text.length;

			let estCredits = Math.ceil(totalChars / this.CHARS_PER_CREDIT);
			if (estCredits > this.FREE_CREDITS_PER_MONTH) {
				let warn = 'This is large: about ' + estCredits + ' AI credits to autocode (rough estimate). '
					+ 'The free tier is ' + this.FREE_CREDITS_PER_MONTH + ' credits per month.\n\nContinue?';
				if (!Services.prompt.confirm(window, 'Causal Map', warn)) return;
			}

			// Pair: open the browser to approve, then poll until approved (no blocking dialog).
			let appUrl = this._appUrl();
			let pairing = await this._callFunction({ action: 'create' });
			Zotero.launchURL(appUrl + '/?zotero_pair=' + encodeURIComponent(pairing.code));

			let approved = await this._waitForApproval(window, pairing.code, pairing.secret);
			if (!approved) {
				Services.prompt.alert(window, 'Causal Map',
					'Approval was not detected (last status: ' + (this._lastApprovalStatus || 'unknown') + ').\n\n'
					+ 'If the status stayed "pending", the Approve click in the browser did not reach the server. '
					+ 'Make sure you are logged in to Causal Map in that tab, then run "Make a Causal Map" again.');
				return;
			}

			await this._callFunction({
				action: 'import',
				code: pairing.code,
				secret: pairing.secret,
				projectName,
				sources
			});
			// Success: the Causal Map tab shows progress and opens the project itself, so there is
			// nothing more to do in Zotero (no dialog, no second tab).
			this.log('Import complete (' + sources.length + ' source); Causal Map will open the project.');
		}
		catch (e) {
			this.log('Run failed: ' + e);
			Services.prompt.alert(window, 'Causal Map', 'Failed: ' + (e && e.message ? e.message : e));
		}
	},

	_appUrl() {
		try {
			let v = Services.prefs.getStringPref(this.APP_URL_PREF, '');
			if (v) return v.replace(/\/$/, '');
		}
		catch (e) { /* use default */ }
		return this.APP_URL;
	},

	async _callFunction(payload) {
		let xhr = await Zotero.HTTP.request('POST', this.FUNCTION_URL, {
			body: JSON.stringify(payload),
			headers: { 'Content-Type': 'application/json', 'apikey': this.SUPABASE_KEY },
			responseType: 'json',
			successCodes: false
		});
		let data = xhr.response;
		if (xhr.status < 200 || xhr.status >= 300 || !data || data.ok === false) {
			throw new Error((data && data.error) || ('HTTP ' + xhr.status));
		}
		return data;
	},

	async _waitForApproval(window, code, secret) {
		let deadline = Date.now() + 150000; // 2.5 minutes
		this._lastApprovalStatus = 'unknown';
		while (Date.now() < deadline) {
			let s = await this._callFunction({ action: 'status', code, secret });
			this._lastApprovalStatus = (s && s.status) ? s.status : 'unknown';
			this.log('Pairing status: ' + this._lastApprovalStatus);
			if (s.status === 'approved') return true;
			if (s.expired || s.status === 'consumed') return false;
			await new Promise(r => window.setTimeout(r, 3000));
		}
		return false;
	},

	// Prefer Zotero's best attachment; fall back to scanning all attachments.
	async _getItemText(item) {
		try {
			let best = await item.getBestAttachment();
			if (best) {
				let t = await best.attachmentText;
				if (t && t.trim()) return t;
			}
		}
		catch (e) { /* fall through to scan */ }

		for (let id of item.getAttachments()) {
			let att = Zotero.Items.get(id);
			if (!att || !att.isAttachment()) continue;
			try {
				let t = await att.attachmentText;
				if (t && t.trim()) return t;
			}
			catch (e) { /* try next attachment */ }
		}
		return '';
	},

	_getAuthors(item) {
		let creators = item.getCreators() || [];
		return creators
			.map(c => [c.lastName, c.firstName].filter(Boolean).join(', '))
			.filter(Boolean)
			.join('; ');
	},

	_getYear(item) {
		let date = item.getField('date');
		if (!date) return '';
		try {
			let parsed = Zotero.Date.strToDate(date);
			if (parsed && parsed.year) return String(parsed.year);
		}
		catch (e) { /* fall back to regex */ }
		let m = String(date).match(/\d{4}/);
		return m ? m[0] : '';
	},

	_hasConsent() {
		try {
			return Services.prefs.getBoolPref(this.CONSENT_PREF, false);
		}
		catch (e) {
			return false;
		}
	},

	_setConsent() {
		try {
			Services.prefs.setBoolPref(this.CONSENT_PREF, true);
		}
		catch (e) { /* non-fatal */ }
	}
};
