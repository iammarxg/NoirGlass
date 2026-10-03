# Setup and troubleshooting

This guide explains how to install NoirGlass and configure its optional features. If you only want the visual theme, start with [CSS installation](#install-the-css-theme). The plugin adds the featured Home carousel, format badges, Desktop sign-in branding, and Dashboard styling; it does not replace the CSS theme.

## Before you start

Use Jellyfin Server/Web **12.1**, the **Dark** theme, and **Desktop (Legacy)** or **Mobile (Legacy)** under **Settings → Display**. An administrator can install the theme for everyone and install the plugin. Other users can install the CSS for their own account.

Copy your existing Custom CSS somewhere safe before replacing it. Remove other full-theme imports to avoid conflicting styles. Enable detail backdrops in Display settings and add artwork to your library for cinematic detail pages.

## Install the CSS theme

1. Copy the import line from [the README](../README.md#install-the-theme).
2. Open **Dashboard → Branding → Custom CSS** for a server-wide installation, or **Settings → Display → Custom CSS** for just your account.
3. Paste the import, save, and refresh Jellyfin Web.

Choose one location. An import tells the browser to load a stylesheet from its URL; the NoirGlass stylesheet includes its fonts and icons. No server restart is needed for CSS changes.

## Install the optional plugin

These steps require an administrator account:

1. Open **Dashboard → Plugins → Catalog → Repositories** and add a repository.
2. Give it the name **NoirGlass** and enter this URL:

   ```text
   https://github.com/iammarxg/NoirGlass/releases/latest/download/manifest.json
   ```

3. Save the repository, return to the catalog, and install **NoirGlass**.
4. Restart Jellyfin, then refresh Jellyfin Web.

A catalog is the list Jellyfin uses to discover and update plugins. Install the plugin once on the server; its enhancements apply to signed-in Legacy Web users who have compatible NoirGlass CSS. Each account sees only media it can access. No separate userscript or script injector is needed.

## Plugin settings

Open **Dashboard → Plugins → NoirGlass**, adjust the settings, and select **Save**. Active Home pages check for changes within a minute.

| Setting | Default | What to choose |
| --- | --- | --- |
| Enable NoirGlass enhancements | On | Turn off to restore native Home and stop plugin enhancements. |
| Theme Dashboard | On | Applies your configured NoirGlass CSS to administration pages; requires enhancements to be enabled. |
| Featured title count | 10 | Enter a positive whole number; the carousel shows fewer titles if there are not enough eligible items. |
| Pinned item IDs | Empty | Put one movie or series ID per line, in the order you want; accessible pins appear before automatic choices. |
| Slide interval (seconds) | 10 for new configurations | Use 5–60 seconds, or 0 to turn off automatic slide changes; an existing saved interval is retained. |
| Replace automatic titles every (minutes) | 360 | Replaces the unpinned lineup every six hours; enter another positive whole number of minutes or 0 to disable replacement. |
| Rotate now | Manual action | Requests a fresh automatic lineup using saved settings; open Home pages update within a minute when idle. |
| Hide Jellyfin branding | Off | Hides Web logos and branding wordmarks, including login; preserves server names, the favicon, and important settings text. |
| Add Home navigation links | Off | Adds ordered shortcuts to Collections or libraries, with optional custom labels. |

Changing the displayed slide is different from replacing the lineup: the slide interval moves through the current titles, while lineup replacement chooses different automatic titles. Pins stay first during replacement.

### Pin a favorite title

1. Open a movie or series detail page in Jellyfin Web.
2. Find the `id=` parameter in the browser URL and copy only its value, excluding any following `&` parameters.
3. Paste the ID into **Pinned item IDs**, one per line, then save.

Use movie or series IDs, not library IDs. Inaccessible titles and items without suitable metadata/artwork are skipped; automatic choices fill the remaining slots.

### Add library shortcuts

1. Enable **Add Home navigation links**.
2. Choose **Collections** or a library under **Library or collection destination**, then select **Add link**.
3. Optionally enter a display label. Use **Move up**, **Move down**, or **Remove** to adjust the list, then save.

Enabled shortcuts share one glass navigation capsule with Home and Favorites. Longer lists scroll inside it. A shortcut does not grant library access: each account sees only libraries it is already allowed to open.

### Carousel behavior and badges

Autoplay requires at least two featured titles. It pauses while you hover, focus a control with the keyboard, hide the browser tab, or scroll the carousel out of view. Reduced-motion preferences also pause autoplay and remove slide animations. Use the arrows or dots to change titles manually and reset the slide timer. Set the slide interval to 0 to disable autoplay. New lineups wait while the carousel is being used.

A format badge is a small label such as 4K or Dolby TrueHD. It describes selected-stream metadata or an explicit source label in a filename, title, or Jellyfin tag. Hover a badge to see its evidence. Source labels do not certify mastering formats, and badges do not guarantee that a browser can play the source format directly.

## Dashboard styling

Jellyfin does not normally load Custom CSS in Dashboard. NoirGlass's plugin supplies it when **Theme Dashboard** is enabled, including direct Dashboard, Metadata Manager, and plugin settings pages.

Server Custom CSS is applied first, then the user's Display Custom CSS. The plugin respects **Disable server-provided custom CSS** and removes its own Dashboard styles when you leave administration or sign out. It does not edit your saved CSS.

## Versions and CDN caching

The CSS import uses `@latest` to follow releases. A content delivery network (CDN) stores cached copies of files, so a theme update may reach browsers later than the GitHub release.

If an update still shows old styling, open [jsDelivr's purge tool](https://www.jsdelivr.com/tools/purge), enter the CSS URL from your import, and complete the purge. Then reload Jellyfin with the browser cache cleared. You can keep your existing `@latest` import; purging does not change saved Jellyfin settings.

For a fixed release, replace `latest` in the import URL with a released Git tag, keeping the `@` prefix. The [release list](https://github.com/iammarxg/NoirGlass/releases) shows available tags. The plugin catalog URL follows the latest GitHub release.

Keep the theme and plugin on compatible releases. Their internal CSS markers let the plugin check compatibility; leave those markers unchanged. If compatible CSS is unavailable, native Home and administration remain usable.

## Troubleshooting

| What you see | What to check |
| --- | --- |
| The theme has not appeared | Save the import, refresh, and confirm Dark and a Legacy mode; check whether the browser can load the CSS URL. |
| The theme looks inconsistent | Remove other theme imports and check both server Branding CSS and your Display CSS for conflicting overrides. |
| The carousel or badges are missing | Install the plugin, restart Jellyfin, keep the CSS import, and enable enhancements; featured items also need suitable artwork and metadata. |
| Dashboard is not themed | Use an administrator account and enable Theme Dashboard; check whether Display preferences disable server CSS. |
| Slides are not changing automatically | Check the interval, reduced-motion preference, keyboard focus, pointer position, and whether at least two titles are available. |
| A pin, link, or badge is missing | Check item IDs, library permissions, artwork, and selected-stream metadata; a badge is omitted when its evidence is unavailable. |
| An update still looks unchanged | Refresh browser caches and check CDN caching; pin the intended released tag if you need a specific CSS release. |

## Update or remove

To update the plugin, install the available update from Jellyfin's plugin catalog and restart Jellyfin. Refresh Web afterward. CSS using `@latest` follows releases; a pinned CSS import must be changed manually when you choose to update it.

To remove the theme, delete its import and overrides, save, and refresh. To stop plugin enhancements temporarily, disable them and save. To remove the plugin completely, uninstall it under **Dashboard → Plugins** and restart Jellyfin. Neither step deletes library media or metadata.

For appearance changes, see [Customization](CUSTOMIZATION.md). For source builds and tests, see [Development](DEVELOPMENT.md).
