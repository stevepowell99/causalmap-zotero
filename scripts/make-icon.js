// Generate a 16x16 menu icon (two nodes joined by a link) in Causal Map brand colours.
// Pure Node, no image libraries: hand-rolled PNG (RGBA, no filter).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 16, H = 16;
const TEAL = [109, 196, 200, 255]; // #6DC4C8
const DARK = [31, 31, 54, 255];    // #1F1F36
const CLEAR = [0, 0, 0, 0];

function pixel(x, y) {
	const inCircle = (cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
	if (y >= 7 && y <= 8 && x >= 4 && x <= 12) return DARK; // connector
	if (inCircle(4, 8, 3)) return TEAL;  // cause node
	if (inCircle(12, 8, 3)) return TEAL; // effect node
	return CLEAR;
}

const raw = Buffer.alloc((W * 4 + 1) * H);
let o = 0;
for (let y = 0; y < H; y++) {
	raw[o++] = 0; // filter type: none
	for (let x = 0; x < W; x++) {
		const c = pixel(x, y);
		raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2]; raw[o++] = c[3];
	}
}

const crcTable = (() => {
	const t = [];
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
		t[n] = c >>> 0;
	}
	return t;
})();
function crc32(buf) {
	let c = 0xFFFFFFFF;
	for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
	return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
	const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
	return Buffer.concat([len, body, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);

const dir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'causalmap.png'), png);
console.log('Wrote icons/causalmap.png');
