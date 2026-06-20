# causalmap-zotero

The **Causal Map for Zotero** plugin: right-click a Zotero item, choose *Make a Causal Map*, and it sends the paper text to Causal Map, which creates a project, imports it, and runs one-click coding. The app/Supabase half of the integration lives in the `causal-map-extension` repo, documented in its `docs/zotero/README.md`; this repo is the plugin only.

## Read first

- `docs/zotero/README.md` in `causal-map-extension`: how the pairing flow, Edge Function and browser handler work (the app side). The device-pairing design and the deploy tags ([DB]/[FN]/[JS]/[XPI]) are there.
- `.github/workflows/release.yml`: the release mechanism (the comment at the top is canonical).

## Version and release

- **`manifest.json` is the sole version source.** `package.json` carries no `version` field; the build reads the version from the manifest. Do not reintroduce a version anywhere else.
- To publish: bump `manifest.json` version, commit, then `git tag vX.Y.Z && git push origin vX.Y.Z`. The tag fires the Release workflow, which builds the `.xpi`, generates `update.json` for that tag, and attaches both to a GitHub Release.
- `manifest.json`'s `update_url` points at the latest release's `update.json`, so installed copies auto-update. The stable install URL to advertise is `https://github.com/stevepowell99/causalmap-zotero/releases/latest/download/causalmap-zotero.xpi`.

## Publishing and announcing (how Zotero actually works)

There is **no official Zotero plugin directory and no PR to open**. The zotero.org plugins page states a directory is only "planned". Do not look for a `zotero/zotero-plugins` repo: it does not exist.

- **Announce in the Zotero Forums** (`forums.zotero.org`): this is the real publication step. Post a new discussion (e.g. `[New Plugin] Causal Map for Zotero`) and optionally add a line to the long-running "Zotero 7 Plugins" thread.
- **Community indexes** (optional, for discoverability, not official):
  - `zotero-chinese/zotero-plugins` (English site `zotero-chinese.com/en/plugins`): the most comprehensive list. Add an entry to `src/plugins.ts` and PR. The repo is flagged maintenance-suspended, so a PR may sit; open it anyway, do not wait on it before announcing.
  - `MohamedElashri/awesome-zotero`: hand-curated README list, still active, quicker to land.
- The plugin does nothing a user could not do by hand under their own account, so the IP/confidentiality posture equals manual upload (see the app-side doc).
