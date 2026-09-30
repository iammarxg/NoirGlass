# NoirGlass

NoirGlass is a cinematic Jellyfin Web theme inspired by Apple TV, with spacious artwork, translucent controls, and a single CSS import. An optional server plugin adds a featured Home carousel and format badges.

- **CSS theme:** responsive navigation, Search, Library, details, episodes, login, and native player controls.
- **Optional plugin:** up to five accessible featured titles, smooth autoplay, and keyboard/touch navigation.
- **Optional plugin:** source-confirmed format badges, without promising the quality delivered to your browser.

<details>
<summary>Screenshots</summary>

Desktop and mobile previews from a Jellyfin library.

| View | Desktop | Mobile |
| --- | --- | --- |
| Home | ![Home on desktop](docs/images/desktop-feature.png) | ![Home on mobile](docs/images/mobile-feature.png) |
| Navigation | ![Navigation on desktop](docs/images/desktop-navigation.png) | ![Navigation on mobile](docs/images/mobile-navigation.png) |
| Details | ![Details on desktop](docs/images/desktop-detail.png) | ![Details on mobile](docs/images/mobile-detail.png) |
| Library | ![Library on desktop](docs/images/desktop-library.png) | ![Library on mobile](docs/images/mobile-library.png) |
| Search | ![Search on desktop](docs/images/desktop-search-results.png) | ![Search on mobile](docs/images/mobile-search-results.png) |
| Episodes | ![Episodes on desktop](docs/images/desktop-episodes.png) | ![Episodes on mobile](docs/images/mobile-episodes.png) |
| Login | ![Login on desktop](docs/images/login-desktop.png) | ![Login on mobile](docs/images/login-mobile.png) |

</details>

## Install

Choose Jellyfin's **Dark** theme and a **Legacy** display mode. Remove other full-theme imports, then paste:

```css
@import url("https://cdn.jsdelivr.net/gh/iammarxg/NoirGlass@latest/dist/noirglass.min.css");
```

Use **Dashboard → Branding → Custom CSS** for everyone, or **Settings → Display → Custom CSS** for one user. Choose one location.

For the optional plugin, add this repository under **Dashboard → Plugins → Catalog → Repositories**, install NoirGlass, and **restart Jellyfin**:

```text
https://github.com/iammarxg/NoirGlass/releases/latest/download/manifest.json
```

Under **Dashboard → Plugins → NoirGlass**, enable or disable the enhancement, pin up to five title IDs, and set autoplay: **15 seconds** by default, **5–60 seconds**, or **0** to disable. Save and refresh Web. Autoplay pauses on hover, focus, hidden/off-screen content, and reduced motion; Pause/Resume controls the current tab.

See [setup guide](docs/SETUP.md) for plugin settings and installation details.

See the [changelog](CHANGELOG.md) for release highlights.

## Customize or remove

Add overrides after the import:

```css
:root {
  --ng-card-gap: 32px;
  --ng-nav-glass: #18181bd9;
}
```

See [all variables and responsive overrides](docs/CUSTOMIZATION.md). To remove the theme, delete the import or pasted CSS and refresh. Uninstall the optional plugin and restart Jellyfin to remove its enhancements.

## Compatibility

Tested on Jellyfin 12.1. Use Desktop (Legacy) or Mobile (Legacy).

## License

[MIT](LICENSE) © Ammar Alghamdi. Bundled Inter uses the [SIL Open Font License](assets/fonts/OFL.txt). Inspired by Apple TV; no affiliation or endorsement by Apple, Dolby, or Jellyfin. No proprietary artwork, logos, or fonts are bundled.
