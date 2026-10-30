---
version: "1.0"
name: "WorkNest — Dual Theme Design System"
description: "WorkNest uses two coordinated visual themes: white and orange for Light Mode, and black/charcoal and orange for Dark Mode. Both themes share the same brand accent, typography, spacing, component behavior, and accessibility standards."
colors:
  primary: "#F97316"
  accent: "#F97316"
  accent-hover-light: "#EA580C"
  accent-hover-dark: "#FB923C"
  themes:
    light:
      background: "#FFFFFF"
      surface: "#FFFFFF"
      surface-muted: "#FAFAFA"
      surface-elevated: "#FFFFFF"
      text-primary: "#171717"
      text-secondary: "#737373"
      border: "#E5E5E5"
      accent: "#F97316"
      accent-hover: "#EA580C"
      accent-subtle: "#FFF7ED"
      on-accent: "#FFFFFF"
      focus-ring: "#F97316"
    dark:
      background: "#0A0A0A"
      surface: "#141414"
      surface-muted: "#1C1C1C"
      surface-elevated: "#222222"
      text-primary: "#FAFAFA"
      text-secondary: "#A3A3A3"
      border: "#333333"
      accent: "#F97316"
      accent-hover: "#FB923C"
      accent-subtle: "#2A170B"
      on-accent: "#FFFFFF"
      focus-ring: "#FB923C"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "1.1"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.5"
  label-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  base: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section-padding: "56px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "theme.text-primary"
    borderColor: "theme.border"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card:
    backgroundColor: "theme.surface"
    borderColor: "theme.border"
    rounded: "{rounded.lg}"
    padding: "16px"
---

## Overview

WorkNest is a modern work management and productivity platform. Its visual identity should feel professional, calm, clear, and intentional—not overly decorative or artificially generated.

The product supports two complete themes:
- **Light Mode:** white surfaces, near-black text, neutral borders, and orange accents.
- **Dark Mode:** near-black and charcoal surfaces, near-white text, subtle dark borders, and the same orange accents.

The theme switch must update the entire application consistently. Dark Mode is a deliberately designed theme, not merely an inverted Light Mode.

## Brand and Color System

### Brand Accent

- **WorkNest Orange:** `#F97316`
- **Light Mode accent hover:** `#EA580C`
- **Dark Mode accent hover:** `#FB923C`

Orange is the primary brand accent in both themes. Use it for primary actions, selected navigation, active tabs, focus indicators, progress indicators, important links, and meaningful highlights. Avoid using orange as a large decorative background when a neutral surface would be clearer.

### Light Mode — White + Orange

- **App background:** `#FFFFFF`
- **Main surfaces and cards:** `#FFFFFF`
- **Muted surfaces:** `#FAFAFA`
- **Elevated surfaces:** `#FFFFFF`
- **Primary text:** `#171717`
- **Secondary text:** `#737373`
- **Borders and dividers:** `#E5E5E5`
- **Accent:** `#F97316`
- **Accent hover:** `#EA580C`
- **Subtle accent surface:** `#FFF7ED`
- **Text on accent buttons:** `#FFFFFF`

Light Mode should feel spacious, crisp, and easy to scan. Separate content using whitespace, subtle borders, and restrained shadows rather than heavy outlines.

### Dark Mode — Black + Orange

- **App background:** `#0A0A0A`
- **Main surfaces and cards:** `#141414`
- **Muted surfaces:** `#1C1C1C`
- **Elevated surfaces:** `#222222`
- **Primary text:** `#FAFAFA`
- **Secondary text:** `#A3A3A3`
- **Borders and dividers:** `#333333`
- **Accent:** `#F97316`
- **Accent hover:** `#FB923C`
- **Subtle accent surface:** `#2A170B`
- **Text on accent buttons:** `#FFFFFF`

Dark Mode should feel premium and comfortable for extended use. Use distinct charcoal surface levels to establish hierarchy. Avoid pure-white panels, excessive glow, or large orange areas that cause visual fatigue.

### Color Restrictions

- Do not introduce purple, pink, blue, or navy as WorkNest brand colors.
- Semantic colors (for example, red for destructive errors and green for success) may be used sparingly where their meaning is clear.
- Never hard-code Light Mode colors into a component that must support both themes.
- Do not rely on color alone to communicate status; include text, icons, or other appropriate cues.

## Semantic Theme Tokens

Components should consume semantic tokens rather than choosing raw colors independently:

- `background`
- `surface`
- `surface-muted`
- `surface-elevated`
- `text-primary`
- `text-secondary`
- `border`
- `accent`
- `accent-hover`
- `accent-subtle`
- `on-accent`
- `focus-ring`

Map these tokens to the relevant Light Mode or Dark Mode values. Use the existing theme mechanism and naming conventions in the codebase when implementing them; do not introduce a competing theme system unnecessarily.

## Typography

Use a clean, modern sans-serif typeface. Inter is the preferred default when available; preserve the existing product typography if replacing it would cause inconsistency or unnecessary rework.

- **Display:** 48px, weight 600, line-height 1.1, letter-spacing -0.025em.
- **Body:** 14px, weight 400, line-height 1.5.
- **Labels:** 14px, weight 500, line-height 20px.
- Use clear hierarchy between page titles, section headings, supporting text, labels, and metadata.
- Avoid excessively small text, overly light body weights, and long blocks of low-contrast gray text.

## Layout and Spacing

Use a consistent 4px spacing rhythm. Prefer spacing values that are multiples of 4px.

- **Base unit:** 4px
- **Small spacing:** 8px
- **Medium spacing:** 12px
- **Large spacing:** 16px
- **Extra-large spacing:** 24px
- **Section padding:** typically 40–56px depending on viewport and content density.
- **Card padding:** typically 16–24px.

Keep the information architecture and existing application workflows intact when updating styles. Use whitespace and alignment to establish hierarchy. Do not add decorative elements that compete with task information or primary actions.

## Elevation, Borders, and Surfaces

Use restrained, functional depth.

- **Light Mode:** white cards, subtle neutral borders, and soft gray shadows only where needed.
- **Dark Mode:** charcoal cards, visible dark-gray borders, and minimal shadows.
- Prefer a simple 1px theme-aware border for cards, panels, inputs, and menus.
- Use elevation to distinguish overlays and floating menus, not to decorate every component.
- Avoid excessive glass effects, blur, neon glow, and large orange-tinted shadows.
- Use gradients only for rare, high-emphasis surfaces where they have a clear product purpose.

## Shapes

- **Small controls:** 8px radius.
- **Inputs and buttons:** 8–12px radius.
- **Cards and panels:** 12–16px radius.
- **Dialogs:** 16px radius where consistent with the existing interface.
- Keep corner radii consistent across related components; avoid mixing unrelated shapes.

## Components

### Buttons

**Primary**
- Orange background: `#F97316`.
- White text: `#FFFFFF`.
- Use `#EA580C` for Light Mode hover and `#FB923C` for Dark Mode hover when appropriate.
- Provide visible hover, pressed, disabled, and keyboard-focus states.
- Use a consistent 8–12px radius and comfortable hit area.

**Secondary**
- Transparent or theme-aware surface background.
- Theme-aware border and primary text.
- Must remain visually distinct from the background in both themes.

**Destructive**
- Use a semantic danger color only for destructive actions.
- Clearly label destructive actions and use confirmation for consequential operations where appropriate.

**Links**
- Use orange for important links and actions.
- Use primary or secondary text colors for lower-emphasis navigation links.
- Maintain clear hover and keyboard-focus states.

### Cards and Panels

- **Light Mode:** white background, `#E5E5E5` border, 12–16px radius, subtle shadow only if needed.
- **Dark Mode:** `#141414` or `#1C1C1C` background, `#333333` border, 12–16px radius, minimal shadow.
- Keep padding consistent and align card content to the page grid.
- Use flatter surfaces for dense tables and compact utility panels.
- Avoid making every card orange or adding decorative gradients to ordinary data surfaces.

### Inputs and Forms

- Use theme-aware backgrounds, text, borders, placeholder colors, and validation states.
- Inputs must remain clearly distinguishable from their surrounding surface in both themes.
- Provide visible focus, error, disabled, and success states.
- Ensure placeholders do not replace accessible labels.

### Navigation and Sidebars

- Apply the selected theme to the complete navigation system.
- Use orange to indicate the active route or selected item, without making every navigation item orange.
- Keep inactive text readable and distinguish hover from selected states.
- Ensure icons, separators, tooltips, and collapsed navigation states work in both themes.

### Tables, Charts, and Data

- Apply theme tokens to table backgrounds, row dividers, headers, hover states, tooltips, legends, chart labels, and grid lines.
- Maintain readable contrast for chart labels and data points.
- Do not rely on orange alone to distinguish multiple data series.
- Preserve data meaning and existing chart behavior while changing styling.

### Notifications, Dialogs, and Menus

- Notifications, dialogs, dropdowns, popovers, command menus, and tooltips must follow the active theme.
- Keep text, borders, shadows, close buttons, and interactive states consistent.
- Realtime updates must not create duplicate notification entries or inconsistent visual states.

## Theme Switching Behavior

1. Provide working Light Mode and Dark Mode options using the application's existing theme architecture.
2. Switching themes must update every visible area—not just the main page background.
3. Apply the theme to dashboards, sidebars, headers, task lists, calendars, forms, tables, charts, settings, notifications, dialogs, dropdowns, empty states, loading states, and error states.
4. Persist the user's explicit theme preference using the existing application preference mechanism.
5. If system-preference detection already exists, it may be used as the initial default. A user's explicit selection should take precedence.
6. Prevent a flash of the wrong theme on page load where the current architecture supports it.
7. Do not duplicate components solely to support the two themes; use shared components and semantic theme tokens.
8. Do not change application functionality, routing, permissions, or business logic as part of a visual theme update.

## Accessibility and Interaction

- Maintain readable contrast in both themes.
- Use clear keyboard focus indicators.
- Provide hover, pressed, selected, disabled, loading, and error states where applicable.
- Ensure icons remain visible on their surfaces.
- Respect reduced-motion preferences.
- Keep animations subtle and purposeful; theme switching should feel smooth without delaying interaction.

## Do's and Don'ts

### Do
- Use white + orange in Light Mode and black/charcoal + orange in Dark Mode.
- Use shared semantic tokens so both themes remain consistent.
- Keep spacing aligned to a 4px rhythm.
- Use restrained borders, shadows, and surfaces appropriate to each theme.
- Test all major screens in both modes.
- Preserve current information architecture and functionality.
- Verify contrast and interaction states before considering the work complete.

### Don't
- Don't introduce purple, pink, blue, or navy as brand colors.
- Don't implement Dark Mode as a simple inversion of Light Mode.
- Don't hard-code colors in shared components when a semantic token should be used.
- Don't leave charts, dialogs, menus, inputs, tables, or notifications in the wrong theme.
- Don't overuse orange for large backgrounds, borders, and decorative glows.
- Don't mix unrelated shadow, blur, and radius systems.
- Don't remove existing functionality while updating visual styling.

## Motion

Motion should be controlled, subtle, and interface-led.

- **Typical durations:** 150ms and 300ms.
- **Longer transitions:** use sparingly and only when they clarify a state change.
- **Easing:** `ease` or `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Hover patterns:** subtle color, border, opacity, or transform changes.
- Respect reduced-motion settings and avoid motion that interferes with productivity workflows.

## WorkNest Theme Acceptance Checklist

Before marking a theme-related implementation complete, verify:

- [ ] Light Mode uses white surfaces, charcoal text, neutral borders, and orange accents.
- [ ] Dark Mode uses near-black/charcoal surfaces, light text, dark borders, and orange accents.
- [ ] The theme toggle updates the full application.
- [ ] The selected preference persists after refresh, according to the existing architecture.
- [ ] Dashboard, navigation, cards, tasks, forms, tables, charts, dialogs, menus, and notifications are themed correctly.
- [ ] Text, icons, borders, and disabled states remain readable in both modes.
- [ ] No unintended purple, pink, blue, or navy brand styling remains.
- [ ] Existing functionality and responsive layouts still work.
- [ ] Build and relevant tests pass.

