# Design System — GDG HUST Internal Hackathon

> Style: **Google / Material Design 3** — airy, rounded, light borders, restrained use of Google colors.
> UI language: **Vietnamese** (technical English terms are kept where natural). This document is written in English.

## 0. References

| Source | Used for |
|---|---|
| [Material Design 3](https://m3.material.io/) | Color roles, type scale, shape, elevation, motion |
| [Material Web tokens](https://github.com/material-components/material-web/tree/main/tokens) (Apache-2.0) | Exact token values (v0.192) |
| [Sign in with Google Branding Guidelines](https://developers.google.com/identity/branding-guidelines) | Google sign-in button |
| [Google for Developers](https://developers.google.com/) | Font stack, spacing, look and feel |
| [Google Fonts](https://fonts.google.com/) | Roboto, Roboto Mono, Material Symbols |
| [GDG Community](https://developers.google.com/community/gdg) | GDG brand spirit |

---

## 1. Design principles

1. **Content leads** — generous whitespace, few dividers, no decorative noise.
2. **One primary action per screen** — a filled Google-blue button.
3. **Rounded shapes and light borders** — cards use a 1px border and a very soft shadow; avoid heavy shadows.
4. **Google's four colors are seasoning, not the meal** — neutral backgrounds; brand colors are reserved for accents, tags, and illustrations.
5. **Motion with purpose** — 150–250ms, no bounce, honor `prefers-reduced-motion`.
6. **Clarity over decoration** — clear labels, clear states, error messages that explain how to fix the problem.

---

## 2. Brand

### 2.1 Google brand colors

| Name | Hex | Use |
|---|---|---|
| Google Blue | `#4285F4` | Logo, accents, illustrations |
| Google Red | `#EA4335` | Accents, light emphasis (not as a text background) |
| Google Yellow | `#FBBC05` | Accents, highlights |
| Google Green | `#34A853` | Success states, accents |

**Suggested ratio:** 90% neutral surfaces (white/gray), 7% primary blue, 3% the other three colors.

### 2.2 GDG HUST logo

- Use the **official logo lockup** supplied by the organizers (GDG + HUST). Do not redraw it.
- Clear space = the height of the letter "G" × 1.
- Never stretch, recolor, or place it on a busy background.
- Use the light version on dark backgrounds and the original on light backgrounds.

---

## 3. Color tokens

### 3.1 Light theme

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#1A73E8` | Primary CTA, links, active tabs, focus |
| `--color-on-primary` | `#FFFFFF` | Text/icons on primary |
| `--color-primary-hover` | `#1765CC` | Hover |
| `--color-primary-active` | `#185ABC` | Pressed |
| `--color-primary-container` | `#D3E3FD` | Chip/badge background, active nav |
| `--color-on-primary-container` | `#041E49` | Text on primary-container |
| `--color-background` | `#F8F9FA` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, dialogs, app bar |
| `--color-surface-container` | `#F1F3F4` | Secondary surfaces, row hover |
| `--color-surface-container-high` | `#E8EAED` | Tracks, skeletons, pressed state |
| `--color-on-surface` | `#1F1F1F` | Primary text |
| `--color-on-surface-variant` | `#5F6368` | Secondary text, captions, placeholders |
| `--color-outline` | `#747775` | Input borders, interactive outlines |
| `--color-outline-variant` | `#DADCE0` | Dividers, card borders |
| `--color-success` | `#188038` | Success text/icons |
| `--color-success-container` | `#E6F4EA` | Success background |
| `--color-on-success-container` | `#0D652D` | Text on success background |
| `--color-warning` | `#B06000` | Warning text/icons (contrast-safe) |
| `--color-warning-container` | `#FEF7E0` | Warning background |
| `--color-on-warning-container` | `#7A5900` | Text on warning background |
| `--color-error` | `#B3261E` | Error text/icons |
| `--color-error-container` | `#F9DEDC` | Error background |
| `--color-on-error-container` | `#410E0B` | Text on error background |
| `--color-focus-ring` | `#1A73E8` | Focus ring |
| `--color-scrim` | `rgba(0,0,0,.32)` | Dialog overlay |

### 3.2 Dark theme

| Token | Hex |
|---|---|
| `--color-primary` | `#8AB4F8` |
| `--color-on-primary` | `#062E6F` |
| `--color-primary-hover` | `#A8C7FA` |
| `--color-primary-active` | `#D3E3FD` |
| `--color-primary-container` | `#0842A0` |
| `--color-on-primary-container` | `#D3E3FD` |
| `--color-background` | `#131314` |
| `--color-surface` | `#1E1F20` |
| `--color-surface-container` | `#282A2C` |
| `--color-surface-container-high` | `#303134` |
| `--color-on-surface` | `#E3E3E3` |
| `--color-on-surface-variant` | `#9AA0A6` |
| `--color-outline` | `#8E918F` |
| `--color-outline-variant` | `#444746` |
| `--color-success` | `#81C995` |
| `--color-success-container` | `#0F5223` |
| `--color-on-success-container` | `#CEEAD6` |
| `--color-warning` | `#FDD663` |
| `--color-warning-container` | `#4D3D00` |
| `--color-on-warning-container` | `#FEEFC3` |
| `--color-error` | `#F2B8B5` |
| `--color-error-container` | `#8C1D18` |
| `--color-on-error-container` | `#F9DEDC` |
| `--color-focus-ring` | `#8AB4F8` |
| `--color-scrim` | `rgba(0,0,0,.6)` |

### 3.3 Color rules

- Use **semantic tokens only**; never hardcode hex values in components.
- Color is never the only signal: every state also has an icon and text.
- Normal text must meet **WCAG AA 4.5:1**; large text (≥24px or ≥19px bold) must meet 3:1.
- Input borders use `outline`, not `outline-variant`.

---

## 4. Typography

### 4.1 Font stack

```css
--font-sans: "Google Sans", "Google Sans Text", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "Google Sans Code", "Roboto Mono", ui-monospace, SFMono-Regular, monospace;
```

- Google Sans is proprietary and **not available on public Google Fonts**. Standard fallback: **Roboto** (load 400/500/700 from Google Fonts).
- Code, student IDs, and tabular numbers: **Roboto Mono**.
- Icons: **Material Symbols Outlined** (weight 400, grade 0, optical size 24).

### 4.2 Type scale

| Token | Size / Line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display-large` | 57 / 64 | 400 | -0.25px | Landing hero (desktop) |
| `display-medium` | 45 / 52 | 400 | 0 | Landing hero |
| `display-small` | 36 / 44 | 400 | 0 | Mobile hero, large stats |
| `headline-large` | 32 / 40 | 400 | 0 | Section title |
| `headline-medium` | 28 / 36 | 400 | 0 | Page title |
| `headline-small` | 24 / 32 | 400 | 0 | Large card title |
| `title-large` | 22 / 28 | 400 | 0 | Team name, dialog title |
| `title-medium` | 16 / 24 | 500 | 0.15px | Card title, group label |
| `title-small` | 14 / 20 | 500 | 0.1px | Subheading |
| `body-large` | 16 / 24 | 400 | 0.5px | Main body text |
| `body-medium` | 14 / 20 | 400 | 0.25px | Secondary body, descriptions |
| `body-small` | 12 / 16 | 400 | 0.4px | Captions, helper text |
| `label-large` | 14 / 20 | 500 | 0.1px | Buttons, tabs, navigation |
| `label-medium` | 12 / 16 | 500 | 0.5px | Chips, badges |
| `label-small` | 11 / 16 | 500 | 0.5px | Overline, metadata |

### 4.3 Rules

- At most **two font families** per screen (sans + mono).
- Body lines max **65–75 characters**.
- Do not uppercase headings; use sentence case.
- Numbers (countdowns, member counts) use `tabular-nums`.

---

## 5. Spacing and layout

### 5.1 Spacing scale (4px grid)

`0 · 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 56 · 64 · 80 · 96`

| Purpose | Value |
|---|---|
| Chip/badge padding | 8 / 12 |
| Button padding | 16 / 24 |
| Card padding | 16 (mobile) / 24 (desktop) |
| Gap between list items | 12 / 16 |
| Gap between cards | 16 / 24 |
| Gap between landing sections | 64 (mobile) / 80–96 (desktop) |

### 5.2 Breakpoints

| Name | Range | Margin | Columns |
|---|---|---|---|
| Compact | < 600px | 16px | 4 |
| Medium | 600–839px | 24px | 8 |
| Expanded | 840–1199px | 24px | 12 |
| Large | 1200–1599px | 32px | 12 |
| Extra-large | ≥ 1600px | auto | 12 |

- Content container: `max-width: 1200px` (landing may use 1280px).
- Dashboard: **256px** side navigation + content; on mobile it becomes a bottom nav or horizontally scrollable tabs.
- Landing hero: text max 640px, left-aligned; illustration on the right.

---

## 6. Shape (corner radius)

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 4px | Google Sign-In button, small badges |
| `radius-sm` | 8px | Snackbars, small tags |
| `radius-md` | 12px | Inputs, secondary buttons, menus |
| `radius-lg` | 16px | Standard cards |
| `radius-xl` | 28px | Large cards, dialogs, hero panels |
| `radius-full` | 9999px | Primary buttons, chips, avatars, active nav |

- Primary action buttons: **pill (full)**.
- Cards: **16px**; dialogs and large panels: **28px**.
- Inputs: **12px**.

---

## 7. Elevation

Prefer **border + soft shadow**. Only dialogs and popovers use stronger shadows.

```css
--elevation-0: none;
--elevation-1: 0 1px 2px rgba(0,0,0,.12), 0 1px 3px 1px rgba(0,0,0,.08);
--elevation-2: 0 1px 2px rgba(0,0,0,.12), 0 2px 6px 2px rgba(0,0,0,.08);
--elevation-3: 0 1px 3px rgba(0,0,0,.12), 0 4px 8px 3px rgba(0,0,0,.08);
--elevation-4: 0 2px 3px rgba(0,0,0,.12), 0 6px 10px 4px rgba(0,0,0,.08);
--elevation-5: 0 4px 4px rgba(0,0,0,.12), 0 8px 12px 6px rgba(0,0,0,.08);
```

| Level | Use |
|---|---|
| 0 | Backgrounds, flat cards |
| 1 | Card hover, app bar |
| 2 | Dropdowns, menus |
| 3 | Small dialogs, popovers |
| 4–5 | Large dialogs, important modals |

---

## 8. Iconography

- Icon set: **Material Symbols Outlined**.
- Sizes: 18px (in buttons), 20px (nav/list), 24px (default), 48px (empty state).
- Color follows `currentColor`.
- Active states may use the **Filled** variant.
- Icon-only buttons require an `aria-label` and a tooltip.
- Do not use emoji as functional icons.

---

## 9. Components

### 9.1 Button

| Property | Value |
|---|---|
| Height | 40px (default), 32px (small), 48px (large) |
| Radius | full |
| Padding | 0 24px (with icon: 0 16px) |
| Label | `label-large` 14/20, weight 500 |
| Icon | 18px, 8px gap from label |
| Focus | 2px `focus-ring` ring, 2px offset |
| Disabled | 12% on-surface background, 38% text |

Variants:

- **Filled** — `primary` background, `on-primary` text. One primary CTA per screen.
- **Tonal** — `primary-container` background, `on-primary-container` text. Secondary actions.
- **Outlined** — transparent background, 1px `outline` border, `primary` text.
- **Text** — no background, `primary` text, 0 12px padding.
- **Destructive** — `error` background, `on-error` text (confirmation dialogs only).

### 9.2 Sign in with Google

Per the Google Branding Guidelines:

| Property | Light | Dark |
|---|---|---|
| Fill | `#FFFFFF` | `#131314` |
| Border | 1px `#747775` | 1px `#8E918F` |
| Text | `#1F1F1F` | `#E3E3E3` |
| Font | Google Sans Medium 14/20 | Google Sans Medium 14/20 |
| Height | 40px | 40px |
| Width | 188px (standard) | 188px |
| Radius | 4px | 4px |
| "G" logo | 18×18, never recolor or resize | 18×18 |
| Padding | 12px left · 10px after logo · 12px after text | same |

- Prefer the **Google Identity Services SDK** so Google renders the button.
- Do not build a custom Google button; do not recolor the "G" logo.

### 9.3 Text field

| Property | Value |
|---|---|
| Height | 56px |
| Radius | 12px |
| Border | 1px `outline` |
| Padding | 16px |
| Label | `body-small` 12/16, above the field or floating |
| Text | `body-large` 16/24 |
| Helper/Error | `body-small` 12/16 |
| Focus | 2px `primary` border |
| Error | 2px `error` border, helper in `error` |
| Disabled | `surface-container` background, 38% text |

- Labels are always visible; do not use a placeholder as a label.
- Show errors directly below the field and explain how to fix them.
- Textareas share the style and have a 120px minimum height.

### 9.4 Card

- Radius 16px (small) / 24px (large), padding 24px.
- `surface` background, 1px `outline-variant` border.
- Hover: `elevation-1` + `outline` border (clickable cards only).
- No heavy shadow by default.

**Team card:** team name (`title-large`), recruiting status chip, two-line description, skill chips, member avatars + `3/5`, "Request to join" CTA.

**Participant card:** avatar (Google, read-only), name, headline, student ID/major/cohort (`body-small`), up to 5 skill bars from the BTC catalog, preferred-role chips, contact icons (email, Facebook, GitHub), "Looking for a team" toggle, "Invite to team" CTA.

### 9.5 Tabs

- Height 48px, `label-large` label, active `primary`, inactive `on-surface-variant`.
- Indicator 3px, radius 3px 3px 0 0, `primary` color.
- Hover: `surface-container` background.
- Mobile: horizontal scroll with hidden scrollbar, or bottom navigation.

### 9.6 Chip / Role tag

- Height 32px, full radius, 0 12px padding, `label-medium` label.
- Default: `surface-container` background, `on-surface-variant` text.
- Selected: `primary-container` background, `on-primary-container` text.
- May include a 6px dot for grouping.
- Used for preferred roles and filter chips; skills use the skill bar instead.

### 9.7 Skill bar

Used to summarize proficiency (1–5):

```
Frontend  ████████░░  4/5
Backend   ██████░░░░  3/5
```

- Track 6px tall, full radius, `surface-container-high`.
- Fill in `primary`, full radius.
- Left label `body-medium`, right value `label-medium` + `tabular-nums`.
- Show up to 5 skills per person, selected from the BTC-managed catalog. No
  free-text skills.

### 9.8 Avatar

- Sizes 32 / 40 / 48 / 64px, full radius.
- Avatar comes from the Google account and is **read-only**; do not offer an
  upload control.
- Fallback: initials on `primary-container`, text in `on-primary-container`.
- Stacked avatars overlap by -8px with a 2px `surface` border.

### 9.9 Dialog

- Max-width 560px, radius 28px, padding 24px, `surface` background.
- Scrim `--color-scrim`.
- Title `title-large`, body `body-medium`.
- At most two actions: text button (cancel) + filled button (confirm).
- Mobile: bottom sheet or full-width dialog.

### 9.10 Snackbar / Toast

- Radius 8px, `inverse-surface` background, `inverse-on-surface` text.
- Min-height 48px, padding 16px, 24px from the bottom, centered.
- Auto-dismiss after 4s; include an "Undo" action when appropriate.
- `aria-live="polite"`.

### 9.11 Empty state

- 48px icon in `on-surface-variant`.
- Title `title-large`.
- Description `body-medium`, max two lines.
- One primary CTA.

### 9.12 Navigation

- **Top app bar:** 64px tall, `surface` background, 1px `outline-variant` bottom border; logo left, nav center/right, avatar right.
- **Side nav (desktop):** 256px wide; items 44px tall, full radius, active background `primary-container`, 20px icon + `label-large` label.
- **Bottom nav (mobile):** 80px tall, 3–5 items, 24px icon + `label-medium` label, active in `primary`.
- **Dashboard tabs:** Overview · My team · Find a team · Find teammates · Profile · Admin.

### 9.13 Data table (admin)

- Header `label-large`, 56px rows, 1px `outline-variant` dividers.
- Hover row `surface-container`.
- Numeric columns right-aligned with `tabular-nums`.
- Mobile: collapse into a card list.

### 9.14 Countdown / deadline chip

- Chip background `warning-container`, text `on-warning-container` when the deadline is near.
- `error-container` background when overdue.
- Include a `schedule` icon and text such as "2 days 14 hours left".
- Use `tabular-nums`.

### 9.15 Profile form

| Section | Fields |
|---|---|
| Identity | Google avatar (read-only), read-only Google email, full name, student ID, major, cohort |
| Contact | Contact email, Facebook, GitHub |
| About | Headline (single line, 120 chars), bio (textarea, 600 chars) |
| Skills | Skill picker: up to 5 active skills from the BTC catalog, each with a level 1–5; preferred roles |
| Team | "Open to invites" switch with helper text |

- The header shows a **profile completeness bar** computed from required fields,
  plus one "Complete profile" CTA.
- The save button is sticky at the bottom on mobile.
- Validate inline; URL fields have a leading icon and accept only `https://`.
- Guard against unsaved changes when navigating away.
- Skill picker: searchable multi-select capped at 5. Each selection shows a 1–5
  selector and a live skill bar preview. Skills outside the active catalog are
  disabled.
- Avatar and Google email are displayed but not editable.
- Do not add fields for experience level, years, hackathon count, weekly hours,
  phone, or free-text tech stack.

### 9.16 Announcement card

- Radius 16px, padding 24px, `surface` background, 1px `outline-variant` border.
- Pinned badge (`label-medium`, `primary-container`) + title `title-large` +
  timestamp `label-small`.
- Body is sanitized Markdown: `body-medium`, max 60ch. Headings map to
  `title-medium`; lists indent 16px.
- Links use `primary`, underline on hover, 16px external-link icon, and
  `rel="noopener noreferrer"`.
- Allowed Markdown: paragraphs, headings, bold, italic, inline code, links, and
  ordered/unordered lists. No raw HTML, images, or iframes.
- Admin editor: "Write / Preview" tabs; preview uses the same sanitizer as the
  public page.

---

## 10. Motion

| Type | Duration | Easing |
|---|---|---|
| Hover / focus | 100–150ms | `cubic-bezier(.2,0,0,1)` |
| Menu, tooltip | 150ms | `cubic-bezier(.2,0,0,1)` |
| Dialog, bottom sheet | 200ms | `cubic-bezier(.2,0,0,1)` |
| Page transition | 250ms | `cubic-bezier(.2,0,0,1)` |
| Skeleton shimmer | 1200ms loop | `linear` |

- Animate only `transform` and `opacity`.
- No bounce or elastic easing.
- `@media (prefers-reduced-motion: reduce)` → disable animations; keep transitions at 0.01ms.

---

## 11. Accessibility

- Minimum standard: **WCAG 2.1 AA**.
- Visible focus: 2px ring, 2px offset; never `outline: none` without a replacement.
- Minimum touch target **48×48px**.
- Every input has a `<label>`; errors use `aria-describedby` + `aria-invalid`.
- Icon-only buttons have an `aria-label`.
- Dialogs trap focus, close on `Esc`, and return focus to the trigger.
- Never use color as the only signal.
- `html lang="vi"`.
- Images have `alt`; decorative images use `alt=""`.

---

## 12. Content style (Vietnamese)

- Sentence case: "Tạo đội", not "TẠO ĐỘI".
- Buttons start with a verb: "Tạo đội", "Gửi lời mời", "Duyệt đơn".
- Neutral address: "bạn"; avoid "anh/chị/em".
- Error messages explain how to fix the problem: "Email này chưa có trong danh sách thí sinh. Liên hệ BTC để được thêm."
- Dates: `dd/MM/yyyy HH:mm`, timezone `Asia/Ho_Chi_Minh`.
- Counts: "3/5 thành viên", "Còn 2 ngày".
- Team status: `Đang tuyển` · `Đã đủ` · `Đã khóa`.
- Request status: `Chờ duyệt` · `Đã duyệt` · `Từ chối` · `Đã huỷ`.

---

## 13. Tailwind mapping

Tailwind v4 (`@theme`):

```css
@import "tailwindcss";

@theme {
  /* Brand */
  --color-brand-blue:   #4285F4;
  --color-brand-red:    #EA4335;
  --color-brand-yellow: #FBBC05;
  --color-brand-green:  #34A853;

  /* Semantic — light */
  --color-primary: #1A73E8;
  --color-on-primary: #FFFFFF;
  --color-primary-container: #D3E3FD;
  --color-on-primary-container: #041E49;
  --color-background: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-surface-container: #F1F3F4;
  --color-surface-container-high: #E8EAED;
  --color-on-surface: #1F1F1F;
  --color-on-surface-variant: #5F6368;
  --color-outline: #747775;
  --color-outline-variant: #DADCE0;
  --color-success: #188038;
  --color-success-container: #E6F4EA;
  --color-warning: #B06000;
  --color-warning-container: #FEF7E0;
  --color-error: #B3261E;
  --color-error-container: #F9DEDC;

  /* Type */
  --font-sans: "Google Sans", "Google Sans Text", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "Google Sans Code", "Roboto Mono", ui-monospace, monospace;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 28px;

  /* Layout */
  --container-content: 1200px;
}
```

Dark theme via the `.dark` class:

```css
.dark {
  --color-primary: #8AB4F8;
  --color-on-primary: #062E6F;
  --color-primary-container: #0842A0;
  --color-on-primary-container: #D3E3FD;
  --color-background: #131314;
  --color-surface: #1E1F20;
  --color-surface-container: #282A2C;
  --color-surface-container-high: #303134;
  --color-on-surface: #E3E3E3;
  --color-on-surface-variant: #9AA0A6;
  --color-outline: #8E918F;
  --color-outline-variant: #444746;
  --color-success: #81C995;
  --color-success-container: #0F5223;
  --color-warning: #FDD663;
  --color-warning-container: #4D3D00;
  --color-error: #F2B8B5;
  --color-error-container: #8C1D18;
}
```

---

## 14. "Google-correct" checklist

- [ ] Light backgrounds, generous whitespace, no loud gradients.
- [ ] One filled blue button per screen.
- [ ] Primary buttons are pills; cards are rounded 16–28px.
- [ ] 1px light borders instead of thick shadows.
- [ ] Google's four colors cover ≤ 10% of the surface.
- [ ] Sans-serif type (Roboto/Google Sans), at most two families.
- [ ] Material Symbols icons; no emoji as controls.
- [ ] "Sign in with Google" button follows Google's specification.
- [ ] Text/UI meets WCAG AA; focus ring is visible.
- [ ] Motion is 150–250ms and respects reduced-motion.
