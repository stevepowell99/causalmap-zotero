// Build a release .xpi (a zip of the plugin files with the manifest at the root).
// Cross-platform: pure-JS zip via adm-zip, no external shell tools.
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'build');
const xpiPath = path.join(buildDir, 'causalmap-zotero.xpi');

if (!fs.existsSync(path.join(root, 'icons', 'causalmap.png'))) {
	console.error('icons/causalmap.png missing. Run "npm run build" first.');
	process.exit(1);
}

fs.mkdirSync(buildDir, { recursive: true });
if (fs.existsSync(xpiPath)) fs.rmSync(xpiPath);

// Add the plugin contents at the archive root (manifest.json must sit at the top).
const zip = new AdmZip();
zip.addLocalFile(path.join(root, 'manifest.json'));
zip.addLocalFile(path.join(root, 'bootstrap.js'));
zip.addLocalFolder(path.join(root, 'src'), 'src');
zip.addLocalFolder(path.join(root, 'icons'), 'icons');
zip.writeZip(xpiPath);

console.log('Built ' + xpiPath);
