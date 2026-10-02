# Changelog

Changes for each NoirGlass release are recorded here. GitHub release notes include the matching section and a link to the release's commit history.

## [Unreleased]

## [1.2.0] - 2026-10-02

### Added

- Configurable featured-title count with a default of ten, periodic lineup replacement, and administrator Rotate Now.
- Optional Home links for Collections and authorized libraries, plus a setting to hide Web branding.
- Global glass opacity, optional detail badges, and expanded source/track format labels.

### Changed

- New autoplay configurations default to ten seconds; saved intervals remain unchanged.
- Compact glass track selectors with a shared format-badge strip.

### Fixed

- State-aware Play/Pause icons, viewport-scaled Home artwork, and mobile glass navigation.
- Login splash visibility, continuous dialog surfaces, page backgrounds, and Dashboard brand spacing.
- Contained mobile task tables, long repository URLs, narrow profile rows and short-screen player docks.

## [1.1.2] - 2026-10-02

### Fixed

- Narrowed ordinary field groups across Dashboard, Settings, login and editors while preserving full-width pages, Search, multiline editors and track selectors.
- Replaced favorite glyphs with white outline hearts and filled red hearts that follow native favorite state, including hover and keyboard focus.
- Centered compact Legacy confirmations on mobile, removed their inset header strip and kept long content scrolling above reachable buttons.
- Added field, favorite and confirmation checks through ultrawide and 4K resolutions, with configurable field sizing and favorite color.

## [1.1.1] - 2026-10-02

### Fixed

- Dashboard pages now use the available desktop width instead of a narrow form column, including overview panels, tables, plugin cards, and plugin settings.
- Restored clearance below the Dashboard header and removed borders that changed its native height.
- Added desktop-first page gutters with mobile adaptations while preserving user Settings and dialog widths.
- Added full Dashboard shell geometry checks through ultrawide and 4K resolutions.

## [1.1.0] - 2026-10-01

### Added

- Shared glass controls, dialogs, editors, user Settings, and compact Dashboard panels, tables, menus, and pickers.
- Optional administrator Dashboard styling with native server/per-user Custom CSS precedence and a default-on Theme Dashboard setting.
- Component and Dashboard-loader browser fixtures for accessibility states, responsive layouts, failure handling, and route cleanup.

### Changed

- Extended browsing lists and alternate artwork views, playback menus and statistics, and documented customization tokens for forms and administration.

## [1.0.0] - 2026-09-30

### Added

- Cinematic Jellyfin Web theme with translucent navigation, spacious artwork, and refined Library, Search, detail, episode, login, and native player controls.
- Single CSS import with embedded Inter fonts and original icons, responsive Legacy layouts, and accessible focus states.
- Optional Jellyfin plugin with a five-title featured Home carousel, pinned titles, native Play/Details actions, and keyboard/touch navigation.
- Configurable autoplay with a 15-second default, smooth transitions, Pause/Resume, and automatic pauses for focus, hover, hidden content, and reduced motion.
- Source-confirmed format badges that follow selected media sources and tracks while preserving native controls.
- A complete customization guide with documented variables and three practical examples.
- Automated, tested release assets and version-specific release notes.
