# Customize NoirGlass

CSS variables are named settings for colors, spacing, and sizing. NoirGlass variables start with `--ng-`; you can override them without editing the theme itself.

## Where to put your changes

1. Install the theme using [the README](../README.md#install-the-theme).
2. Open the same Custom CSS field where you placed the import.
3. Paste a scenario below **after the import**, then save and refresh.

The `:root` block makes its settings available throughout the theme. Later overrides take precedence; removing an override restores the theme's default. Keep your import in place.

## Optional Features

- **Glass transparency:** `--ng-glass-opacity-scale` accepts `0–2`. Use `1` for the default, `.7` for more transparency, or `2` for stronger glass; background opacity is capped, while text and icons keep their own opacity.
- **Glass blur:** `--ng-control-blur` adjusts background blur independently; `none` removes it.
- **Format badges:** `--ng-format-badges-display` accepts `flex` to show the plugin's detail labels or `none` to hide them.
- **Plugin features:** title count, autoplay, lineup replacement, library links, and branding visibility are configured in [plugin settings](SETUP.md#plugin-settings), not through CSS.

The transparency scale changes the theme's default glass colors. If you override a particular material color directly, that color takes precedence.

## Three ready-to-use scenarios

Choose one or combine them. Each block goes after the import in the same Custom CSS field.

### 1. Roomier Library

Increase spacing between shelf cards and Library posters, with softer corners. This leaves the existing grid column count in place.

```css
:root {
  --ng-card-gap: 32px;
  --ng-library-grid-gap: 40px;
  --ng-radius-card: 18px;
}
```

### 2. Softer glass controls

Make default glass backgrounds more transparent and reduce their blur. Text, icons, and keyboard focus outlines keep their own opacity.

```css
:root {
  --ng-glass-opacity-scale: .7;
  --ng-control-blur: blur(24px) saturate(160%);
}
```

### 3. More room on mobile

Shorten the plugin's featured Home area and adjust title and Search text sizes on screens up to `48rem` wide. The media query limits these changes to narrow screens; desktop values remain unchanged.

```css
@media (max-width: 48rem) {
  :root {
    --ng-feature-height: 66svh;
    --ng-feature-title-size: clamp(32px, 8vw, 44px);
    --ng-search-input-font-size: 20px;
  }
}
```

These scenarios preserve the theme's reduced-motion behavior.

## Variable reference

Start with the twelve common settings, then expand a group for more control. **Default** shows the shipped value; **Responsive / fallback** explains when the theme uses a different value.

All 216 variables are listed. Defaults are generated from [the CSS settings](../src/variables.css); descriptions and examples come from [the documentation metadata](../scripts/token-docs.mjs). Some defaults combine other variables, so their formulas are shown exactly.

### Reading values

- **Colors:** hex such as `#000`, color functions such as `rgba()`, or named colors. The last two digits of eight-digit hex set opacity: `00` is transparent and `ff` is opaque.
- **Sizes:** `px` is pixels; `rem` follows the base font size; `vw` is a percentage of viewport width; `svh` is a percentage of the small viewport height.
- **Responsive sizes:** `clamp(minimum, preferred, maximum)` keeps a size within limits. A mobile override must be placed inside the matching media query after the import.
- **Motion:** `ms` means milliseconds and `s` means seconds. Keep reduced-motion overrides when changing animation durations.

Examples are suggestions, not the complete list of accepted CSS values. Keep enough text contrast and at least 44px touch targets.

**Internal settings:** keep `--ng-companion-contract` and `--ng-dashboard-contract` at `1`. They identify compatible CSS for the plugin and are not appearance controls. The player's `--ng-osd-blur` defaults to `none` so blur stays on individual control groups rather than the whole video.

<!-- variables:start -->
### Common settings

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Page background**<br>`--ng-bg` | Sets the background color behind Jellyfin pages. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#000`, `#101014` | `#000` | — |
| **Primary text**<br>`--ng-text` | Colors primary text and the Search caret. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `#fff` | `#f5f5f7` | — |
| **Navigation glass**<br>`--ng-nav-glass` | Sets the translucent background of the navigation drawer. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `#18181bd9` | `rgb(34 34 38 / clamp(0, calc(0.7215686274509804 * var(--ng-glass-opacity-scale)), 1))` | Without backdrop blur: var(--ng-nav-solid) |
| **Control glass blur**<br>`--ng-control-blur` | Controls background blur and color intensity behind translucent controls. | Background filters such as blur() and saturate(), or none<br>Examples: `blur(24px) saturate(160%)`, `none` | `blur(30px) saturate(180%)` | Without backdrop blur: none |
| **Shelf card spacing**<br>`--ng-card-gap` | Sets spacing between cards in native shelves. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `24px`, `32px` | `clamp(20px, 2vw, 36px)` | — |
| **Library grid spacing**<br>`--ng-library-grid-gap` | Sets spacing between posters in Library grids. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `24px`, `40px` | `clamp(24px, 2.6vw, 42px)` | Mobile (up to 48rem): 20px |
| **Card corners**<br>`--ng-radius-card` | Controls rounding on artwork cards and poster surfaces. | Corner radius of 0 or greater in CSS units or a percentage<br>Examples: `14px`, `18px` | `14px` | — |
| **Featured Home height**<br>`--ng-feature-height` | Sets the height of the optional plugin’s Home carousel. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `70svh`, `78svh` | `78svh` | Mobile (up to 48rem): 78svh |
| **Detail artwork height**<br>`--ng-hero-height` | Sets the height of the large artwork area on detail pages. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `88svh`, `clamp(620px,88svh,1000px)` | `clamp(620px, 88svh, 1000px)` | Mobile (up to 48rem): clamp(608px, 82svh, 800px) |
| **Featured title size**<br>`--ng-feature-title-size` | Sets the text size of featured titles when no logo is available. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `48px`, `clamp(38px,4.8vw,72px)` | `clamp(38px, 4.8vw, 72px)` | Mobile (up to 48rem): clamp(34px, 9vw, 48px) |
| **Search text size**<br>`--ng-search-input-font-size` | Sets the size of text entered into Search. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `20px`, `24px` | `24px` | Mobile (up to 48rem): 19px |
| **Player button size**<br>`--ng-player-control-size` | Sets the width and height of the clickable player buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `44px` | Mobile (up to 48rem): 44px |

### Advanced settings

<details>
<summary>Optional Features</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Glass transparency**<br>`--ng-glass-opacity-scale` | Multiplies glass background opacity without fading text or changing blur. | Number from 0 to 2; lower is more transparent, 1 is the default<br>Examples: `0`, `.7`, `1`, `2` | `1` | — |
| **Format badges**<br>`--ng-format-badges-display` | Shows or hides the optional plugin’s detail-page format badges. | flex (visible) or none (hidden)<br>Examples: `flex`, `none` | `flex` | — |
| **Play/Pause animation**<br>`--ng-icon-state-duration` | Sets how long the icon animates when playback changes between Play and Pause. | Duration of 0 or greater in milliseconds (ms) or seconds (s)<br>Examples: `200ms`, `0ms` | `200ms` | Reduced motion: var(--ng-reduced-duration) |
| **Dashboard brand padding**<br>`--ng-admin-brand-inset` | Insets the Dashboard server-brand tile from the sidebar’s top and side. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `12px`, `16px` | `12px` | — |
| **Featured logo height**<br>`--ng-feature-logo-height` | Limits featured logos by the viewport height to keep short screens readable. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `10svh`, `12svh` | `min(12svh, var(--ng-logo-height))` | — |

</details>

<details>
<summary>Forms, dialogs & administration</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Form field width**<br>`--ng-form-field-width` | Sets the width of ordinary field groups including their labels and help text. | Size of 0 or greater in CSS units or a percentage<br>Examples: `50%`, `100%` | `clamp(25%, 48rem, 50%)` | Mobile (up to 48rem): 100% |
| **Form field minimum width**<br>`--ng-form-field-min-width` | Keeps ordinary fields readable without exceeding their container. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `280px`, `320px` | `320px` | — |
| **Favorite heart color**<br>`--ng-favorite-color` | Colors filled hearts for favorited media, including hover and keyboard focus. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#ff453a`, `#ff375f` | `#ff453a` | — |
| **Field corners**<br>`--ng-field-radius` | Rounds text inputs, selectors, and compact form buttons. | Corner radius of 0 or greater in CSS units or a percentage<br>Examples: `14px`, `20px` | `14px` | — |
| **Standard field height**<br>`--ng-field-height` | Sets the minimum height of standard form fields. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `48px`, `52px` | `48px` | — |
| **Field text padding**<br>`--ng-field-padding` | Sets horizontal spacing inside standard form fields. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `16px` | — |
| **Field glass**<br>`--ng-field-bg` | Sets the translucent background of standard inputs. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(41 41 48 / clamp(0, calc(0.6392156862745098 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Field hover surface**<br>`--ng-field-hover` | Sets the background of hovered form fields. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(56 56 64 / clamp(0, calc(0.7215686274509804 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Field borders**<br>`--ng-field-border` | Colors field outlines and unchecked control borders. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff38` | — |
| **Field placeholder text**<br>`--ng-field-placeholder` | Colors placeholder text inside standard inputs. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf599` | — |
| **Primary form action glass**<br>`--ng-primary-glass` | Colors primary form actions and checked controls. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `rgb(242 242 245 / clamp(0, calc(0.8509803921568627 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Destructive and error text**<br>`--ng-danger` | Colors destructive actions and invalid-field labels. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ff9b98` | — |
| **Destructive action surface**<br>`--ng-danger-bg` | Sets the tinted background of destructive actions and error alerts. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(150 43 48 / clamp(0, calc(0.23921568627450981 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Success text**<br>`--ng-success` | Colors success notifications. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#99dfbd` | — |
| **Disabled control opacity**<br>`--ng-disabled-opacity` | Sets the opacity of disabled controls. | Number from 0 (transparent) to 1 (opaque)<br>Examples: `.45`, `.6`, `1` | `.45` | — |
| **Minimum touch target**<br>`--ng-touch-target` | Sets the minimum clickable area of shared buttons and menu rows. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `44px` | — |
| **Dialog glass**<br>`--ng-dialog-glass` | Sets the translucent background of menus, dialogs, and player statistics. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(30 30 36 / clamp(0, calc(0.9294117647058824 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Dialog viewport clearance**<br>`--ng-dialog-clearance` | Keeps dialogs away from viewport edges. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `16px` | — |
| **Dialog available width**<br>`--ng-dialog-available-width` | Limits dialog width to the viewport minus its edge clearance. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `calc(100vw - 32px)`, `calc(100vw - 48px)` | `calc(100vw - var(--ng-dialog-clearance) * 2)` | — |
| **Dialog available height**<br>`--ng-dialog-available-height` | Limits dialog height to the viewport minus its edge clearance. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `calc(100dvh - 32px)`, `calc(100dvh - 48px)` | `calc(100dvh - var(--ng-dialog-clearance) * 2)` | — |
| **Action menu maximum width**<br>`--ng-dialog-menu-width` | Limits the width of Jellyfin pop-up action menus. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `24rem`, `28rem` | `28rem` | — |
| **Editor maximum width**<br>`--ng-dialog-editor-width` | Limits the width of larger editing dialogs. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `48rem`, `56rem` | `56rem` | — |
| **Dialog header and footer glass**<br>`--ng-dialog-footer-bg` | Sets the background behind dialog titles and footer actions. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(41 41 48 / clamp(0, calc(0.9098039215686274 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Dialog background dimming**<br>`--ng-dialog-backdrop` | Colors the dimming layer behind administration dialogs. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#0009` | — |
| **Administration row height**<br>`--ng-admin-row-height` | Sets the minimum height of compact administration rows. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `44px` | — |
| **Administration spacing**<br>`--ng-admin-gap` | Sets compact panel padding and form spacing in Settings and Dashboard. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `16px` | Mobile (up to 48rem): 12px |
| **Dashboard content width**<br>`--ng-admin-content-width` | Limits Dashboard page width within the area beside the sidebar. | Size of 0 or greater in CSS units or a percentage<br>Examples: `100%`, `90%` | `100%` | — |
| **Settings form width**<br>`--ng-admin-form-width` | Limits user Settings form width without narrowing Dashboard pages. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `48rem`, `56rem` | `56rem` | — |
| **Dashboard side spacing**<br>`--ng-admin-page-gutter` | Sets the left and right padding inside Dashboard pages. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `32px` | Mobile (up to 48rem): 16px |
| **Dashboard header clearance**<br>`--ng-admin-page-top-gap` | Adds space below Jellyfin’s header before Dashboard content starts. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `24px` | Mobile (up to 48rem): 16px |
| **Administration panel glass**<br>`--ng-admin-panel-bg` | Sets the background of administration cards and Settings rows. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(37 37 43 / clamp(0, calc(0.5019607843137255 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Table row tint**<br>`--ng-admin-table-stripe` | Sets a subtle background on alternating administration table rows. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#ffffff04` | — |
| **Table minimum width**<br>`--ng-admin-table-min-width` | Keeps wide tables readable while their container scrolls horizontally. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `40rem`, `48rem` | `36rem` | — |
| **Playback statistics width**<br>`--ng-stats-width` | Limits the width of the native playback statistics panel. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `28rem`, `32rem` | `28rem` | — |
| **Multiline input height**<br>`--ng-multiline-height` | Sets the minimum height of textareas such as Custom CSS and metadata. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `10rem`, `14rem` | `144px` | — |

</details>

<details>
<summary>Colors, glass & animation</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Compatibility marker (internal)**<br>`--ng-companion-contract` | Allows the plugin to recognize compatible CSS and must stay at 1. | Internal constant; keep 1<br>Examples: `1` | `1` | — |
| **Dashboard compatibility marker (internal)**<br>`--ng-dashboard-contract` | Allows administration styling only with the shared UI modules and must stay at 1. | Internal constant; keep 1<br>Examples: `1` | `1` | — |
| **Content surfaces**<br>`--ng-surface` | Colors standard content surfaces, including Library and Search. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#151517` | — |
| **Raised panels**<br>`--ng-surface-raised` | Colors the higher-contrast panels used above the page background. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#202023` | — |
| **Secondary text**<br>`--ng-text-secondary` | Colors descriptions, secondary labels, and metadata. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf5a3` | — |
| **Tertiary text (reserved)**<br>`--ng-text-tertiary` | Reserves a dimmer text color with no current visual effect. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf561` | — |
| **Text over artwork**<br>`--ng-text-on-image` | Colors metadata displayed directly over artwork. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffffdb` | — |
| **Primary button background**<br>`--ng-primary-bg` | Sets the background of primary actions such as Play. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#f2f2f5` | — |
| **Primary button text**<br>`--ng-primary-text` | Colors text and icons inside primary actions. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#0b0b0d` | — |
| **Secondary button background**<br>`--ng-secondary-bg` | Sets the background of secondary native actions. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(128 128 138 / clamp(0, calc(0.25882352941176473 * var(--ng-glass-opacity-scale)), 1))` | Without backdrop blur: #202026 |
| **Secondary button hover**<br>`--ng-secondary-hover` | Sets the background when secondary native actions are hovered. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(150 150 160 / clamp(0, calc(0.3607843137254902 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Standard borders**<br>`--ng-border` | Colors shared input and panel borders. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff1a` | — |
| **Hairline borders**<br>`--ng-hairline` | Colors subtle separators in dialogs and filter accordions. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff14` | — |
| **Transparent surfaces**<br>`--ng-transparent` | Supplies the transparent color used by borderless surfaces. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `transparent` | — |
| **Animation easing**<br>`--ng-ease` | Controls how theme animations speed up and slow down. | Animation curve such as ease-out, cubic-bezier(), or steps()<br>Examples: `ease-out`, `cubic-bezier(.2,.8,.2,1)` | `cubic-bezier(.2, .8, .2, 1)` | — |
| **Hover animation speed**<br>`--ng-motion-duration` | Sets the duration of ordinary hover and control transitions. | Duration of 0 or greater in milliseconds (ms) or seconds (s)<br>Examples: `200ms`, `0ms` | `180ms` | Reduced motion: var(--ng-reduced-duration) |
| **Reduced-motion duration**<br>`--ng-reduced-duration` | Supplies the animation duration used when reduced motion is enabled. | Duration of 0 or greater in milliseconds (ms) or seconds (s)<br>Examples: `200ms`, `0ms` | `0ms` | — |
| **Card shadow**<br>`--ng-shadow-card` | Sets the shadow beneath hoverable cards. | CSS shadow list (offsets, blur, spread, color), or none<br>Examples: `0 10px 28px -14px #000c`, `none` | `0 10px 28px -14px #000c` | — |
| **Panel shadow**<br>`--ng-shadow-panel` | Sets the shadow around large floating panels. | CSS shadow list (offsets, blur, spread, color), or none<br>Examples: `0 10px 28px -14px #000c`, `none` | `0 24px 60px -18px #000000d9` | — |
| **Control shadow**<br>`--ng-shadow-control` | Sets the inner highlight or shadow on controls. | CSS shadow list (offsets, blur, spread, color), or none<br>Examples: `0 10px 28px -14px #000c`, `none` | `inset 0 0 0 1px #ffffff1a` | — |

</details>

<details>
<summary>Text & fonts</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Body fonts**<br>`--ng-font` | Lists the preferred and fallback fonts for body text and controls. | Comma-separated font families; quote names containing spaces<br>Examples: `"Inter Variable", sans-serif`, `system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter Variable", "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | — |
| **Heading fonts**<br>`--ng-font-display` | Lists the preferred and fallback fonts for prominent headings and titles. | Comma-separated font families; quote names containing spaces<br>Examples: `"Inter Variable", sans-serif`, `system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter Variable", "Segoe UI Variable Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | — |
| **Base text size**<br>`--ng-font-size` | Sets the default text size on Jellyfin pages. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `18px` | `16px` | — |
| **Body text weight**<br>`--ng-body-weight` | Controls the thickness of ordinary body text. | Text thickness from 100 to 900 with Inter; higher is bolder<br>Examples: `400`, `650`, `700` | `400` | — |
| **Button text weight**<br>`--ng-control-weight` | Controls the thickness of button and control labels. | Text thickness from 100 to 900 with Inter; higher is bolder<br>Examples: `400`, `650`, `700` | `600` | — |
| **Heading weight**<br>`--ng-heading-weight` | Controls the thickness of section headings. | Text thickness from 100 to 900 with Inter; higher is bolder<br>Examples: `400`, `650`, `700` | `650` | — |
| **Title weight**<br>`--ng-title-weight` | Controls the thickness of prominent item titles. | Text thickness from 100 to 900 with Inter; higher is bolder<br>Examples: `400`, `650`, `700` | `700` | — |
| **Body line spacing**<br>`--ng-body-leading` | Controls vertical spacing between lines of descriptive text. | Line spacing multiplier such as 1.5, or normal<br>Examples: `1.2`, `1.5`, `normal` | `1.5` | — |
| **Title line spacing**<br>`--ng-title-leading` | Controls vertical spacing between lines of large titles. | Line spacing multiplier such as 1.5, or normal<br>Examples: `1.2`, `1.5`, `normal` | `1.08` | — |
| **Title letter spacing**<br>`--ng-title-tracking` | Controls spacing between letters in prominent titles. | CSS letter-spacing length, including negative values, or normal<br>Examples: `-0.02em`, `0px`, `normal` | `-0.022em` | — |
| **Control letter spacing**<br>`--ng-control-tracking` | Controls spacing between letters in button labels. | CSS letter-spacing length, including negative values, or normal<br>Examples: `-0.02em`, `0px`, `normal` | `-0.01em` | — |
| **Button text size**<br>`--ng-control-font-size` | Sets the size of ordinary button and control labels. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `14px`, `16px` | `17px` | — |
| **Metadata text size**<br>`--ng-small-font-size` | Sets the size of small labels and metadata. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `12px`, `14px` | `15px` | — |
| **Section heading size**<br>`--ng-section-font-size` | Sets the size of shelf and section headings. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `24px`, `28px` | `clamp(19px, 1.45vw, 24px)` | — |
| **Detail title size**<br>`--ng-title-size` | Sets the text size of detail titles when no artwork logo is used. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `48px`, `64px` | `clamp(32px, 4.4vw, 64px)` | — |

</details>

<details>
<summary>Navigation & keyboard focus</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Header height**<br>`--ng-nav-height` | Sets the header height and related content offsets. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `72px`, `80px` | `72px` | Mobile (up to 48rem): 60px<br>(max-width: 23.75rem): 116px |
| **Header gradient**<br>`--ng-nav-scrim` | Sets the fading background behind the top header. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(to bottom, #000000db 0%, #000000b8 38%, #0000005c 70%, #0000001a 88%, transparent)` | — |
| **Keyboard focus color**<br>`--ng-focus-color` | Colors keyboard focus outlines and focused input borders. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#f5f5f7` | — |
| **Keyboard focus thickness**<br>`--ng-focus-width` | Sets the thickness of keyboard focus outlines. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `2px` | — |
| **Keyboard focus spacing**<br>`--ng-focus-offset` | Sets the distance between a control and its focus outline. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `4px` | — |
| **Unblurred navigation background**<br>`--ng-nav-solid` | Sets the background used when the browser cannot blur translucent controls. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(25 25 28 / clamp(0, calc(0.9098039215686274 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Drawer width**<br>`--ng-nav-width` | Sets the width of the navigation drawer. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16rem`, `20rem` | `248px` | Mobile (up to 48rem): min(82vw, 320px) |
| **Drawer corners**<br>`--ng-nav-radius` | Controls the roundness of the navigation drawer. | Corner radius of 0 or greater in CSS units or a percentage<br>Examples: `20px`, `24px` | `26px` | — |
| **Drawer vertical inset**<br>`--ng-nav-inset` | Sets the gap between the drawer and the top and bottom edges. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `22px` | Mobile (up to 48rem): 10px |
| **Drawer side inset**<br>`--ng-nav-inline-inset` | Sets the drawer’s distance from the side of the window. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `22px` | Mobile (up to 48rem): 0px |
| **Drawer row height**<br>`--ng-nav-row-height` | Sets the minimum height of each navigation destination. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `48px`, `52px` | `46px` | — |
| **Selected destination background**<br>`--ng-nav-selection` | Colors the active destination in the navigation drawer. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#f3f3f5` | — |
| **Selected destination text**<br>`--ng-nav-selection-text` | Colors text and icons in the active drawer destination. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#151517` | — |
| **Drawer border**<br>`--ng-nav-border` | Colors the outline of the navigation drawer. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff21` | — |
| **Scrolled header background**<br>`--ng-header-scrolled` | Sets the header background after the page is scrolled. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(13 13 16 / clamp(0, calc(0.8509803921568627 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Header control glass**<br>`--ng-chrome-glass` | Sets the background of grouped header controls. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(52 52 59 / clamp(0, calc(0.7215686274509804 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Home header glass**<br>`--ng-home-chrome-glass` | Sets the translucent header-control background on Home. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(48 48 56 / clamp(0, calc(0.5019607843137255 * var(--ng-glass-opacity-scale)), 1))` | Without backdrop blur: var(--ng-nav-solid) |
| **Home selected tab**<br>`--ng-home-selected-glass` | Sets the background of the selected Home tab. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(243 243 245 / clamp(0, calc(0.7411764705882353 * var(--ng-glass-opacity-scale)), 1))` | Without backdrop blur: var(--ng-nav-selection) |
| **Home secondary actions**<br>`--ng-home-secondary-glass` | Sets the layered glass background of secondary Home actions. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(145deg, rgb(255 255 255 / clamp(0, calc(0.1411764705882353 * var(--ng-glass-opacity-scale)), 1)), rgb(255 255 255 / clamp(0, calc(0.0392156862745098 * var(--ng-glass-opacity-scale)), 1))), rgb(39 39 45 / clamp(0, calc(0.5019607843137255 * var(--ng-glass-opacity-scale)), 1))` | Without backdrop blur: var(--ng-secondary-bg) |
| **Home secondary hover**<br>`--ng-home-secondary-hover-glass` | Sets the glass background when secondary Home actions are hovered. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(145deg, rgb(255 255 255 / clamp(0, calc(0.20784313725490197 * var(--ng-glass-opacity-scale)), 1)), rgb(255 255 255 / clamp(0, calc(0.08627450980392157 * var(--ng-glass-opacity-scale)), 1))), rgb(39 39 45 / clamp(0, calc(0.5490196078431373 * var(--ng-glass-opacity-scale)), 1))` | Without backdrop blur: var(--ng-secondary-hover) |
| **Home glass border**<br>`--ng-home-glass-border` | Colors the outline of glass controls on Home. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff42` | — |
| **Header control hover**<br>`--ng-chrome-hover` | Sets the background when header controls are hovered. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(255 255 255 / clamp(0, calc(0.21176470588235294 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Header control border**<br>`--ng-chrome-border` | Colors the outline of header controls. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff30` | — |
| **Header border thickness**<br>`--ng-chrome-border-width` | Sets the thickness of header-control borders. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `1px` | — |
| **Header icon size**<br>`--ng-chrome-icon-size` | Sets the size of shapes inside header controls. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `20px`, `24px` | `21px` | — |
| **Header button size**<br>`--ng-chrome-button-size` | Sets the width and height of circular header buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `44px` | Mobile (up to 48rem): 44px |
| **Header button spacing**<br>`--ng-chrome-group-gap` | Sets spacing between controls in a header group. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `3px` | — |
| **Header tab height**<br>`--ng-chrome-tab-height` | Sets the height of navigation tabs in the header. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `42px` | — |
| **Header group padding**<br>`--ng-chrome-group-padding` | Sets the space inside each header-control group. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `4px` | Mobile (up to 48rem): 2px |

</details>

<details>
<summary>Cards & shared spacing</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Page side padding**<br>`--ng-gutter` | Sets the shared side padding around content and artwork text. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `clamp(16px, 4vw, 72px)` | — |
| **Extra-small spacing**<br>`--ng-space-xs` | Sets the smallest shared gap and padding size. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `8px` | — |
| **Small spacing**<br>`--ng-space-sm` | Sets small shared gaps and control padding. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `12px` | — |
| **Medium spacing**<br>`--ng-space-md` | Sets medium shared gaps and control padding. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `18px` | — |
| **Large spacing**<br>`--ng-space-lg` | Sets large shared gaps and section padding. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `24px` | — |
| **Section spacing**<br>`--ng-section-space` | Sets the breathing room between shelves and large sections. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `clamp(40px, 5vw, 80px)` | — |
| **Shelf poster width**<br>`--ng-poster-width` | Sets the width of posters in layouts that use the shared card width. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `180px`, `220px` | `clamp(190px, 15vw, 240px)` | Mobile (up to 48rem): 160px |
| **Landscape card width**<br>`--ng-landscape-width` | Sets the shared width of landscape cards. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `280px`, `320px` | `clamp(260px, 25vw, 380px)` | Mobile (up to 48rem): 280px |
| **Cast portrait width**<br>`--ng-person-width` | Sets the width of cast and person cards. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `120px`, `160px` | `144px` | — |
| **Card hover lift**<br>`--ng-card-lift` | Moves cards vertically when hovered. | Positive or negative CSS size/percentage; calc() also works<br>Examples: `-2px`, `0px` | `-2px` | Reduced motion: 0px |
| **Small corners**<br>`--ng-radius-small` | Controls rounding on small controls and badges. | Corner radius of 0 or greater in CSS units or a percentage<br>Examples: `14px`, `20px` | `6px` | — |
| **Panel corners**<br>`--ng-radius-panel` | Controls rounding on larger panels and grouped controls. | Corner radius of 0 or greater in CSS units or a percentage<br>Examples: `14px`, `20px` | `20px` | — |
| **Pill corners**<br>`--ng-radius-pill` | Controls rounding on pill-shaped buttons and circular controls. | Corner radius of 0 or greater in CSS units or a percentage<br>Examples: `999px`, `50%` | `999px` | — |
| **Shared button height**<br>`--ng-control-height` | Sets the minimum height of ordinary theme buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `54px` | Mobile (up to 48rem): 48px |
| **Shared button padding**<br>`--ng-control-padding` | Sets horizontal padding inside ordinary theme buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `30px` | Mobile (up to 48rem): 26px |
| **Artwork hover gradient**<br>`--ng-overlay-scrim` | Darkens artwork behind the buttons shown when you hover a card. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(to top, #0009, transparent 75%)` | — |
| **Watched-progress thickness**<br>`--ng-progress-height` | Sets the thickness of progress strips on cards. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `3px`, `4px` | `3px` | — |
| **Watched-progress track**<br>`--ng-progress-track` | Colors the unfilled portion of card progress strips. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#ffffff29` | — |
| **Poster action glass**<br>`--ng-poster-actions-bg` | Sets the glass background around grouped poster buttons. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(21 21 25 / clamp(0, calc(0.8509803921568627 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Poster action button size**<br>`--ng-poster-action-size` | Sets the size of secondary buttons inside poster overlays. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `40px` | Mobile (up to 48rem): 44px |
| **Poster Play button size**<br>`--ng-poster-play-size` | Sets the size of the main Play button on poster overlays. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `54px` | — |
| **Poster action spacing**<br>`--ng-poster-action-gap` | Sets spacing between the grouped poster buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `4px`, `8px` | `3px` | — |
| **Poster action edge spacing**<br>`--ng-poster-action-inset` | Keeps the grouped buttons away from the poster’s bottom and right edges. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `12px` | — |
| **Poster action padding**<br>`--ng-poster-action-padding` | Sets space inside the glass group around poster buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `6px`, `10px` | `6px` | — |

</details>

<details>
<summary>Artwork & featured Home</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Detail content width**<br>`--ng-hero-content-width` | Limits the width of primary detail-page content. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44rem`, `52rem` | `680px` | — |
| **Overview width**<br>`--ng-hero-overview-width` | Limits the width of descriptions over hero artwork. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `32rem`, `40rem` | `580px` | — |
| **Detail artwork gradient**<br>`--ng-hero-scrim` | Sets the gradients that keep detail text readable over artwork. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(90deg, #000000ad 0%, #00000040 42%, transparent 76%), linear-gradient(0deg, #000 0%, #000000a1 16%, #0000000d 66%, transparent)` | — |
| **Detail page background**<br>`--ng-detail-background` | Sets the background transition beneath detail artwork. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(to bottom, transparent 0, transparent var(--ng-hero-height), var(--ng-bg) var(--ng-hero-height))` | — |
| **Backdrop fade**<br>`--ng-backdrop-mask` | Controls how global backdrop artwork fades into the page. | CSS image: a gradient or none<br>Examples: `linear-gradient(to bottom,#000,transparent)`, `none` | `linear-gradient(to bottom, #000 0%, #000 50%, transparent 100%)` | — |
| **Artwork logo width**<br>`--ng-logo-width` | Sets the width of transparent title-logo artwork. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `240px`, `320px` | `clamp(280px, 43vw, 620px)` | Mobile (up to 48rem): min(84vw, 440px) |
| **Artwork logo height**<br>`--ng-logo-height` | Limits the height of title-logo artwork and related detail spacing. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `120px`, `160px` | `clamp(80px, 11vw, 160px)` | Mobile (up to 48rem): 100px |
| **Detail logo top offset**<br>`--ng-logo-top` | Positions title-logo artwork vertically on detail pages. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `0px`, `24px` | `max(160px, calc(var(--ng-hero-height) - 520px))` | Mobile (up to 48rem): clamp(192px, 34svh, 320px) |
| **Detail logo stacking**<br>`--ng-logo-layer` | Sets the stacking order of the detail logo. | Whole-number stacking order (higher is in front), or auto<br>Examples: `1`, `2`, `auto` | `1` | — |
| **Artwork crop position**<br>`--ng-image-position` | Selects which part of artwork stays visible when it is cropped. | CSS position keywords, percentages, or lengths<br>Examples: `center top`, `50% 50%` | `center top` | — |
| **Featured content width**<br>`--ng-feature-content-width` | Limits the width of text and actions in the Home carousel. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `36rem`, `44rem` | `620px` | — |
| **Featured artwork gradient**<br>`--ng-feature-scrim` | Sets the gradients behind featured text and controls. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(90deg, #000000b5, #0000004d 46%, transparent 76%), linear-gradient(0deg, #000 0%, #00000091 18%, #00000012 56%, transparent)` | — |
| **Featured fallback background**<br>`--ng-feature-gradient` | Sets the carousel background beneath its artwork. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `radial-gradient(circle at 70% 25%, #38383d 0%, #1b1b1e 52%, #000 100%)` | — |
| **Inactive pagination color**<br>`--ng-feature-dot` | Colors inactive carousel pagination indicators. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#ffffff73` | — |
| **Active pagination color**<br>`--ng-feature-dot-active` | Colors the selected carousel pagination indicator. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#fff` | — |
| **Pagination dot size**<br>`--ng-feature-dot-size` | Sets the size of inactive carousel pagination dots. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `6px`, `8px` | `6px` | — |
| **Active pagination width**<br>`--ng-feature-dot-active-width` | Sets the width of the selected pagination indicator. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `22px`, `28px` | `22px` | — |
| **Carousel animation speed**<br>`--ng-feature-slide-duration` | Sets the duration of the slide animation between featured titles. | Duration of 0 or greater in milliseconds (ms) or seconds (s)<br>Examples: `650ms`, `400ms` | `650ms` | Reduced motion: var(--ng-reduced-duration) |

</details>

<details>
<summary>Details, tracks & episodes</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Episode image width**<br>`--ng-episode-image-width` | Sets the artwork width in episode cards. | Size of 0 or greater in CSS units or a percentage<br>Examples: `40%`, `100%` | `100%` | Mobile (up to 48rem): 100% |
| **Episode columns**<br>`--ng-episode-columns` | Sets the number and sizing of episode-card columns. | CSS column layout using lengths, fr (a share of space), repeat(), or minmax()<br>Examples: `repeat(2,minmax(0,1fr))`, `minmax(0,1fr)` | `repeat(2, minmax(0, 1fr))` | Mobile (up to 48rem): minmax(0, 1fr) |
| **Episode content columns (reserved)**<br>`--ng-episode-content-columns` | Reserves an inner-column layout with no current visual effect. | CSS column layout using lengths, fr (a share of space), repeat(), or minmax()<br>Examples: `repeat(2,minmax(0,1fr))`, `minmax(0,1fr)` | `minmax(0, 1fr)` | Mobile (up to 48rem): minmax(0, 1fr) |
| **Track selector surface**<br>`--ng-track-surface` | Sets the background of Video, Audio, and Subtitles selectors. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(36 36 42 / clamp(0, calc(0.7333333333333333 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Track selector hover**<br>`--ng-track-hover` | Sets the background when track selectors are hovered. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(53 53 61 / clamp(0, calc(0.788235294117647 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Track selector border**<br>`--ng-track-border` | Colors the outline of track selectors. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff2b` | — |
| **Track selector height**<br>`--ng-track-row-height` | Sets the minimum height of each track-selector row. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `44px` | Mobile (up to 48rem): 44px |
| **Track icon size**<br>`--ng-track-icon-size` | Sets the screen, speaker, and subtitle icon sizes. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `18px`, `22px` | `20px` | — |
| **Track label text size**<br>`--ng-track-label-size` | Sets the size of Video, Audio, and Subtitles labels. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `13px`, `14px` | `13px` | — |
| **Track label width**<br>`--ng-track-label-width` | Sets the space allocated to track-selector labels. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `6rem`, `8rem` | `112px` | — |
| **Track value end padding**<br>`--ng-track-select-end-padding` | Keeps selected track text away from the dropdown arrow. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `34px` | — |
| **Format badge vertical offset**<br>`--ng-track-badge-pull` | Adjusts the top margin of source-format badges. | Positive or negative CSS size/percentage; calc() also works<br>Examples: `-2px`, `0px`, `2px` | `0px` | — |
| **Format badge background**<br>`--ng-format-badge-bg` | Sets the background of source-format badges. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(255 255 255 / clamp(0, calc(0.10980392156862745 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Format badge border**<br>`--ng-format-badge-border` | Colors the outline of source-format badges. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff38` | — |
| **Format badge height**<br>`--ng-format-badge-height` | Sets the minimum height of source-format badges. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `24px`, `28px` | `24px` | — |
| **Format badge text size**<br>`--ng-format-badge-font-size` | Sets the text size inside source-format badges. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `11px`, `13px` | `11px` | — |
| **Episode card surface**<br>`--ng-episode-surface` | Sets the background of episode cards. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#1d1d21` | — |
| **Episode card hover**<br>`--ng-episode-hover` | Sets the background when episode cards are hovered. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#29292f` | — |
| **Episode card border**<br>`--ng-episode-border` | Colors the outline of episode cards. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff19` | — |
| **Episode action button size**<br>`--ng-episode-action-size` | Sets the size of buttons in the episode action dock. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `40px` | Mobile (up to 48rem): 44px |
| **Episode dock padding**<br>`--ng-episode-dock-padding` | Sets padding inside the episode action dock. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `5px` | — |
| **Episode dock button spacing**<br>`--ng-episode-dock-gap` | Sets spacing between episode action buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `2px` | — |
| **Episode dock glass**<br>`--ng-episode-dock-bg` | Sets the background of the episode action dock. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(55 55 62 / clamp(0, calc(0.788235294117647 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Episode dock border**<br>`--ng-episode-dock-border` | Colors the outline of the episode action dock. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff38` | — |
| **Episode hover lift**<br>`--ng-episode-card-lift` | Moves episode cards vertically when hovered. | Positive or negative CSS size/percentage; calc() also works<br>Examples: `-2px`, `0px` | `-3px` | — |

</details>

<details>
<summary>Search & login</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Search heading size**<br>`--ng-search-heading-size` | Sets the size of headings on Search. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `32px`, `40px` | `clamp(26px, 2.5vw, 38px)` | — |
| **Search content width**<br>`--ng-search-content-width` | Limits the width of the main Search area. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `60rem`, `72rem` | `880px` | — |
| **Search field height**<br>`--ng-search-field-height` | Sets the height of the Search input field. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `56px`, `64px` | `72px` | Mobile (up to 48rem): 58px |
| **Search field glass**<br>`--ng-search-field-bg` | Sets the background of the Search input field. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(43 43 48 / clamp(0, calc(0.7215686274509804 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Search line spacing**<br>`--ng-search-input-line-height` | Controls vertical line spacing inside the Search field. | Line spacing multiplier such as 1.5, or normal<br>Examples: `1.2`, `1.5`, `normal` | `1.2` | — |
| **Search field padding**<br>`--ng-search-input-padding` | Sets the space between Search text and the field edges. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `28px` | Mobile (up to 48rem): 18px |
| **Search placeholder color**<br>`--ng-search-placeholder` | Colors placeholder text in the Search field. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf58c` | — |
| **Search tile width**<br>`--ng-search-tile-width` | Sets the width of small Search tiles such as genres. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `120px`, `160px` | `220px` | — |
| **Search tile height**<br>`--ng-search-tile-height` | Sets the minimum height of small Search tiles. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `44px`, `56px` | `96px` | — |
| **Login panel width**<br>`--ng-login-width` | Limits the width of the login form. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `22rem`, `26rem` | `440px` | — |
| **Login panel padding**<br>`--ng-login-padding` | Sets padding inside the login panel. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `clamp(24px, 4vw, 48px)` | — |
| **Login background**<br>`--ng-login-background` | Sets the background behind the login form. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `var(--ng-dialog-glass)` | — |
| **Login heading size**<br>`--ng-login-title-size` | Sets the size of the login heading. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `28px`, `32px` | `32px` | — |

</details>

<details>
<summary>Player controls</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Player gradient base**<br>`--ng-player-scrim` | Supplies the dark color used within the bottom player gradient. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#121215db` | — |
| **Player top gradient**<br>`--ng-player-top-scrim` | Sets the gradient behind the player’s top controls. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(to bottom, #000000b8, transparent)` | — |
| **Player bottom gradient**<br>`--ng-osd-glass` | Sets the full-width fading background behind the player controls. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `linear-gradient(to bottom, transparent 0%, var(--ng-player-scrim) 48%, #000000e8 100%)` | — |
| **Player backdrop blur**<br>`--ng-osd-blur` | Controls blur behind the bottom player surface and defaults to none. | Background filters such as blur() and saturate(), or none<br>Examples: `blur(24px) saturate(160%)`, `none` | `none` | Without backdrop blur: none |
| **Player surface corners**<br>`--ng-osd-radius` | Controls rounding on the bottom player surface. | Corner radius of 0 or greater in CSS units or a percentage<br>Examples: `14px`, `20px` | `0px` | — |
| **Player surface padding**<br>`--ng-osd-padding` | Sets padding around the bottom player controls. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `clamp(20px, 3vw, 44px)` | — |
| **Player control gap (reserved)**<br>`--ng-player-control-gap` | Reserves a control-spacing value with no current visual effect. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `6px` | — |
| **Player dock glass**<br>`--ng-player-dock-bg` | Sets the translucent background of the two player-control docks. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(43 43 49 / clamp(0, calc(0.5490196078431373 * var(--ng-glass-opacity-scale)), 1))` | Without backdrop blur: var(--ng-nav-solid) |
| **Player dock border**<br>`--ng-player-dock-border` | Colors the outline of player-control docks. | Color: hex, rgb/rgba, hsl/hsla, or a name such as white<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff47` | — |
| **Player dock padding**<br>`--ng-player-dock-padding` | Sets padding inside player-control docks. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `6px`, `10px` | `6px` | — |
| **Player dock button spacing**<br>`--ng-player-dock-gap` | Sets spacing between buttons inside player-control docks. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `3px`, `6px` | `3px` | — |
| **Transport dock offset**<br>`--ng-player-transport-offset` | Positions the transport dock relative to the player’s bottom layout. | Positive or negative CSS size/percentage; calc() also works<br>Examples: `-2px`, `0px`, `2px` | `calc(100% - 100vw + 2 * var(--ng-osd-padding) + var(--ng-space-sm))` | — |
| **Player icon size**<br>`--ng-player-icon-size` | Sets the size of shapes inside player buttons. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `21px`, `24px` | `23px` | Mobile (up to 48rem): 21px |
| **Player title size**<br>`--ng-player-title-size` | Sets the text size of the title displayed in the player. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `18px`, `22px` | `21px` | Mobile (up to 48rem): 17px |
| **Timeline background**<br>`--ng-player-timeline-track` | Colors the unfilled portion of the playback timeline. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#ffffff59` | — |
| **Chapter marker color**<br>`--ng-player-chapter-tick` | Colors chapter markers along the timeline. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#ffffff73` | — |
| **Player button hover**<br>`--ng-player-control-hover` | Sets the background when player buttons are hovered. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `rgb(255 255 255 / clamp(0, calc(0.18823529411764706 * var(--ng-glass-opacity-scale)), 1))` | — |
| **Active player button**<br>`--ng-player-control-active` | Sets the background of active player controls. | Background: a color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `rgba(34,34,38,.65)` | `#f2f2f5` | — |
| **Timeline thickness**<br>`--ng-player-timeline-height` | Sets the thickness of the playback timeline. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `3px`, `4px` | `4px` | — |
| **Player bottom spacing**<br>`--ng-player-bottom-padding` | Sets extra padding below the player controls. | Size of 0 or greater in px, rem, vw, or svh; min(), max(), and clamp() also work<br>Examples: `16px`, `24px` | `22px` | — |

</details>
<!-- variables:end -->

For installation or update problems, see [Setup and troubleshooting](SETUP.md#troubleshooting).
