# Causal Map for Zotero

A Zotero 7/8/9 plugin that turns a Zotero item into a Causal Map project and codes it, without leaving Causal Map after a single Approve click.

The server side (pairing Edge Function, migrations, the in-app approve/import/code handler) lives in the main app repo at `causal-map-extension/docs/zotero/`. This README covers the plugin and how to release it.

## What it does

Right-click a single item, choose **Make a Causal Map**. The plugin:

1. Reads the item title (used as the project name) and its best attachment's indexed full text.
2. Shows a one-time consent notice, then opens Causal Map and pairs with your account (device pairing; the plugin never holds your login).
3. You click **Approve** once in the browser. Causal Map imports the text, opens the new project, and runs one-click coding, shown in a progress modal.

Collection and multi-item selection currently show a "coming soon" message; single item is the supported path.

## Build

```
npm install
npm run build      # generates the menu icon
npm run pack       # writes build/causalmap-zotero.xpi
```

`pack` uses adm-zip (pure JS), no external tools. The `.xpi` is a plain zip with `manifest.json` at the root.

## Install (for users)

Zotero: Tools, Plugins, gear icon, Install Plugin From File, pick the `.xpi`. Zotero does not require signing, so it installs directly. Restart Zotero.

Note: the manifest must include `applications.zotero.update_url` or Zotero rejects the install as invalid.

## Local testing against a dev webapp

Set a string pref `extensions.causalmap.appUrl` (Zotero, Settings, Advanced, Config Editor) to your local URL, e.g. `http://localhost:8000`. Leave it unset for production (`app.causalmap.app`). The Edge Function and database are always the remote Supabase, so only the page the plugin opens changes.

## Distribution

Zotero has **no official store** (one is planned) and requires **no signing or review**. So:

1. **Host the `.xpi` on GitHub Releases.** Create the public repo `stevepowell99/causalmap-zotero`, push, and for each version cut a release `vX.Y.Z` with `causalmap-zotero.xpi` attached.
2. **Auto-update** via `update.json` (in this repo), which `manifest.json`'s `update_url` points at. Zotero polls it and updates users when the listed version is higher. Keep `update.json` on `main` pointing at the latest release asset. Format:
   ```json
   {
     "addons": {
       "causalmap@causalmap.app": {
         "updates": [
           { "version": "0.4.3",
             "update_link": "https://github.com/stevepowell99/causalmap-zotero/releases/download/v0.4.3/causalmap-zotero.xpi",
             "applications": { "zotero": { "strict_min_version": "6.999" } } }
         ]
       }
     }
   }
   ```
3. **Discovery** (no store, so):
   - Post in the Zotero Forums plugins section to get listed on `zotero.org/support/plugins` (the community list).
   - That list feeds the third-party **Add-on Market for Zotero** (Syt2), the de facto in-app browser.
   - Link from causalmap.app.

For a private beta, skip all of the above and just send the `.xpi`.

A GitHub Actions workflow can build the `.xpi` and bump `update.json` on each tag, so releasing is one `git tag`. Not set up yet.

## Notes

- Text quality depends on Zotero's own full-text index of the attachment. Items without indexed text are skipped.
- The plugin only writes a project to the user's own account; imported projects are private by default.
- A browser extension ("causally map this page") could reuse the same backend; see `causal-map-extension/docs/zotero/`.
