# Development

Build and test the NoirGlass theme and plugin for Jellyfin target ABI **12.1.0.0**. See [installation](../README.md), [setup](SETUP.md), and [customization](CUSTOMIZATION.md).

## Build and checks

Use Node 22 and the .NET 10 SDK. From the project directory:

```powershell
npm ci --ignore-scripts
npx playwright install chromium
npm run build:all
npm run check
npm run test:docs
npm run test:plugin
npm run test:companion
npm run test:autoplay
npm run test:ui
npm run test:dashboard
npm run test:dashboard-layout
npm run test:polish
npm run test:release
node scripts/check-release-version.mjs v1.0.0
npm audit --audit-level=high
```

`npm run build` concatenates the explicit CSS module order, minifies with `clean-css`, embeds Inter/original SVGs/license notices, copies the browser payload, and updates the variable guide in `docs/CUSTOMIZATION.md`. Defaults come from CSS; explanations and value examples come from `scripts/token-docs.mjs`. It does not rewrite the README.

`npm run build:plugin` compiles official Jellyfin 12.1 packages, embeds the browser payload in `NoirGlass.Plugin.dll`, and produces the deterministic ZIP and catalog checksum. `build:all` runs both builds. The ZIP target suffix remains `12.1.0` regardless of the product version.

Static checks validate CSS parsing, token documentation, deterministic output, bundled assets/licenses, links/screenshots, and ZIP checksum. Plugin tests cover injection, base URLs, authenticated settings, and configuration loading. Playwright fixtures cover fallback, duplicate loading, badges, routes, autoplay/pause behavior, reduced motion, unrelated-media isolation, and compatibility.

## Temporary Playwright preview

Use your existing Jellyfin server; no container is needed. In PowerShell:

```powershell
$env:NOIRGLASS_URL = "https://your-jellyfin.example"
npm run browser
```

Sign in manually. In a second terminal:

```powershell
npm run preview
node scripts/browser-command.mjs companion
```

The helper on `127.0.0.1:4319` controls a Playwright browser; it does not start Jellyfin or change saved Custom CSS. Authentication stays in memory. The companion command previews the browser payload; only installing the real plugin tests server-side injection. Use `node scripts/browser-command.mjs disable-companion` to test CSS-only fallback.

Local item IDs belong in ignored `.local/instance.json`. Keep authentication files, credentials, private logo previews, reference screenshots, and cloned reference repositories out of public commits. Use Playwright for rendered-page verification at 1920×1080, 1440×900, and 390×844. Public screenshots must use a permitted test library.

Keep technical test reports in ignored `.local/verification/` storage.

## Shared UI coverage

The [component coverage matrix](UI-COVERAGE.md) separates live audit selectors from synthetic fixtures and conditional surfaces. `test:ui` renders stable Legacy/MUI class families at three viewport sizes and writes screenshots and measurements to ignored `test-results/ui/`. Fixtures use small structural scaffolds rather than a live Jellyfin server; destructive and credential actions are never submitted.

`test:dashboard` exercises authenticated administrator detection, direct routes, base URLs, native CSS precedence, preference changes, duplicate payloads, stale results, sign-out, and stylesheet failure. The loader reads only Jellyfin's existing local Custom CSS preferences, and uses the authenticated API client for plugin settings and branding.

`npm run test:dashboard-layout` checks the full native header/spacer/sidebar shell at 1440×900, 1920×1080, 2560×1440, 3440×1440, 3840×2160, and 390×844. Geometry assertions cover page and inner-form width, header clearance, native overview grids, plugin settings, table pagination, Metadata Manager panes, resizing, and post-import spacing overrides. User Settings and dialogs retain independent sizing. Results are written to ignored `test-results/dashboard-layout/`.

`npm run test:polish` checks field-group widths, compact native controls, spacious exceptions, label/help alignment, favorite state transitions, hover/focus colors, and short/scrolling confirmations at the same six resolutions. Shared prompt fixtures cover restart, shutdown, delete, uninstall, restore, refresh, scan, scheduled tasks and playback errors without attaching server operations. Results are kept in ignored `test-results/polish/`.

For a temporary Dashboard preview, use `node scripts/browser-command.mjs dashboard-preview` after signing in. This substitutes the local candidate stylesheet in the browser's branding response only; it does not edit saved CSS or install a plugin. Restore the native client with `disable-companion` or close the temporary browser.

## Release process

The [GitHub Actions workflow](../.github/workflows/release.yml) validates pushes to `main`, pull requests, and semantic version tags such as `v1.0.0`. Only a tag publishes a release; the tagged commit must be on `main` and the tag must match npm and plugin versions.

Before tagging, review and include the generated CSS, browser payload, and customization table with the source. CI uses Node 22 and .NET 10 to rebuild, run static/plugin/browser checks, verify deterministic output and ZIP checksum, and reject drift in the tagged generated files. It publishes the tested CSS, plugin ZIP, and `manifest.json` as GitHub release assets; the catalog version and URLs come from the release version.

Add a dated section to [CHANGELOG.md](../CHANGELOG.md) for each release using `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`, with concise highlights and optional Added/Changed/Fixed headings. Keep previous sections intact and move completed items out of Unreleased. Builds use the matching section for the plugin catalog; release notes combine it with GitHub-generated notes and one comparison link. The previous tag is the highest earlier published stable release reachable from the new tag; the first release links to its commit history.

Push `main` and wait for validation to pass before pushing the reviewed annotated release tag. Published releases and existing drafts are never overwritten by the workflow.

If a release run fails without creating a release, use the workflow's **Run workflow** option on `main` with the existing tag. This rebuilds and tests that tagged source with the current workflow; it does not move the tag. Release-note generation runs in the publish job because GitHub requires write access for that API.

The workflow does not create tags or push source changes. Publishing requires a reviewed version-tag push. CDN `@latest` can lag the GitHub release, so test the [compatibility fallback and version pinning](SETUP.md#versions-and-cdn-caching) during rollout.
