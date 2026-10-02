# Interface coverage

This reference explains which parts of Jellyfin Web NoirGlass styles and how those styles are checked. It is intended for contributors investigating a visual issue; for installation, use [the README](../README.md).

NoirGlass changes presentation while keeping Jellyfin's labels, navigation, playback, focus handling, and action handlers. Tests target stable Legacy and MUI classes. MUI is the component library used by Jellyfin's React administration pages; generated styling class names are avoided.

## What the evidence means

- **Live inspection** opens a real Jellyfin page to establish its markup, layout, and available controls.
- **Browser fixtures** reproduce component markup locally so selected, disabled, error, long-label, and confirmation states can be checked safely.
- **Server tests** check plugin injection, configuration, authentication, and permissions separately from appearance.

A styled confirmation does not prove that a restart, delete, or restore operation was performed. Consequential operations and credential forms are tested without submitting them. Actual Legacy mobile mode is checked separately from a narrow desktop or fixture viewport.

## Areas covered

| Area | Main surfaces |
| --- | --- |
| Sign-in and navigation | Login, recovery, Quick Connect, header, drawer, tabs, and account menus. |
| Browsing | Home, Library views, Search, filters, sort menus, poster actions, and empty results. |
| Details and editing | Movie/series/season/episode/person pages, track controls, badges, metadata, images, subtitles, and pickers. |
| User Settings | Profile, Display, Home, Playback, Subtitles, and input preferences. |
| Dashboard | Forms, cards, tables, users, libraries, devices, plugin pages, tasks, and Metadata Manager. |
| Playback | Transport controls, timeline, nested menus, statistics, and conditional next-video/error surfaces. |
| Conditional content | Music, books, photos, Live TV, Cast, SyncPlay, and populated collections use shared fixtures where no live example is available. |

<details>
<summary>Detailed component selectors and evidence</summary>

| Component family | Stable selectors | Live audit capture | Browser fixture / assertion | Result |
| --- | --- | --- | --- | --- |
| Login and recovery fields | `.emby-input`, `.emby-checkbox`, `.button-submit` | `public-login`, `password-recovery` | `legacy-forms`: entry, checked, disabled, invalid, focus | Live selectors / fixtures passed |
| Quick Connect and recovery dialogs | `.formDialog`, `.formDialogFooter` | `quick-connect`, `quick-connect-styles` | `editor`: panel and footer bounds | Live selectors / fixtures passed |
| React server/user links | `.MuiAppBar-root`, `.MuiIconButton-root`, `.MuiMenuItem-root` | `admin-user-menu`, `public-login` | `navigation-panels`, `mui-dialog`: targets and states | Live selectors / fixtures passed |
| Header, drawer and active destinations | `.mainDrawer`, `.navMenuOption`, `.MuiDrawer-paper`, `.MuiListItemButton-root` | `drawer-desktop`, `mobile-drawer`, `dashboard-home` | `navigation-panels`: selection and focus; existing carousel suite retains header behavior | Live selectors / fixtures passed |
| Home carousel and shelves | `.ng-feature`, `.scrollSlider`, `.card` | `home-desktop`, `home-1920`, `mobile-home` | `test:companion`, `test:autoplay`: fallback, touch, pauses and cleanup | Live selectors / fixtures passed |
| Movies/TV/Favorites/Genres/Collections | `.emby-tab-button`, `.alphaPickerButton`, `.itemsContainer` | `library-movies-top`, `library-tv-shows`, `movies-tab-collections`, `tv-tab-genres` | Six Library view families at each viewport | Live selectors / fixtures passed |
| Toolbar, sort and view menus | `.btnSelectView`, `.btnSort`, `.actionSheetMenuItem` | `library-sort`, `library-view`, `library-view-bottom` | `action-sheet`: selected, disabled, long label, focus | Live selectors / fixtures passed |
| Filter accordions and view settings | `.filterDialog`, `.emby-collapsible-button`, `.emby-select` | `library-filter`, `folder-view-settings`, `mobile-library-filter` | `filter`: expansion and field bounds | Live selectors / fixtures passed |
| Banner/List/Poster/Poster Card/Thumb/Thumb Card | `.bannerCard`, `.listItem`, `.portraitCard`, `.backdropCard`, `.cardWithText` | `library-view` (choices inventoried) | Six structural layouts; document overflow assertions | Live selectors / fixtures passed |
| Poster/bulk menu entries | `.actionSheet`, `.selectionCommandsPanel` | `poster-more`, `library-bulk-actions`, `library-bulk-selection` | `action-sheet`, `conditional`: menus and selection surface | Live selectors / fixtures passed |
| Movies/series/seasons/people | `.trackSelections`, `.mainDetailButtons`, `.personCard` | `movie-details-top`, `series-details`, `person-details` | Existing detail/badge suite plus shared form selectors | Live selectors / fixtures passed |
| Episodes and track menus | `.listItem-largeImage`, `.actionSheetMenuItem`, `.detailTrackSelect` | `season-episodes-bottom`, `episode-more`, `player-audio` | Existing episode CSS, `action-sheet`: long track labels | Live selectors / fixtures passed |
| Metadata locks and Identify/Refresh | `.formDialogContent`, `.inputContainer`, `.checkboxOutline` | `item-edit-metadata`, `item-identify`, `item-refresh-metadata` | `editor`: scroll, expansion, fixed footer | Live selectors / fixtures passed |
| Image/subtitle management | `.imageCard`, `.subtitleEditorDialog`, `.emby-button` | `item-edit-images`, `item-edit-subtitles` | `media-managers`: shared fields and actions | Live selectors / fixtures passed |
| Collections/playlists/media information | `.formDialog`, `.emby-input`, `.btnCopy` | `new-collection`, `item-add-to-playlist`, `item-media-info` | `media-managers`: form/action surfaces; no submission | Live selectors / fixtures passed |
| Directory and nested pickers | `.directoryPicker`, `.formDialog`, `.MuiDialog-paper` | `admin-folder-picker`, `item-identify` | `media-managers`, `action-sheet`: nested confirmation | Live selectors / fixtures passed |
| User Settings hub and forms | `.userPreferencesPage`, `.content-primary`, `.listItem` | `settings-profile-top`, `settings-display-top`, `settings-home-top` | `legacy-forms`: compact controls and widths | Live selectors / fixtures passed |
| Playback/subtitle/Controls preferences | `.emby-select`, `.mdl-slider`, `input[type=color]` | `settings-playback-top`, `settings-subtitles-fields`, `settings-controls-top` | `legacy-forms`, `player-surfaces`: subtitle isolation | Live selectors / fixtures passed |
| General/Branding/Networking/Transcoding | `.MuiInputBase-root`, `.MuiFormLabel-root`, `.emby-input` | `admin-general-top`, `admin-branding-top`, `admin-networking-top`, `admin-transcoding-top` | `mui-forms`: fields, errors, disabled states | Live selectors / fixtures passed |
| Display/Metadata/NFO/Resume/Streaming/Trickplay | `.MuiSelect-root`, `.MuiCheckbox-root`, `.MuiAccordion-root` | corresponding `admin-*-top` captures | `mui-forms`, `navigation-panels`: compact panels | Live selectors / fixtures passed |
| Users and Profile/Access/Parental/Password | `.MuiTab-root`, `.MuiCard-root`, `.checkboxContainer` | `admin-users-top`, `admin-user-profile`, `admin-user-access`, `admin-user-parental-control`, `admin-user-password` | `navigation-panels`, `legacy-forms`: tabs, cards, fields | Live selectors / fixtures passed |
| Libraries and device editors | `.MuiCardActionArea-root`, `.MuiIconButton-root`, `.directoryPicker` | `admin-libraries-top`, `admin-library-actions`, `admin-device-edit` | `navigation-panels`, `media-managers` | Live selectors / fixtures passed |
| Devices/Activity/API Keys tables | `.MuiTableContainer-root`, `.MuiTableCell-root`, `.MuiTablePagination-toolbar` | `admin-devices-top`, `admin-activity-top`, `admin-api-keys-top` | `table`: local horizontal scrolling, row size and actions | Live selectors / fixtures passed |
| Table filters/columns/density/date pickers | `.MuiMenuItem-root`, `.MuiPickersPopper-paper`, `.MuiPickersDay-root` | `admin-table-column-actions`, `admin-table-show-hide-columns`, `admin-date-picker` | `mui-dialog`, `picker-tree`: menus and selected days | Live selectors / fixtures passed |
| Live TV/DVR tuner and provider forms | `.MuiInputBase-root`, `.formDialog`, `.emby-select` | `admin-live-tv-top`, `admin-dvr-top`, `admin-tuner` | `mui-forms`, `media-managers`: configured recordings remain conditional | Live selectors / fixtures passed |
| Plugin catalog/details/repositories/settings | `.MuiChip-root`, `.MuiAccordion-root`, `.pluginConfigurationPage` | `admin-plugins-loaded`, `admin-plugin-detail`, `admin-add-repository`, `admin-noirglass-settings` | `mui-forms`, `mui-dialog`; Dashboard direct configuration route | Live selectors / fixtures passed |
| Backups/Logs/Tasks and triggers | `.MuiListItemButton-root`, `.MuiDialog-paper`, `.MuiSelect-root` | `admin-backups-top`, `admin-logs-top`, `admin-task-detail`, `admin-task-trigger` | `navigation-panels`, `mui-dialog`; no backup or task execution | Live selectors / fixtures passed |
| Metadata Manager tree/editor | `.jstree-anchor`, `.jstree-clicked`, `.content-primary` | `metadata-manager`, `metadata-manager-editor` | `picker-tree`, `editor`; Dashboard direct metadata route | Live selectors / fixtures passed |
| Playback menus and statistics | `.actionSheet`, `.playerStats`, `.playerStats-content` | `player-settings`, `player-audio`, `player-subtitles`, `player-stats` | `action-sheet`, `player-surfaces`: wrapping and bounds | Live selectors / fixtures passed |
| Next video/skip segments/errors | `.upNextContainer`, `.btnSkipIntro`, `.MuiAlert-root`, `.formDialog` | Conditional on playback/media | `player-surfaces`, `conditional`: error/next/skip surfaces | Shared fixture passed |
| Switches/radios/chips/sliders/indeterminate | `.MuiSwitch-switchBase`, `.MuiRadio-root`, `.MuiChip-root`, `.MuiSlider-root`, `.MuiCheckbox-indeterminate` | Dashboard and user Settings families | `mui-forms`: selected/indeterminate and type guidance | Live selectors / fixtures passed |
| Autocomplete/loading/status/help | `.MuiAutocomplete-paper`, `.MuiAutocomplete-option`, `.MuiSkeleton-root`, `.MuiSnackbarContent-root`, `.MuiTooltip-tooltip` | Conditional shared MUI components | `autocomplete-status`: source-backed structural fixture | Shared fixture passed |
| Empty playlists/recordings/media results | `.noItemsMessage`, `.emptyMessage`, `.MuiAlert-root` | `home-favorites`, `search-empty` | `conditional`: empty and notification surfaces | Live selectors / fixtures passed |
| Music queues/books/photos/populated collections | `.listItem`, `.cardBox`, `.actionSheet`, `.formDialog` | No populated example on this server | Shared structural fixtures only; application-specific readers/queues require their own runtime example | Shared fixture passed |
| Remote Cast/SyncPlay/server selection | `.actionSheet`, `.MuiMenuItem-root`, `.MuiDialog-paper` | `cast-desktop`, `syncplay-desktop`, `mobile-syncplay` | `conditional`: populated menu rows only; no connection/group creation | Live selectors / fixtures passed |
| Save/delete/authorize/install/API-key confirmations | `.formDialog`, `.MuiDialog-paper`, `.button-delete` | Controls inventoried without activation | `conditional`, `mui-dialog`: synthetic confirmations; no credentials or mutations | Live selectors / fixtures passed |

</details>

The capture names in the detailed table refer to private local audit records, not downloadable screenshots. **Live selectors / fixtures passed** means the native component was identified and its presentation assertions passed; it does not mean every action was executed. **Shared fixture passed** denotes structural test coverage without a populated live example.

Fixture structure is based on [Jellyfin elements](https://github.com/jellyfin/jellyfin-web/tree/master/src/elements), [shared components](https://github.com/jellyfin/jellyfin-web/tree/master/src/components), and [Dashboard source](https://github.com/jellyfin/jellyfin-web/tree/master/src/apps/dashboard).

## Responsive checks

[The viewport matrix](../scripts/viewports.mjs) covers twelve 16:9 resolutions from 480p to 4K before ten alternate-aspect and mobile layouts. Responsive checks measure control positions, usable touch targets, header clearance, and page overflow. Shelves and wide tables may scroll inside their containers.

The shared UI suite runs at 1920×1080, 1440×900, and 390×844. Full Dashboard and responsive suites use the wider matrix; polish tests focus on six desktop/mobile sizes.

<details>
<summary>Dashboard geometry assertions</summary>

| Family | Geometry checked |
| --- | --- |
| React and plugin configuration forms | Full available width, uncapped inner forms, desktop/mobile gutters, header clearance |
| Overview and plugin cards | Native grid margins, readable columns, available page width |
| Devices and Activity-style tables | Contained horizontal scrolling and reachable pagination |
| Metadata Manager | Native desktop split; mobile tree and editor states; clearance in both panes |
| Header and resize transitions | Native toolbar/spacer alignment, tabbed header height, responsive spacing |
| Independent surfaces | User Settings and portaled dialog sizing; post-import spacing overrides |

</details>

## Dashboard and plugin behavior

The Dashboard suite checks administrator-only activation, direct routes, CSS precedence, disabled preferences, compatibility, duplicate loading, failed requests, route exit, and sign-out. It follows [Jellyfin's Custom CSS order](https://github.com/jellyfin/jellyfin-web/blob/master/src/components/CustomCss.tsx).

Home suites check autoplay, configured title counts, pins, permission-filtered links, lineup replacement, interaction pauses, reduced motion, and native fallback. Format tests check selected-stream metadata and explicit source labels without guessing missing formats.

## Fields, favorites, and dialogs

Polish fixtures check that ordinary fields narrow with their labels and help text while Search, multiline editors, and track controls remain spacious. Favorite hearts follow Jellyfin's state and retain their color during hover or keyboard focus.

Confirmation fixtures cover restart, shutdown, delete, uninstall, restore, refresh, scans, scheduled tasks, and playback errors. Tests open or reproduce these surfaces and verify alignment, scrolling, buttons, and cancellation; they do not execute the server operation. Larger editors have separate sizing checks.

Browser and operating-system file choosers, sharing sheets, and native select popups remain native.

## Reproduce a check

Use [Development](DEVELOPMENT.md#check-your-change) to install prerequisites and run the appropriate suite. Fixture screenshots and measurements are written to ignored `test-results/` folders.

For real-page inspection, follow [the temporary preview instructions](DEVELOPMENT.md#preview-on-an-existing-jellyfin-server). Candidate CSS and browser scripts can be injected without changing saved CSS. Backend integration still requires installing the candidate plugin and restarting a test server.

Keep private audit captures, account/server details, and technical reports under ignored `.local/` storage. Publish only inspected screenshots from a permitted test library.
