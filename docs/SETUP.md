# Setup

NoirGlass includes a standalone CSS theme and an optional plugin for Jellyfin Server/Web 12.1 Legacy modes. Start with the [README](../README.md). The CSS works without the plugin; the plugin requires the CSS for its carousel.

## CSS installation

Use the import from the README in **Dashboard → Branding → Custom CSS** (server-wide) or **Settings → Display → Custom CSS** (per-user). Choose one location, select **Dark** and a **Legacy** display mode, and remove conflicting theme imports. Enable detail backdrops and supply library artwork for cinematic detail pages.

Fonts and icons are embedded. Back up your previous Custom CSS first.

## Plugin catalog

Add this URL under **Dashboard → Plugins → Catalog → Repositories**:

```text
https://github.com/iammarxg/NoirGlass/releases/latest/download/manifest.json
```

Install NoirGlass and restart Jellyfin. An administrator installs it once for signed-in Legacy Web users. Each user's featured items come from media that account can access. The plugin stores no credentials, tokens, or library responses and needs no separate script injector or userscript.

## Plugin settings

Open **Dashboard → Plugins → NoirGlass**, save changes, then refresh Web.

| Setting | Behavior |
| --- | --- |
| Enable | On by default for signed-in Legacy Web users. Disabling restores native Home after refresh. |
| Pinned titles | Up to five movie/series IDs, one per line, in order. Inaccessible or unsuitable items are skipped; recent eligible titles fill remaining slots. |
| Autoplay interval | 15 seconds by default; 5–60 seconds when enabled; 0 disables autoplay. |

Autoplay needs at least two featured items. It pauses on hover, keyboard focus, hidden/off-screen content, and reduced-motion preference. Manual navigation resets the timer. Pause/Resume applies to the current tab until refresh. Artwork and text slide together over 650 ms; reduced motion makes manual transitions instant.

Format badges describe the selected source file and tracks, not guaranteed browser playback quality. Native Play, Details, and track-selection controls remain Jellyfin-owned. Missing metadata, an unavailable script, or incompatible CSS leaves native shelves usable.

## Versions and CDN caching

The README import uses jsDelivr's `@latest` alias. CDN caches may delay an update; for a fixed release, replace `latest` with a released Git tag in that URL, keeping the `@` prefix. The catalog URL follows the latest GitHub release.

Keep the theme and plugin on compatible versions. The plugin checks the CSS compatibility marker and falls back to native Home when it does not match; do not override that marker. Release packages target Jellyfin **12.1**.

## Removal

Delete the CSS import or pasted stylesheet and refresh. Disable or uninstall NoirGlass under **Dashboard → Plugins**, then restart to stop script injection. Library media and metadata are unaffected; retain saved configuration if you plan to reinstall.
