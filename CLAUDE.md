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

- **Announce in the Zotero Forums** (`forums.zotero.org`): this is the real publication step. Post a new discussion (done: `Causal Map for Zotero`, discussion 132261). Do not revive the old "Zotero 7 Plugins" roundup thread (105151); it dates from the Zotero 7 beta and is stale, so a post there is noise.
- **Community indexes** (optional, for discoverability, not official):
  - `syt2/zotero-addons-scraper`: **the channel that matters** and the one we are in. It feeds the in-Zotero "Add-on Market" UI (the `syt2/zotero-addons` plugin), where users browse and install from inside Zotero. We are listed (PR #134 merged, 2026-06-23). To submit: add an empty-or-JSON file named `addons/{owner}@{repo}` (ours: `addons/stevepowell99@causalmap-zotero` containing `{"tags": ["integration", "ai"]}`), then PR. Tags are a fixed set of up to two: `ai`, `metadata`, `reader`, `notes`, `attachment`, `interface`, `integration`, `utility` (no causal/causation tag). A bot auto-reviews tags on the PR.
  - `zotero-chinese/zotero-plugins` (English site `zotero-chinese.com/en/plugins`): **closed to new submissions**; its README now redirects everyone to `syt2/zotero-addons-scraper` (above). Do not PR here.
  - `MohamedElashri/awesome-zotero`: hand-curated README list. Our PR #53 was **closed without comment** (2026-06-23); the repo's policy filters out new and AI-assisted tools by default. Low-value (static page). Revisit later, see `resubmit to awesome-zotero xkLATER.md`.
- The plugin does nothing a user could not do by hand under their own account, so the IP/confidentiality posture equals manual upload (see the app-side doc).
