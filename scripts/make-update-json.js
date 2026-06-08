// Generate update.json for a release. Usage: node scripts/make-update-json.js v0.4.3
// (the GitHub Actions release workflow runs this; update_url points at the latest release asset).
const fs = require('fs');
const path = require('path');

const REPO = 'stevepowell99/causalmap-zotero';
const ADDON_ID = 'causalmap@causalmap.app';

const version = String(process.argv[2] || '').replace(/^v/, '');
if (!version) {
	console.error('Usage: node scripts/make-update-json.js <version|vX.Y.Z>');
	process.exit(1);
}

const update = {
	addons: {
		[ADDON_ID]: {
			updates: [
				{
					version,
					update_link: `https://github.com/${REPO}/releases/download/v${version}/causalmap-zotero.xpi`,
					applications: { zotero: { strict_min_version: '6.999' } }
				}
			]
		}
	}
};

fs.writeFileSync(path.join(__dirname, '..', 'update.json'), JSON.stringify(update, null, 2) + '\n');
console.log('Wrote update.json for', version);
