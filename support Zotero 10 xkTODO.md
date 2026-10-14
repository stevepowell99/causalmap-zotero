Zotero 10 is out (Steve, 14 October 2026). `manifest.json` has `strict_max_version: "9.*"`, so Zotero 10 refuses to install or keep the plugin.

- Test the plugin on Zotero 10 (install, right-click "Make a Causal Map", pairing, import).
- If it works, raise `strict_max_version` to `10.*`, bump `version`, tag and release.
- Then update the version line on the Garden page `600 How to -- in the Causal Map app/450 Make a causal map from a Zotero item ((zotero)).md` ("works with Zotero 7, 8 and 9") and the README's "Zotero 7/8/9" line.
