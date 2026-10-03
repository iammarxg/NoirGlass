# Development and contributing

This guide is for your first NoirGlass source build. To install the released theme or plugin instead, use [the README](../README.md) and [Setup](SETUP.md).

NoirGlass has three parts: CSS that styles Jellyfin Web, a browser script that adds the carousel and badges, and a server plugin that loads that script and supplies settings. In source and test commands, the browser script is called the **companion**; it is not a separate userscript installation.

## Prerequisites

Install **Git**, **Node.js 22** with npm, and the **.NET 10 SDK**. The server plugin targets Jellyfin's **12.1.0.0 ABI**—the plugin interface version it must match.

Clone [the repository](https://github.com/iammarxg/NoirGlass) and open a terminal in its root directory. You do not need a running Jellyfin server for the automated browser fixtures or plugin tests.

## Build your first candidate

1. Install locked dependencies and the test browser:

   ```sh
   npm ci --ignore-scripts
   npx playwright install chromium
   ```

2. Build the theme and plugin:

   ```sh
   npm run build:all
   ```

3. Run the basic source and documentation checks:

   ```sh
   npm run check
   npm run test:docs
   npm run test:plugin
   ```

| Output | Purpose |
| --- | --- |
| `dist/noirglass.min.css` | Single-import theme with embedded Inter, icons, and license notices. |
| `dist/noirglass.companion.js` | Browser payload embedded in the plugin. |
| `dist/NoirGlass.Plugin_12.1.0.zip` | Installable server plugin; the suffix identifies its Jellyfin target, not the NoirGlass release version. |
| `manifest.json` | Plugin catalog entry with version, download URL, changelog, and ZIP checksum. |

`npm run build` builds CSS, copies the browser script, and regenerates the variable tables in [Customization](CUSTOMIZATION.md). It reads defaults from CSS and explanations from the documentation metadata; it does not rewrite the README. `npm run build:plugin` builds the server plugin and catalog. `build:all` runs both.

## Check your change

A **fixture** is a small test page or test server that reproduces a component without connecting to your library. Fixtures allow testing error, permission, and destructive-confirmation states safely; they do not establish that a real server operation works.

Run the suites related to your change, then the full list before preparing a release:

<details>
<summary>Full local validation commands</summary>

```sh
npm run build:all
npm run check
npm run test:docs
npm run test:plugin
npm run test:companion
npm run test:autoplay
npm run test:home-options
npm run test:formats
npm run test:plugin-settings
npm run test:branding
npm run test:responsive
npm run test:ui
npm run test:dashboard
npm run test:dashboard-layout
npm run test:desktop
npm run test:login
npm run test:polish
npm run test:release
node scripts/check-release-version.mjs
npm audit --audit-level=high
```

</details>

| Test group | What it checks |
| --- | --- |
| Static and documentation | CSS parsing, variable coverage, links, screenshots, licenses, catalog checksum, and customization examples. |
| Plugin | Web-page script injection, server base URLs, configuration compatibility, authentication, and administrator-only rotation. |
| Companion and Home | Duplicate loading, native fallback, route cleanup, autoplay, large title counts, pins, refresh, and permission-filtered links. |
| Formats, settings, branding | Stream/source evidence, the settings form, and targeted logo removal. |
| Responsive and shared UI | Header/control geometry, dialogs, splash layers, fields, favorite states, and player docks. |
| Dashboard | CSS precedence, administrator access, direct loads, cleanup, failure recovery, and full-shell layouts. |
| Desktop polish | Unified Home navigation, long-link scrolling, plugin form alignment, and overview expansion at popular desktop sizes followed by the full desktop matrix; Mobile Home is checked separately. |
| Release | Version/changelog consistency and release-note generation. |

The [shared viewport matrix](../scripts/viewports.mjs) tests twelve 16:9 sizes from 854×480 to 3840×2160 first, then ten alternate-aspect and mobile sizes. Some component-specific suites use smaller sets; see [UI coverage](UI-COVERAGE.md) for their purpose and evidence. A reproducible build produces the same bytes from the same source and dependencies; CI builds twice and compares asset hashes.

## Preview on an existing Jellyfin server

Use temporary Playwright injection to review a candidate without changing saved Custom CSS or installing the plugin. Playwright is the browser automation tool used by these helpers.

1. Set the server URL and open the browser. In PowerShell:

   ```powershell
   $env:NOIRGLASS_URL = "https://your-jellyfin.example"
   npm run browser
   ```

2. Sign in manually in that browser. In a second terminal, apply the local CSS and optional browser payload:

   ```sh
   npm run preview
   node scripts/browser-command.mjs companion
   ```

3. For a temporary administration preview, run:

   ```sh
   node scripts/browser-command.mjs dashboard-preview
   ```

4. Test CSS-only fallback with `node scripts/browser-command.mjs disable-companion`, or close the temporary browser when finished.

The helper listens on `127.0.0.1:4319`. Authentication stays in memory; previews change browser responses rather than saved server configuration. The companion preview does not test server-side script injection—installing the real plugin and restarting a test server is necessary for that.

Keep local item IDs in ignored `.local/instance.json`, reports in `.local/verification/`, and fixture output in `test-results/`. Do not commit credentials, authentication files, account/server details, or private administration images. Public screenshots must use a permitted test library.

## Contribution checklist

1. Make a focused change on a branch and update its user-facing documentation.
2. For a new CSS variable, add its description, accepted values, and examples to [the metadata map](../scripts/token-docs.mjs); rebuild the customization table.
3. Run relevant tests, inspect rendered pages when appearance changes, and check native actions remain usable.
4. Rebuild generated files and include them with source changes. Check the diff for private data and unrelated changes.
5. Describe what changed and which checks passed when opening a pull request.

## Release checklist

These steps publish files publicly; use them only for a reviewed release:

1. Set the version in [package metadata](../package.json) to `MAJOR.MINOR.PATCH` and the version in [the plugin project](../plugin/NoirGlass.Plugin/NoirGlass.Plugin.csproj) to `MAJOR.MINOR.PATCH.0`, with the same first three numbers. Update the npm lockfile, and add a dated `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` section to [the changelog](../CHANGELOG.md). Preserve previous entries.
2. Build and run the full validation list. Review generated CSS, browser payload, catalog, ZIP, and documentation.
3. Push the reviewed source to `main`. Once validation passes, the workflow creates an annotated `vMAJOR.MINOR.PATCH` tag at the exact tested commit and publishes the release automatically. You do not need to push a tag manually.
4. Wait for both **build-and-test** and **publish** to pass. Verify the three downloadable assets, catalog checksum, release notes, comparison link, and installation URLs.

The [workflow](../.github/workflows/release.yml) validates pushes to `main` and pull requests. Only a new, explicitly requested release version on `main` is published automatically. Versions are changed manually as part of preparing that release; documentation-only changes and ordinary fixes do not bump versions. Pushes using an already-published version finish successfully with **Version already released**, leaving its tag, notes, and assets untouched. Pull requests never publish. Tag-triggered releases remain supported.

Release notes combine the curated changelog section with GitHub-generated notes and a comparison to the previous published stable tag; the first release links to its commit history. Publication is serialized across the repository. A conflicting tag, existing draft, or prerelease requires manual resolution; none is overwritten.

If validation fails before a tag exists, fix the problem and push to `main` again. If a tag exists but publication failed, use **Actions → Release NoirGlass → Run workflow**, choose `main`, and enter the existing tag. This retries that tagged source with the selected workflow; it does not move the tag. An already-published release is a successful no-op; drafts are never overwritten.

During release verification, check [CDN caching and version pinning](SETUP.md#versions-and-cdn-caching) to confirm that installation URLs serve the intended files.
