# Customization

Paste overrides **after** the NoirGlass import in the same Custom CSS field; remove an override to restore its default. Start with the [installation guide](../README.md), then try the [three preset scenarios](#three-ready-to-use-scenarios) or adjust the common settings below.

Colors can use hex, `rgb()`, `rgba()`, or named colors; the final two digits of eight-digit hex control opacity (`00` transparent, `ff` opaque). Sizes use CSS units such as `px`, `rem`, `vw`, and `svh`; `clamp()` keeps a value between a minimum and maximum. Examples are valid choices, not a complete list of every CSS value.

## Variable reference

The twelve common settings appear first; expand the groups below them for every other token. Defaults and mobile/reduced-motion fallbacks are generated from [src/variables.css](../src/variables.css), while names, explanations, and value examples are maintained in [the documentation map](../scripts/token-docs.mjs).

For a default that changes on mobile, repeat its media query after the import, as in scenario 3. Keep readable contrast, visible focus outlines, and comfortable button sizes; retain reduced-motion overrides when changing animation timings.

**Keep `--ng-companion-contract` at `1`.** This internal marker lets the plugin recognize compatible CSS and is not a visual setting. The player’s `--ng-osd-blur` defaults to `none`, leaving glass on the individual docks. See [CDN and version behavior](SETUP.md#versions-and-cdn-caching).

<!-- variables:start -->
### Common settings

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Page background**<br>`--ng-bg` | Sets the background color behind Jellyfin pages. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#000`, `#101014` | `#000` | — |
| **Primary text**<br>`--ng-text` | Colors primary text and the Search caret. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `#fff` | `#f5f5f7` | — |
| **Navigation glass**<br>`--ng-nav-glass` | Sets the translucent background of the navigation drawer. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `#18181bd9` | `#222226b8` | Without backdrop blur: var(--ng-nav-solid) |
| **Control glass blur**<br>`--ng-control-blur` | Controls blur and saturation behind translucent controls. | Backdrop-filter functions or none<br>Examples: `blur(24px) saturate(160%)`, `none` | `blur(30px) saturate(180%)` | Without backdrop blur: none |
| **Shelf card spacing**<br>`--ng-card-gap` | Sets spacing between cards in native shelves. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `32px` | `clamp(20px, 2vw, 36px)` | — |
| **Library grid spacing**<br>`--ng-library-grid-gap` | Sets spacing between posters in Library grids. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `40px` | `clamp(24px, 2.6vw, 42px)` | Mobile (up to 48rem): 20px |
| **Card corners**<br>`--ng-radius-card` | Controls rounding on artwork cards and poster surfaces. | Non-negative CSS length or percentage<br>Examples: `14px`, `18px` | `14px` | — |
| **Featured Home height**<br>`--ng-feature-height` | Sets the height of the optional plugin’s Home carousel. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `76svh`, `clamp(590px,82svh,920px)` | `clamp(590px, 82svh, 920px)` | Mobile (up to 48rem): clamp(520px, 78svh, 740px) |
| **Detail hero height**<br>`--ng-hero-height` | Sets the height of the artwork hero on detail pages. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `88svh`, `clamp(620px,88svh,1000px)` | `clamp(620px, 88svh, 1000px)` | Mobile (up to 48rem): clamp(608px, 82svh, 800px) |
| **Featured title size**<br>`--ng-feature-title-size` | Sets the text size of featured titles when no logo is available. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `48px`, `clamp(38px,4.8vw,72px)` | `clamp(38px, 4.8vw, 72px)` | Mobile (up to 48rem): clamp(34px, 9vw, 48px) |
| **Search text size**<br>`--ng-search-input-font-size` | Sets the size of text entered into Search. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `20px`, `24px` | `24px` | Mobile (up to 48rem): 19px |
| **Player button size**<br>`--ng-player-control-size` | Sets the hit-target size of player buttons. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `44px`, `48px` | `44px` | Mobile (up to 48rem): 44px |

### Advanced settings

<details>
<summary>Forms, dialogs & administration</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Field corners**<br>`--ng-field-radius` | Rounds text inputs, selectors, and compact form buttons. | Non-negative CSS length or percentage<br>Examples: `14px`, `50%` | `14px` | — |
| **Standard field height**<br>`--ng-field-height` | Sets the minimum height of standard form fields. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `48px` | — |
| **Field text padding**<br>`--ng-field-padding` | Sets horizontal spacing inside standard form fields. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `16px` | — |
| **Field glass**<br>`--ng-field-bg` | Sets the translucent background of standard inputs. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#292930a3` | — |
| **Field hover surface**<br>`--ng-field-hover` | Sets the background of hovered form fields. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#383840b8` | — |
| **Field borders**<br>`--ng-field-border` | Colors field outlines and unchecked control borders. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff38` | — |
| **Field placeholder text**<br>`--ng-field-placeholder` | Colors placeholder text inside standard inputs. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf599` | — |
| **Primary form action glass**<br>`--ng-primary-glass` | Colors primary form actions and checked controls. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#f2f2f5d9` | — |
| **Destructive and error text**<br>`--ng-danger` | Colors destructive actions and invalid-field labels. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ff9b98` | — |
| **Destructive action surface**<br>`--ng-danger-bg` | Sets the tinted background of destructive actions and error alerts. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#962b303d` | — |
| **Success text**<br>`--ng-success` | Colors success notifications. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#99dfbd` | — |
| **Disabled control opacity**<br>`--ng-disabled-opacity` | Sets the opacity of disabled controls. | Number from 0 (transparent) to 1 (opaque)<br>Examples: `.45`, `.6`, `1` | `.45` | — |
| **Minimum touch target**<br>`--ng-touch-target` | Sets the minimum size of shared buttons and menu rows. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `44px` | — |
| **Dialog glass**<br>`--ng-dialog-glass` | Sets the translucent background of menus, dialogs, and player statistics. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#1e1e24ed` | — |
| **Dialog viewport clearance**<br>`--ng-dialog-clearance` | Keeps dialogs away from viewport edges. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `16px` | — |
| **Dialog available width**<br>`--ng-dialog-available-width` | Limits dialog width to the viewport minus its edge clearance. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `calc(100vw - var(--ng-dialog-clearance) * 2)` | — |
| **Dialog available height**<br>`--ng-dialog-available-height` | Limits dialog height to the viewport minus its edge clearance. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `calc(100dvh - var(--ng-dialog-clearance) * 2)` | — |
| **Action sheet maximum width**<br>`--ng-dialog-menu-width` | Limits the width of native action sheets. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `28rem` | — |
| **Editor maximum width**<br>`--ng-dialog-editor-width` | Limits the width of larger editing dialogs. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `56rem` | — |
| **Dialog header and footer glass**<br>`--ng-dialog-footer-bg` | Sets the background behind dialog titles and footer actions. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#292930e8` | — |
| **Modal background dimming**<br>`--ng-dialog-backdrop` | Colors the dimming layer behind MUI dialogs. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#0009` | — |
| **Administration row height**<br>`--ng-admin-row-height` | Sets the minimum height of compact administration rows. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `44px` | — |
| **Administration spacing**<br>`--ng-admin-gap` | Sets compact panel padding and form spacing in Settings and Dashboard. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `16px` | Mobile (up to 48rem): 12px |
| **Dashboard content width**<br>`--ng-admin-content-width` | Limits Dashboard page width within the area beside the sidebar. | Non-negative CSS length or percentage<br>Examples: `100%`, `240px` | `100%` | — |
| **Settings form width**<br>`--ng-admin-form-width` | Limits user Settings form width without narrowing Dashboard pages. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `56rem` | — |
| **Dashboard side spacing**<br>`--ng-admin-page-gutter` | Sets the left and right padding inside Dashboard pages. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `32px` | Mobile (up to 48rem): 16px |
| **Dashboard header clearance**<br>`--ng-admin-page-top-gap` | Sets the space between the native header spacer and Dashboard content. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `24px` | Mobile (up to 48rem): 16px |
| **Administration panel glass**<br>`--ng-admin-panel-bg` | Sets the background of administration cards and Settings rows. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#25252b80` | — |
| **Table row tint**<br>`--ng-admin-table-stripe` | Sets a subtle background on alternating administration table rows. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff04` | — |
| **Table minimum width**<br>`--ng-admin-table-min-width` | Keeps wide tables readable while their container scrolls horizontally. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `36rem` | — |
| **Playback statistics width**<br>`--ng-stats-width` | Limits the width of the native playback statistics panel. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `28rem` | — |
| **Multiline input height**<br>`--ng-multiline-height` | Sets the minimum height of textareas such as Custom CSS and metadata. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `144px` | — |

</details>

<details>
<summary>Colors, materials & motion</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Compatibility marker (internal)**<br>`--ng-companion-contract` | Allows the plugin to recognize compatible CSS and must stay at 1. | Internal constant; keep 1<br>Examples: `1` | `1` | — |
| **Dashboard compatibility marker (internal)**<br>`--ng-dashboard-contract` | Allows administration styling only with the shared UI modules and must stay at 1. | Internal constant; keep 1<br>Examples: `1` | `1` | — |
| **Content surfaces**<br>`--ng-surface` | Colors standard content surfaces, including Library and Search. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#151517` | — |
| **Raised panels**<br>`--ng-surface-raised` | Colors the higher-contrast panels used above the page background. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#202023` | — |
| **Secondary text**<br>`--ng-text-secondary` | Colors descriptions, secondary labels, and metadata. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf5a3` | — |
| **Tertiary text (reserved)**<br>`--ng-text-tertiary` | Reserves a dimmer text color with no current visual effect. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf561` | — |
| **Text over artwork**<br>`--ng-text-on-image` | Colors metadata displayed directly over artwork. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffffdb` | — |
| **Primary button background**<br>`--ng-primary-bg` | Sets the background of primary actions such as Play. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#f2f2f5` | — |
| **Primary button text**<br>`--ng-primary-text` | Colors text and icons inside primary actions. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#0b0b0d` | — |
| **Secondary button background**<br>`--ng-secondary-bg` | Sets the background of secondary native actions. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#80808a42` | Without backdrop blur: #202026 |
| **Secondary button hover**<br>`--ng-secondary-hover` | Sets the background when secondary native actions are hovered. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#9696a05c` | — |
| **Standard borders**<br>`--ng-border` | Colors shared input and panel borders. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff1a` | — |
| **Hairline borders**<br>`--ng-hairline` | Colors subtle separators in dialogs and filter accordions. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff14` | — |
| **Transparent surfaces**<br>`--ng-transparent` | Supplies the transparent color used by borderless surfaces. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `transparent` | — |
| **Animation easing**<br>`--ng-ease` | Controls the acceleration curve of theme transitions. | CSS timing function: a keyword, cubic-bezier(), or steps()<br>Examples: `ease-out`, `cubic-bezier(.2,.8,.2,1)` | `cubic-bezier(.2, .8, .2, 1)` | — |
| **Hover animation speed**<br>`--ng-motion-duration` | Sets the duration of ordinary hover and control transitions. | Non-negative CSS time in ms or s<br>Examples: `180ms`, `650ms`, `0ms` | `180ms` | Reduced motion: var(--ng-reduced-duration) |
| **Reduced-motion duration**<br>`--ng-reduced-duration` | Supplies the animation duration used when reduced motion is enabled. | Non-negative CSS time in ms or s<br>Examples: `180ms`, `650ms`, `0ms` | `0ms` | — |
| **Card shadow**<br>`--ng-shadow-card` | Sets the shadow beneath hoverable cards. | CSS box-shadow list or none<br>Examples: `0 10px 28px -14px #000c`, `none` | `0 10px 28px -14px #000c` | — |
| **Panel shadow**<br>`--ng-shadow-panel` | Sets the shadow around large floating panels. | CSS box-shadow list or none<br>Examples: `0 10px 28px -14px #000c`, `none` | `0 24px 60px -18px #000000d9` | — |
| **Control shadow**<br>`--ng-shadow-control` | Sets the inset highlight or shadow on controls. | CSS box-shadow list or none<br>Examples: `0 10px 28px -14px #000c`, `none` | `inset 0 0 0 1px #ffffff1a` | — |

</details>

<details>
<summary>Typography</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Body font stack**<br>`--ng-font` | Selects the fonts for body text and controls. | Comma-separated font families; quote names containing spaces<br>Examples: `"Inter Variable", sans-serif`, `system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter Variable", "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | — |
| **Heading font stack**<br>`--ng-font-display` | Selects the fonts for prominent headings and titles. | Comma-separated font families; quote names containing spaces<br>Examples: `"Inter Variable", sans-serif`, `system-ui, sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter Variable", "Segoe UI Variable Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | — |
| **Base text size**<br>`--ng-font-size` | Sets the default text size on Jellyfin pages. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `16px` | — |
| **Body text weight**<br>`--ng-body-weight` | Controls the thickness of ordinary body text. | Numeric font weight; Inter supports 100–900<br>Examples: `400`, `650`, `700` | `400` | — |
| **Button text weight**<br>`--ng-control-weight` | Controls the thickness of button and control labels. | Numeric font weight; Inter supports 100–900<br>Examples: `400`, `650`, `700` | `600` | — |
| **Heading weight**<br>`--ng-heading-weight` | Controls the thickness of section headings. | Numeric font weight; Inter supports 100–900<br>Examples: `400`, `650`, `700` | `650` | — |
| **Title weight**<br>`--ng-title-weight` | Controls the thickness of prominent item titles. | Numeric font weight; Inter supports 100–900<br>Examples: `400`, `650`, `700` | `700` | — |
| **Body line spacing**<br>`--ng-body-leading` | Controls vertical spacing between lines of descriptive text. | Unitless line-height multiplier or normal<br>Examples: `1.2`, `1.5`, `normal` | `1.5` | — |
| **Title line spacing**<br>`--ng-title-leading` | Controls vertical spacing between lines of large titles. | Unitless line-height multiplier or normal<br>Examples: `1.2`, `1.5`, `normal` | `1.08` | — |
| **Title letter spacing**<br>`--ng-title-tracking` | Controls spacing between letters in prominent titles. | CSS letter-spacing length, including negative values, or normal<br>Examples: `-0.02em`, `0px`, `normal` | `-0.022em` | — |
| **Control letter spacing**<br>`--ng-control-tracking` | Controls spacing between letters in button labels. | CSS letter-spacing length, including negative values, or normal<br>Examples: `-0.02em`, `0px`, `normal` | `-0.01em` | — |
| **Button text size**<br>`--ng-control-font-size` | Sets the size of ordinary button and control labels. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `17px` | — |
| **Metadata text size**<br>`--ng-small-font-size` | Sets the size of small labels and metadata. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `15px` | — |
| **Section heading size**<br>`--ng-section-font-size` | Sets the size of shelf and section headings. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(19px, 1.45vw, 24px)` | — |
| **Detail title size**<br>`--ng-title-size` | Sets the text size of detail titles when no artwork logo is used. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(32px, 4.4vw, 64px)` | — |

</details>

<details>
<summary>Navigation & focus</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Header height**<br>`--ng-nav-height` | Sets the header height and related content offsets. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `72px` | Mobile (up to 48rem): 60px |
| **Header gradient**<br>`--ng-nav-scrim` | Sets the fading background behind the top header. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(to bottom, #000000db 0%, #000000b8 38%, #0000005c 70%, #0000001a 88%, transparent)` | — |
| **Keyboard focus color**<br>`--ng-focus-color` | Colors keyboard focus outlines and focused input borders. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#f5f5f7` | — |
| **Keyboard focus thickness**<br>`--ng-focus-width` | Sets the thickness of keyboard focus outlines. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `2px` | — |
| **Keyboard focus spacing**<br>`--ng-focus-offset` | Sets the distance between a control and its focus outline. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `4px` | — |
| **Navigation fallback**<br>`--ng-nav-solid` | Supplies a background when the browser cannot blur translucent controls. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#19191ce8` | — |
| **Drawer width**<br>`--ng-nav-width` | Sets the width of the navigation drawer. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `248px` | Mobile (up to 48rem): min(82vw, 320px) |
| **Drawer corners**<br>`--ng-nav-radius` | Controls the roundness of the navigation drawer. | Non-negative CSS length or percentage<br>Examples: `14px`, `50%` | `26px` | — |
| **Drawer vertical inset**<br>`--ng-nav-inset` | Sets the gap between the drawer and the top and bottom edges. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `22px` | Mobile (up to 48rem): 10px |
| **Drawer side inset**<br>`--ng-nav-inline-inset` | Sets the drawer’s distance from the side of the window. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `22px` | Mobile (up to 48rem): 0px |
| **Drawer row height**<br>`--ng-nav-row-height` | Sets the minimum height of each navigation destination. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `46px` | — |
| **Selected destination background**<br>`--ng-nav-selection` | Colors the active destination in the navigation drawer. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#f3f3f5` | — |
| **Selected destination text**<br>`--ng-nav-selection-text` | Colors text and icons in the active drawer destination. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#151517` | — |
| **Drawer border**<br>`--ng-nav-border` | Colors the outline of the navigation drawer. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff21` | — |
| **Scrolled header background**<br>`--ng-header-scrolled` | Sets the header background after the page is scrolled. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#0d0d10d9` | — |
| **Header control glass**<br>`--ng-chrome-glass` | Sets the background of grouped header controls. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#34343bb8` | — |
| **Home header glass**<br>`--ng-home-chrome-glass` | Sets the translucent header-control background on Home. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#30303880` | Without backdrop blur: var(--ng-nav-solid) |
| **Home selected tab**<br>`--ng-home-selected-glass` | Sets the background of the selected Home tab. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#f3f3f5bd` | Without backdrop blur: var(--ng-nav-selection) |
| **Home secondary actions**<br>`--ng-home-secondary-glass` | Sets the layered glass background of secondary Home actions. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(145deg, #ffffff24, #ffffff0a), #27272d80` | Without backdrop blur: var(--ng-secondary-bg) |
| **Home secondary hover**<br>`--ng-home-secondary-hover-glass` | Sets the glass background when secondary Home actions are hovered. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(145deg, #ffffff35, #ffffff16), #27272d8c` | Without backdrop blur: var(--ng-secondary-hover) |
| **Home glass border**<br>`--ng-home-glass-border` | Colors the outline of glass controls on Home. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff42` | — |
| **Header control hover**<br>`--ng-chrome-hover` | Sets the background when header controls are hovered. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff36` | — |
| **Header control border**<br>`--ng-chrome-border` | Colors the outline of header controls. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff30` | — |
| **Header border thickness**<br>`--ng-chrome-border-width` | Sets the thickness of header-control borders. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `1px` | — |
| **Header icon size**<br>`--ng-chrome-icon-size` | Sets the size of shapes inside header controls. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `21px` | — |
| **Header button size**<br>`--ng-chrome-button-size` | Sets the width and height of circular header buttons. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `44px` | Mobile (up to 48rem): 44px |
| **Header button spacing**<br>`--ng-chrome-group-gap` | Sets spacing between controls in a header group. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `3px` | — |
| **Header tab height**<br>`--ng-chrome-tab-height` | Sets the height of navigation tabs in the header. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `42px` | — |
| **Header group padding**<br>`--ng-chrome-group-padding` | Sets the space inside each header-control group. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `4px` | Mobile (up to 48rem): 2px |

</details>

<details>
<summary>Cards & shared spacing</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Page side padding**<br>`--ng-gutter` | Sets the shared side padding around content and artwork text. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(16px, 4vw, 72px)` | — |
| **Extra-small spacing**<br>`--ng-space-xs` | Sets the smallest shared gap and padding size. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `8px` | — |
| **Small spacing**<br>`--ng-space-sm` | Sets small shared gaps and control padding. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `12px` | — |
| **Medium spacing**<br>`--ng-space-md` | Sets medium shared gaps and control padding. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `18px` | — |
| **Large spacing**<br>`--ng-space-lg` | Sets large shared gaps and section padding. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `24px` | — |
| **Section spacing**<br>`--ng-section-space` | Sets the breathing room between shelves and large sections. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(40px, 5vw, 80px)` | — |
| **Shelf poster width**<br>`--ng-poster-width` | Sets the width of posters in layouts that use the shared card width. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(190px, 15vw, 240px)` | Mobile (up to 48rem): 160px |
| **Landscape card width**<br>`--ng-landscape-width` | Sets the shared width of landscape cards. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(260px, 25vw, 380px)` | Mobile (up to 48rem): 280px |
| **Cast portrait width**<br>`--ng-person-width` | Sets the width of cast and person cards. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `144px` | — |
| **Card hover lift**<br>`--ng-card-lift` | Moves cards vertically when hovered. | Signed CSS length/percentage; calc() also works<br>Examples: `-2px`, `0px`, `calc(100% - 100vw + 48px)` | `-2px` | Reduced motion: 0px |
| **Small corners**<br>`--ng-radius-small` | Controls rounding on small controls and badges. | Non-negative CSS length or percentage<br>Examples: `14px`, `50%` | `6px` | — |
| **Panel corners**<br>`--ng-radius-panel` | Controls rounding on larger panels and grouped controls. | Non-negative CSS length or percentage<br>Examples: `14px`, `50%` | `20px` | — |
| **Pill corners**<br>`--ng-radius-pill` | Controls rounding on pill-shaped buttons and circular controls. | Non-negative CSS length or percentage<br>Examples: `14px`, `50%` | `999px` | — |
| **Shared button height**<br>`--ng-control-height` | Sets the minimum height of ordinary theme buttons. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `54px` | Mobile (up to 48rem): 48px |
| **Shared button padding**<br>`--ng-control-padding` | Sets horizontal padding inside ordinary theme buttons. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `30px` | Mobile (up to 48rem): 26px |
| **Artwork hover gradient**<br>`--ng-overlay-scrim` | Sets the gradient behind card hover overlays. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(to top, #0009, transparent 75%)` | — |
| **Watched-progress thickness**<br>`--ng-progress-height` | Sets the thickness of progress strips on cards. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `3px` | — |
| **Watched-progress track**<br>`--ng-progress-track` | Colors the unfilled portion of card progress strips. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff29` | — |
| **Poster action glass**<br>`--ng-poster-actions-bg` | Sets the background of the poster action capsule. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#151519d9` | — |
| **Poster action button size**<br>`--ng-poster-action-size` | Sets the size of secondary buttons inside poster overlays. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `40px` | Mobile (up to 48rem): 44px |
| **Poster Play button size**<br>`--ng-poster-play-size` | Sets the size of the main Play button on poster overlays. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `54px` | — |
| **Poster action spacing**<br>`--ng-poster-action-gap` | Sets spacing between buttons inside the poster action capsule. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `3px` | — |
| **Poster action edge spacing**<br>`--ng-poster-action-inset` | Sets the capsule’s distance from the poster’s bottom and right edges. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `12px` | — |
| **Poster action padding**<br>`--ng-poster-action-padding` | Sets padding inside the poster action capsule. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `6px` | — |

</details>

<details>
<summary>Artwork & featured Home</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Detail content width**<br>`--ng-hero-content-width` | Limits the width of primary detail-page content. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `680px` | — |
| **Overview width**<br>`--ng-hero-overview-width` | Limits the width of descriptions over hero artwork. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `580px` | — |
| **Detail artwork gradient**<br>`--ng-hero-scrim` | Sets the gradients that keep detail text readable over artwork. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(90deg, #000000ad 0%, #00000040 42%, transparent 76%), linear-gradient(0deg, #000 0%, #000000a1 16%, #0000000d 66%, transparent)` | — |
| **Detail page background**<br>`--ng-detail-background` | Sets the background transition beneath detail artwork. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(to bottom, transparent 0, transparent var(--ng-hero-height), var(--ng-bg) var(--ng-hero-height))` | — |
| **Backdrop fade**<br>`--ng-backdrop-mask` | Controls how global backdrop artwork fades into the page. | CSS image: a gradient or none<br>Examples: `linear-gradient(to bottom,#000,transparent)`, `none` | `linear-gradient(to bottom, #000 0%, #000 50%, transparent 100%)` | — |
| **Artwork logo width**<br>`--ng-logo-width` | Sets the width of clear-logo artwork. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(280px, 43vw, 620px)` | Mobile (up to 48rem): min(84vw, 440px) |
| **Artwork logo height**<br>`--ng-logo-height` | Limits the height of clear logos and related detail spacing. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(80px, 11vw, 160px)` | Mobile (up to 48rem): 100px |
| **Detail logo top offset**<br>`--ng-logo-top` | Positions clear logos vertically on detail pages. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `max(160px, calc(var(--ng-hero-height) - 520px))` | Mobile (up to 48rem): clamp(192px, 34svh, 320px) |
| **Detail logo stacking**<br>`--ng-logo-layer` | Sets the stacking order of the detail logo. | Integer stacking order or auto<br>Examples: `1`, `2`, `auto` | `1` | — |
| **Artwork crop position**<br>`--ng-image-position` | Selects which part of artwork stays visible when it is cropped. | CSS position keywords, percentages, or lengths<br>Examples: `center top`, `50% 50%` | `center top` | — |
| **Featured content width**<br>`--ng-feature-content-width` | Limits the width of text and actions in the Home carousel. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `620px` | — |
| **Featured artwork gradient**<br>`--ng-feature-scrim` | Sets the gradients behind featured text and controls. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(90deg, #000000b5, #0000004d 46%, transparent 76%), linear-gradient(0deg, #000 0%, #00000091 18%, #00000012 56%, transparent)` | — |
| **Featured fallback background**<br>`--ng-feature-gradient` | Sets the carousel background beneath its artwork. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `radial-gradient(circle at 70% 25%, #38383d 0%, #1b1b1e 52%, #000 100%)` | — |
| **Inactive pagination color**<br>`--ng-feature-dot` | Colors inactive carousel pagination indicators. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff73` | — |
| **Active pagination color**<br>`--ng-feature-dot-active` | Colors the selected carousel pagination indicator. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#fff` | — |
| **Pagination dot size**<br>`--ng-feature-dot-size` | Sets the size of inactive carousel pagination dots. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `6px` | — |
| **Active pagination width**<br>`--ng-feature-dot-active-width` | Sets the width of the selected pagination indicator. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `22px` | — |
| **Carousel animation speed**<br>`--ng-feature-slide-duration` | Sets the duration of the slide animation between featured titles. | Non-negative CSS time in ms or s<br>Examples: `180ms`, `650ms`, `0ms` | `650ms` | Reduced motion: var(--ng-reduced-duration) |

</details>

<details>
<summary>Details, tracks & episodes</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Episode image width**<br>`--ng-episode-image-width` | Sets the artwork width in episode cards. | Non-negative CSS length or percentage<br>Examples: `100%`, `240px` | `100%` | Mobile (up to 48rem): 100% |
| **Episode columns**<br>`--ng-episode-columns` | Sets the number and sizing of episode-card columns. | CSS grid track list using lengths, fr, repeat(), or minmax()<br>Examples: `repeat(2,minmax(0,1fr))`, `minmax(0,1fr)` | `repeat(2, minmax(0, 1fr))` | Mobile (up to 48rem): minmax(0, 1fr) |
| **Episode content columns (reserved)**<br>`--ng-episode-content-columns` | Reserves an inner-column layout with no current visual effect. | CSS grid track list using lengths, fr, repeat(), or minmax()<br>Examples: `repeat(2,minmax(0,1fr))`, `minmax(0,1fr)` | `minmax(0, 1fr)` | Mobile (up to 48rem): minmax(0, 1fr) |
| **Track selector surface**<br>`--ng-track-surface` | Sets the background of Video, Audio, and Subtitles selectors. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#24242abb` | — |
| **Track selector hover**<br>`--ng-track-hover` | Sets the background when track selectors are hovered. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#35353dc9` | — |
| **Track selector border**<br>`--ng-track-border` | Colors the outline of track selectors. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff2b` | — |
| **Track selector height**<br>`--ng-track-row-height` | Sets the minimum height of each track-selector row. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `66px` | Mobile (up to 48rem): 62px |
| **Track icon size**<br>`--ng-track-icon-size` | Sets the screen, speaker, and subtitle icon sizes. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `20px` | — |
| **Track label text size**<br>`--ng-track-label-size` | Sets the size of Video, Audio, and Subtitles labels. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `13px` | — |
| **Track label width**<br>`--ng-track-label-width` | Sets the space allocated to track-selector labels. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `112px` | — |
| **Track value end padding**<br>`--ng-track-select-end-padding` | Keeps selected track text away from the dropdown arrow. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `34px` | — |
| **Format badge vertical offset**<br>`--ng-track-badge-pull` | Adjusts the top margin of source-format badges. | Signed CSS length/percentage; calc() also works<br>Examples: `-2px`, `0px`, `calc(100% - 100vw + 48px)` | `-8px` | — |
| **Format badge background**<br>`--ng-format-badge-bg` | Sets the background of source-format badges. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff1c` | — |
| **Format badge border**<br>`--ng-format-badge-border` | Colors the outline of source-format badges. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff38` | — |
| **Format badge height**<br>`--ng-format-badge-height` | Sets the minimum height of source-format badges. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `24px` | — |
| **Format badge text size**<br>`--ng-format-badge-font-size` | Sets the text size inside source-format badges. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `11px` | — |
| **Episode card surface**<br>`--ng-episode-surface` | Sets the background of episode cards. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#1d1d21` | — |
| **Episode card hover**<br>`--ng-episode-hover` | Sets the background when episode cards are hovered. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#29292f` | — |
| **Episode card border**<br>`--ng-episode-border` | Colors the outline of episode cards. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff19` | — |
| **Episode action button size**<br>`--ng-episode-action-size` | Sets the size of buttons in the episode action dock. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `40px` | Mobile (up to 48rem): 44px |
| **Episode dock padding**<br>`--ng-episode-dock-padding` | Sets padding inside the episode action dock. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `5px` | — |
| **Episode dock button spacing**<br>`--ng-episode-dock-gap` | Sets spacing between episode action buttons. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `2px` | — |
| **Episode dock glass**<br>`--ng-episode-dock-bg` | Sets the background of the episode action dock. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#37373ec9` | — |
| **Episode dock border**<br>`--ng-episode-dock-border` | Colors the outline of the episode action dock. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff38` | — |
| **Episode hover lift**<br>`--ng-episode-card-lift` | Moves episode cards vertically when hovered. | Signed CSS length/percentage; calc() also works<br>Examples: `-2px`, `0px`, `calc(100% - 100vw + 48px)` | `-3px` | — |

</details>

<details>
<summary>Search & login</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Search heading size**<br>`--ng-search-heading-size` | Sets the size of headings on Search. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(26px, 2.5vw, 38px)` | — |
| **Search content width**<br>`--ng-search-content-width` | Limits the width of the main Search area. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `880px` | — |
| **Search field height**<br>`--ng-search-field-height` | Sets the height of the Search input field. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `72px` | Mobile (up to 48rem): 58px |
| **Search field glass**<br>`--ng-search-field-bg` | Sets the background of the Search input field. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#2b2b30b8` | — |
| **Search line spacing**<br>`--ng-search-input-line-height` | Controls vertical line spacing inside the Search field. | Unitless line-height multiplier or normal<br>Examples: `1.2`, `1.5`, `normal` | `1.2` | — |
| **Search field padding**<br>`--ng-search-input-padding` | Sets the space between Search text and the field edges. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `28px` | Mobile (up to 48rem): 18px |
| **Search placeholder color**<br>`--ng-search-placeholder` | Colors placeholder text in the Search field. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ebebf58c` | — |
| **Search tile width**<br>`--ng-search-tile-width` | Sets the width of small Search tiles such as genres. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `220px` | — |
| **Search tile height**<br>`--ng-search-tile-height` | Sets the minimum height of small Search tiles. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `96px` | — |
| **Login panel width**<br>`--ng-login-width` | Limits the width of the login form. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `440px` | — |
| **Login panel padding**<br>`--ng-login-padding` | Sets padding inside the login panel. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(24px, 4vw, 48px)` | — |
| **Login background**<br>`--ng-login-background` | Sets the background behind the login form. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(135deg, #16161a, #0d0d10 60%, #000)` | — |
| **Login heading size**<br>`--ng-login-title-size` | Sets the size of the login heading. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `32px` | — |

</details>

<details>
<summary>Player controls</summary>

| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |
| --- | --- | --- | --- | --- |
| **Player gradient base**<br>`--ng-player-scrim` | Supplies the dark color used within the bottom player gradient. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#121215db` | — |
| **Player top gradient**<br>`--ng-player-top-scrim` | Sets the gradient behind the player’s top controls. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(to bottom, #000000b8, transparent)` | — |
| **Player bottom gradient**<br>`--ng-osd-glass` | Sets the full-width fading background behind the player controls. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `linear-gradient(to bottom, transparent 0%, var(--ng-player-scrim) 48%, #000000e8 100%)` | — |
| **Player backdrop blur**<br>`--ng-osd-blur` | Controls blur behind the bottom player surface and defaults to none. | Backdrop-filter functions or none<br>Examples: `blur(24px) saturate(160%)`, `none` | `none` | Without backdrop blur: none |
| **Player surface corners**<br>`--ng-osd-radius` | Controls rounding on the bottom player surface. | Non-negative CSS length or percentage<br>Examples: `14px`, `50%` | `0px` | — |
| **Player surface padding**<br>`--ng-osd-padding` | Sets padding around the bottom player controls. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `clamp(20px, 3vw, 44px)` | — |
| **Player control gap (reserved)**<br>`--ng-player-control-gap` | Reserves a control-spacing value with no current visual effect. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `6px` | — |
| **Player dock glass**<br>`--ng-player-dock-bg` | Sets the translucent background of the two player-control docks. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#2b2b318c` | Without backdrop blur: var(--ng-nav-solid) |
| **Player dock border**<br>`--ng-player-dock-border` | Colors the outline of player-control docks. | CSS color: hex, rgb/rgba, hsl/hsla, or a named color<br>Examples: `#f5f5f7`, `rgba(255,255,255,.65)` | `#ffffff47` | — |
| **Player dock padding**<br>`--ng-player-dock-padding` | Sets padding inside player-control docks. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `6px` | — |
| **Player dock button spacing**<br>`--ng-player-dock-gap` | Sets spacing between buttons inside player-control docks. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `3px` | — |
| **Transport dock offset**<br>`--ng-player-transport-offset` | Positions the transport dock relative to the player’s bottom layout. | Signed CSS length/percentage; calc() also works<br>Examples: `-2px`, `0px`, `calc(100% - 100vw + 48px)` | `calc(100% - 100vw + 2 * var(--ng-osd-padding) + var(--ng-space-sm))` | — |
| **Player icon size**<br>`--ng-player-icon-size` | Sets the size of shapes inside player buttons. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `23px` | Mobile (up to 48rem): 21px |
| **Player title size**<br>`--ng-player-title-size` | Sets the text size of the title displayed in the player. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `21px` | Mobile (up to 48rem): 17px |
| **Timeline background**<br>`--ng-player-timeline-track` | Colors the unfilled portion of the playback timeline. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff59` | — |
| **Chapter marker color**<br>`--ng-player-chapter-tick` | Colors chapter markers along the timeline. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff73` | — |
| **Player button hover**<br>`--ng-player-control-hover` | Sets the background when player buttons are hovered. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#ffffff30` | — |
| **Active player button**<br>`--ng-player-control-active` | Sets the background of active player controls. | CSS background: color, gradient, layered backgrounds, or none<br>Examples: `#22222680`, `linear-gradient(135deg,#ffffff24,#ffffff0a), #27272d80` | `#f2f2f5` | — |
| **Timeline thickness**<br>`--ng-player-timeline-height` | Sets the thickness of the playback timeline. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `4px` | — |
| **Player bottom spacing**<br>`--ng-player-bottom-padding` | Sets extra padding below the player controls. | Non-negative CSS length (px, rem, vw, svh); min(), max(), and clamp() also work<br>Examples: `24px`, `clamp(16px,2vw,32px)` | `22px` | — |

</details>
<!-- variables:end -->

## Three ready-to-use scenarios

### 1. Roomier Library

Use this after the import for more space between posters and softer card corners; it does not change the number of grid columns.

```css
:root {
  --ng-card-gap: 32px;
  --ng-library-grid-gap: 40px;
  --ng-radius-card: 18px;
}
```

### 2. Softer glass controls

Use this after the import for more transparent navigation and header groups with a gentler blur.

```css
:root {
  --ng-nav-glass: #22222680;
  --ng-chrome-glass: #34343b80;
  --ng-control-blur: blur(24px) saturate(160%);
}
```

### 3. More room on mobile

Use this after the import to shorten the plugin’s featured Home hero and adjust featured titles and Search text on screens up to `48rem` wide.

```css
@media (max-width: 48rem) {
  :root {
    --ng-feature-height: 66svh;
    --ng-feature-title-size: clamp(32px, 8vw, 44px);
    --ng-search-input-font-size: 20px;
  }
}
```

