# UI coverage

NoirGlass styles native controls without replacing their labels, routing, focus management, or submission handlers. The component fixtures use stable classes from the Legacy UI audit and [Jellyfin elements](https://github.com/jellyfin/jellyfin-web/tree/master/src/elements), [shared components](https://github.com/jellyfin/jellyfin-web/tree/master/src/components), and [Dashboard source](https://github.com/jellyfin/jellyfin-web/tree/master/src/apps/dashboard). Generated Emotion class names are excluded.

The local audit contains 163 captures across 55 route variants, including 15 actual Mobile (Legacy) captures and all 21 core Dashboard destinations. Those captures establish which native elements exist; they are not a claim that every server operation was exercised. Administration images and account/server details stay in ignored storage.

## Component matrix

[UI fixtures](../scripts/ui-fixtures.mjs) and [assertions](../scripts/test-ui.mjs) cover the families below; `test:ui` runs them at 1920×1080, 1440×900, and 390×844. Its mobile fixtures use the mobile class and touch input; actual Legacy display modes are checked separately in the live preview. Named live captures are local audit evidence, not public screenshots.

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

## Dashboard loader

`test:dashboard` verifies direct Dashboard, Metadata Manager, and plugin settings loads; administrator-only activation; CSS server/user order; disabled server CSS; user-only imports; pasted CSS; anonymous/non-admin/disabled/unconfigured fallbacks; base URLs; duplicates; route exit; sign-out; destruction; stale requests and client replacement; local preference changes; failed imports; and stylesheet compatibility. It follows [Jellyfin's Custom CSS order](https://github.com/jellyfin/jellyfin-web/blob/master/src/components/CustomCss.tsx) and reads the two local preferences used by [userSettings](https://github.com/jellyfin/jellyfin-web/blob/master/src/scripts/settings/userSettings.js).

## Dashboard layout

[Full-shell fixtures](../scripts/test-dashboard-layout.mjs) reproduce the inspected native toolbar, independent header spacer, sidebar offsets, capped page/form wrappers, and overview grid margins. `test:dashboard-layout` checks 60 geometry states across 1440×900, 1920×1080, 2560×1440, 3440×1440, 3840×2160, and 390×844, including resizing without navigation. Assertions measure actual field width and header clearance rather than relying only on document overflow.

| Family | Geometry checked |
| --- | --- |
| React and plugin configuration forms | Full available width, uncapped inner forms, desktop/mobile gutters, header clearance |
| Overview and plugin cards | Native grid margins, readable columns, available page width |
| Devices and Activity-style tables | Contained horizontal scrolling and reachable pagination |
| Metadata Manager | Native desktop split; mobile tree and editor states; clearance in both panes |
| Header and resize transitions | Native toolbar/spacer alignment, tabbed header height, responsive spacing |
| Independent surfaces | User Settings and portaled dialog sizing; post-import spacing overrides |

## Verification artifacts

The Dashboard layout preview passed 62 live states: all 21 core destinations at 2560px; Overview, General, Devices, Plugins, plugin settings, and Metadata Manager at all six fixture resolutions; and five desktop resizes without navigation. Actual Desktop and Mobile Legacy modes were used. Checks required loaded content, available page/form width, header clearance, reachable table footers, native tree/editor behavior, and no document overflow. CSS was substituted temporarily; saved settings and server configuration were unchanged.

The candidate was temporarily previewed in 61 live states, including all 21 core Dashboard routes at 1440px, native Desktop/Mobile Legacy Settings, menus, details, episodes, and Home at 1920px/390px, and eight media editing dialogs in both modes. No document overflow was found in those states. Native desktop and mobile playback, seeking, and audio/subtitle menus also passed. Dashboard preview used the candidate browser payload and in-memory branding substitution; the rebuilt server plugin was not installed during this pass.

`test-results/ui/coverage.json` records each executed fixture, viewport, selector family, audit capture name, and result. Screenshots and live candidate measurements are kept locally for review. Fixture assertions validate presentation and small synthetic interactions; they do not establish successful playback, server administration, credential creation, or plugin installation. Browser/OS-owned file choosers, share sheets, and select popups stay native.
