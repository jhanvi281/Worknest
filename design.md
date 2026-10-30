# WorkNest Design System Specification

**Version:** 2.0  
**Status:** Authoritative Production Standard  
**Platform:** WorkNest Enterprise SaaS (Web, Desktop, Mobile Web)  

---

## 1. WorkNest Design Principles & Visual Identity

WorkNest is a modern, high-performance team workspace and productivity platform unifying tasks, team collaboration, real-time messaging, file management, meetings, and AI-assisted workflows.

Our design system is anchored in three core principles:

1. **Clarity over Decoration:** Content, tasks, and data come first. Interface elements exist to support user intent without visual clutter, gratuitous gradients, or distracting neon glow.
2. **Intentional Dual-Theme Identity:** WorkNest features two synchronized visual identities sharing the same brand orange (`#F97316`):
   - **Light Mode (White + Orange):** Crisp white surfaces, dark charcoal typography, neutral borders, and vibrant orange accents.
   - **Dark Mode (Black + Orange):** Deep obsidian/charcoal surfaces, crisp white typography, subtle dark borders, and luminous orange accents.
   Dark Mode is a purposeful, custom-tuned low-fatigue workspace—not a mathematical color inversion.
3. **Restrained Depth & Semantic Rigor:** Flat and subtle 1px border-driven surfaces form the structural foundation. Depth is achieved through clear surface contrast and minimal shadows rather than heavy skeuomorphism or opaque glassmorphism.

### Brand Accent Rules
- **WorkNest Primary Orange:** `#F97316` (shared across both Light Mode and Dark Mode).
- **Prohibited Brand Colors:** Purple, pink, blue, and navy are strictly forbidden as WorkNest brand accents or primary interactive colors.
- **Semantic Status Colors:** Red/Rose for destructive/danger, Amber for warning/pending, and Emerald for success/completion are permitted exclusively for status indicators.

---

## 2. Light Mode Color Palette (White + Orange)

Light Mode is engineered for high-legibility daytime productivity, utilizing pure white canvases, subtle neutral dividers, and high-contrast charcoal text.

| Role | Token / Value | Usage & Guidance |
| :--- | :--- | :--- |
| **App Canvas Background** | `#FFFFFF` | Outer layout background, full viewport base. |
| **Primary Card / Surface** | `#FFFFFF` | Cards, modals, dialogs, dropdown menus, sidebars. |
| **Muted Surface** | `#FAFAFA` | Workspace main canvas, sub-panels, secondary containers, input fields. |
| **Elevated Surface** | `#FFFFFF` | Popovers, tooltips, floating command bars (subtle shadow). |
| **Primary Text** | `#171717` | Page titles, card headers, high-emphasis text, primary icons. |
| **Secondary Text** | `#737373` | Subtitles, labels, descriptions, timestamps, inactive icons. |
| **Subtle / Muted Text** | `#A3A3A3` | Disabled states, placeholder text, breadcrumbs. |
| **Borders & Dividers** | `#E5E5E5` | Card outlines, table lines, list separators, menu dividers. |
| **Primary Brand Accent** | `#F97316` | Active navigation, primary buttons, tabs, focus rings, progress bars. |
| **Accent Hover** | `#EA580C` | Hover state for primary buttons, active links, interactive highlights. |
| **Subtle Accent Surface** | `#FFF7ED` | Active item backgrounds, badge backgrounds, selected row tints. |
| **On-Accent Text** | `#FFFFFF` | Text rendered on top of `#F97316` or `#EA580C` buttons. |
| **Focus Ring** | `#F97316` | Accessible keyboard focus outline (`ring-2 ring-offset-2`). |

---

## 3. Dark Mode Color Palette (Black + Orange)

Dark Mode provides an obsidian, low-contrast-strain environment for extended focus. Multiple levels of dark charcoal create natural visual hierarchy without harsh pure-white glaring panels.

| Role | Token / Value | Usage & Guidance |
| :--- | :--- | :--- |
| **App Canvas Background** | `#0A0A0A` | Outer layout viewport, workspace main canvas background. |
| **Primary Card / Surface** | `#141414` | Primary cards, workspace panels, sidebar, header, modals. |
| **Muted Surface** | `#1C1C1C` | Input backgrounds, nested cards, inner list rows, sub-panels. |
| **Elevated Surface** | `#222222` | Dialogs, dropdown menus, popovers, floating command bars. |
| **Primary Text** | `#FAFAFA` | Page titles, card titles, high-emphasis content, active icons. |
| **Secondary Text** | `#A3A3A3` | Subtitles, secondary labels, metadata, inactive icons. |
| **Subtle / Muted Text** | `#525252` | Disabled states, placeholder text, inactive breadcrumbs. |
| **Borders & Dividers** | `#333333` | 1px border for cards, inputs, navigation dividers, tables. |
| **Primary Brand Accent** | `#F97316` | Active navigation, primary buttons, tabs, focus rings, progress bars. |
| **Accent Hover** | `#FB923C` | Hover state in dark mode for primary actions and interactive pills. |
| **Subtle Accent Surface** | `#2A170B` | Subtle orange tinted active backgrounds, selected state highlights. |
| **On-Accent Text** | `#FFFFFF` | Text rendered on top of orange buttons and badges. |
| **Focus Ring** | `#FB923C` | Accessible keyboard focus outline (`ring-2 ring-offset-2`). |

---

## 4. Shared Semantic Design Tokens

Components must consume semantic design tokens rather than hardcoding static hex colors or raw color names.

### CSS Custom Properties Mapping

```css
:root {
  /* Brand Tokens */
  --primary: #F97316;
  --primary-hover: #EA580C;
  --primary-light: #FFF7ED;
  --accent: #F97316;
  --accent-hover: #EA580C;
  --accent-subtle: #FFF7ED;

  /* Surfaces & Canvas */
  --background: #FFFFFF;
  --surface: #FFFFFF;
  --surface-muted: #FAFAFA;
  --surface-elevated: #FFFFFF;
  --surface-hover: #F5F5F5;

  /* Typography */
  --text-primary: #171717;
  --text-secondary: #737373;
  --text-muted: #A3A3A3;

  /* Borders & Focus */
  --border: #E5E5E5;
  --focus-ring: #F97316;

  /* Status Colors */
  --success: #16A34A;
  --warning: #F59E0B;
  --danger: #DC2626;

  /* Geometry & Shadows */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
}

.dark {
  /* Brand Tokens */
  --primary: #F97316;
  --primary-hover: #FB923C;
  --primary-light: #2A170B;
  --accent: #F97316;
  --accent-hover: #FB923C;
  --accent-subtle: #2A170B;

  /* Surfaces & Canvas */
  --background: #0A0A0A;
  --surface: #141414;
  --surface-muted: #1C1C1C;
  --surface-elevated: #222222;
  --surface-hover: #262626;

  /* Typography */
  --text-primary: #FAFAFA;
  --text-secondary: #A3A3A3;
  --text-muted: #525252;

  /* Borders & Focus */
  --border: #333333;
  --focus-ring: #FB923C;

  /* Status Colors */
  --success: #22C55E;
  --warning: #FBBF24;
  --danger: #EF4444;

  /* Geometry & Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.5);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.6);
}
```

---

## 5. Typography and Hierarchy

WorkNest uses `Inter` as the primary sans-serif typeface, optimized for UI density and high legibility.

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | 48px | 600 (Semibold) | 1.1 | -0.025em | Landing hero headline. |
| **Heading 1** | 24px–28px | 700 (Bold) | 1.25 | -0.02em | Page headers, view titles. |
| **Heading 2** | 18px–20px | 700 (Bold) | 1.3 | -0.015em | Section headers, card titles. |
| **Heading 3** | 15px–16px | 600 (Semibold) | 1.35 | -0.01em | Subsections, modal titles. |
| **Body Large** | 16px | 400 (Regular) | 1.5 | normal | Featured descriptions, callouts. |
| **Body Medium (Default)** | 14px | 400 (Regular) | 1.5 | normal | Task details, chat text, table rows. |
| **Body Small** | 12px–13px | 400 (Regular) | 1.4 | normal | Metadata, timestamps, helper text. |
| **Label Medium** | 14px | 500 (Medium) | 20px | normal | Form labels, button text, nav items. |
| **Badge / Caption** | 10px–11px | 600 (Semibold) | 1.2 | +0.02em | Status pills, role tags, kbd shortcuts. |

---

## 6. Spacing and Layout Rules

A strict 4px grid rhythm governs all margins, padding, and alignments.

- **Base Rhythm:** 4px
- **Tight (`4px` / `8px`):** Gap between inline icons and labels, inner badge padding.
- **Standard (`12px` / `16px`):** Card inner padding, list item vertical padding, form input spacing.
- **Roomy (`20px` / `24px`):** Dashboard card padding, modal body padding.
- **Section Spacing (`32px` / `48px` / `56px`):** Spacing between major layout sections and page padding.
- **Layout Architecture:**
  - Sidebar: Persistent 240px desktop width (collapsible to 64px icon rail).
  - Header: 64px (h-16) fixed sticky top bar.
  - Workspace Canvas: Full remaining width with responsive `max-w-7xl` content bounds.

---

## 7. Buttons and Interactive States

Buttons must always deliver unmistakable affordances across both themes.

### 1. Primary Action Button
- **Background:** `#F97316` (Brand Orange).
- **Text:** `#FFFFFF` (Bold / Semibold).
- **Hover:** `#EA580C` in Light Mode, `#FB923C` in Dark Mode.
- **Active / Pressed:** Scale 98% with subtle darkening.
- **Radius:** 10px–12px (`rounded-xl`).
- **Focus:** `focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 dark:focus:ring-offset-[#141414]`.

### 2. Secondary / Outline Button
- **Background:** Transparent or `bg-white dark:bg-[#141414]`.
- **Border:** 1px `border-[#E5E5E5] dark:border-[#333333]`.
- **Text:** `#171717 dark:text-[#FAFAFA]`.
- **Hover:** `hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:border-neutral-400 dark:hover:border-neutral-500`.

### 3. Ghost / Utility Button
- **Background:** Transparent.
- **Text:** `#737373 dark:text-[#A3A3A3]`.
- **Hover:** `hover:bg-neutral-100 dark:hover:bg-[#1C1C1C] hover:text-[#171717] dark:hover:text-[#FAFAFA]`.

### 4. Destructive Button
- **Background:** `#DC2626` (Red/Rose) with white text.
- **Hover:** `#B91C1C`.
- **Usage:** Strictly reserved for irreversible deletions and deletions of teams, tasks, or files.

---

## 8. Cards, Panels, and Surfaces

Cards group task data, metrics, feeds, and forms.

- **Light Mode Card:**
  - Background: `#FFFFFF`
  - Border: 1px solid `#E5E5E5`
  - Radius: 12px–16px (`rounded-2xl` or `rounded-3xl`)
  - Shadow: Restrained soft shadow (`shadow-sm`)
- **Dark Mode Card:**
  - Background: `#141414` (distinct from `#0A0A0A` page background)
  - Border: 1px solid `#333333`
  - Radius: 12px–16px (`rounded-2xl` or `rounded-3xl`)
  - Shadow: Minimal/none (`shadow-none` or subtle black shadow)
- **Nested Inner Containers (List items, sub-task blocks):**
  - Light Mode: `#FAFAFA` with `#E5E5E5` border.
  - Dark Mode: `#1C1C1C` with `#333333` border.

---

## 9. Forms, Inputs, and Validation States

Inputs must maintain crisp contrast and unmistakable focus rings across both themes.

- **Input Surface:**
  - Light Mode: `#FAFAFA` or `#FFFFFF`, border `#E5E5E5`, text `#171717`, placeholder `#A3A3A3`.
  - Dark Mode: `#1C1C1C`, border `#333333`, text `#FAFAFA`, placeholder `#737373`.
- **Focus State:**
  - Border transitions to `#F97316`.
  - Ring: `ring-2 ring-[#F97316]/20 dark:ring-[#F97316]/30`.
- **Validation States:**
  - Error: Border `#DC2626` (Light) / `#EF4444` (Dark), with red caption text and warning icon.
  - Success: Border `#16A34A` (Light) / `#22C55E` (Dark).

---

## 10. Navigation and Sidebars

The navigation system establishes spatial grounding and must update synchronously when the theme changes.

- **Sidebar Container:**
  - Light Mode: `bg-white border-r border-[#E5E5E5] text-[#171717]`.
  - Dark Mode: `bg-[#141414] border-r border-[#333333] text-[#FAFAFA]`.
- **Active Navigation Item:**
  - Background: `#F97316` (Brand Orange).
  - Text & Icon: `#FFFFFF`.
  - Shadow: Soft orange shadow (`shadow-sm`).
- **Inactive Navigation Items:**
  - Text & Icon: `#737373` (Light) / `#A3A3A3` (Dark).
  - Hover: `hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#171717] dark:hover:text-[#FAFAFA]`.
- **Top Header Bar:**
  - Light Mode: `bg-white/95 backdrop-blur-md border-b border-[#E5E5E5]`.
  - Dark Mode: `bg-[#141414]/95 backdrop-blur-md border-b border-[#333333]`.
  - Global Search Input: `bg-[#FAFAFA] dark:bg-[#1C1C1C] border-[#E5E5E5] dark:border-[#333333]` with orange search icon (`#F97316`).

---

## 11. Tables, Charts, and Data Visualization

Data visualization represents productivity metrics and deadlines.

- **Data Tables:**
  - Header Row: Background `#FAFAFA` (Light) / `#1C1C1C` (Dark), text uppercase `#737373` / `#A3A3A3`, font size 11px.
  - Row Borders: 1px `#E5E5E5` / `#333333`.
  - Row Hover: `hover:bg-[#FAFAFA]/80 dark:hover:bg-[#1C1C1C]/70`.
- **Productivity & Velocity Charts:**
  - Primary metric bars: `#F97316` (Brand Orange) with hover transition to `#EA580C` (Light) / `#FB923C` (Dark).
  - Grid Lines: Subtle dashed lines in `#E5E5E5` (Light) / `#333333` (Dark).
  - Axis labels: `#737373` (Light) / `#A3A3A3` (Dark).
- **Multi-series Data:**
  - Series 1: Brand Orange (`#F97316`).
  - Series 2: Emerald Green (`#10B981`).
  - Series 3: Amber Gold (`#F59E0B`).
  - Series 4: Neutral Slate (`#64748B`).

---

## 12. Notifications, Dialogs, Dropdowns, and Tooltips

Overlays must preserve strict visual contrast over the underlying content.

- **Modal / Dialog Windows:**
  - Backdrop: `bg-black/50 dark:bg-black/70 backdrop-blur-sm`.
  - Dialog Body: `bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] rounded-2xl shadow-2xl`.
- **Dropdown Menus & Popovers:**
  - Light Mode: `bg-white border border-[#E5E5E5] shadow-xl rounded-2xl`.
  - Dark Mode: `bg-[#141414] border border-[#333333] shadow-2xl rounded-2xl`.
  - Menu Item Hover: `hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#F97316]`.
- **Toast Notifications:**
  - Container: `bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-xl rounded-xl`.
  - Info Type: Highlighted with `#F97316` brand orange indicator.

---

## 13. Responsive Behavior

WorkNest adapts smoothly across phone, tablet, and desktop viewports.

- **Mobile (< 768px):**
  - Sidebar collapses into an off-canvas drawer controlled via the mobile hamburger icon.
  - Header actions condense into action icons and bottom sheets.
  - Multi-column dashboard grids collapse into a single stacked column.
- **Tablet (768px – 1024px):**
  - Sidebar supports 64px icon-rail mode.
  - Grid layouts split into 2-column configurations.
- **Desktop (1024px+):**
  - Full persistent 240px sidebar with workspace branding, navigation badges, and team workspace selectors.

---

## 14. Theme Switching and Preference Persistence

1. **Architecture:**
   - Managed centrally via `AppContext` with `isDarkMode` state and `toggleDarkMode` / `setIsDarkMode`.
   - Synchronizes `<html class="dark">` on `document.documentElement`.
2. **Storage Key:**
   - Stored in `localStorage` under `'worknest_theme'` with values `'dark'` or `'light'`.
3. **Hydration & Flash Prevention:**
   - Pre-hydration script in `index.html` inspects `localStorage.getItem('worknest_theme')` and `window.matchMedia('(prefers-color-scheme: dark)')` before the initial React render, ensuring 0ms theme flashing.
4. **Synchronization:**
   - Toggling the theme from the Header button or Settings view instantly updates all mounted modules, modals, and navigation components without state loss or route reset.

---

## 15. Accessibility and Contrast Requirements

- **WCAG 2.1 AA Compliance:**
  - Normal body text (`#171717` on `#FFFFFF` in Light Mode, `#FAFAFA` on `#141414` in Dark Mode) maintains a contrast ratio greater than 10:1 (exceeding the 4.5:1 requirement).
  - Secondary text (`#737373` on `#FFFFFF` = 4.6:1; `#A3A3A3` on `#141414` = 5.8:1) satisfies the standard.
  - White text on Brand Orange `#F97316` is used strictly on buttons with large/bold typography (contrast ~3.0:1) with high-contrast outlines for interactive controls.
- **Keyboard Navigation:**
  - All interactive elements possess explicit `:focus-visible` styling (`ring-2 ring-[#F97316] ring-offset-2`).
- **Screen Readers:**
  - Role attributes, ARIA live regions, and descriptive `aria-label` tags are implemented on all icon-only buttons (theme toggle, notification bell, search).

---

## 16. Motion and Transitions

Animations are lightweight and purposeful:

- **Theme Transition:**
  - Fast, smooth transition on surface colors (`transition-colors duration-150`).
  - No slow multi-second color blending that causes sluggish interaction.
- **Modal & Dropdown Animations:**
  - `animate-fade-in`: 150ms ease-out (opacity and 4px upward translation).
- **Interactive Feedback:**
  - Button presses: subtle scale reduction (`active:scale-95`).
- **Reduced Motion Support:**
  - All CSS transitions respect `@media (prefers-reduced-motion: reduce)`.

---

## 17. Design Consistency Checklist

Before shipping any UI change, verify:

- [x] **Light Mode:** Canvas is `#FFFFFF`, cards are `#FFFFFF`, muted surfaces are `#FAFAFA`, borders are `#E5E5E5`, text is `#171717`/`#737373`.
- [x] **Dark Mode:** Canvas is `#0A0A0A`, cards are `#141414`, muted surfaces are `#1C1C1C`, borders are `#333333`, text is `#FAFAFA`/`#A3A3A3`.
- [x] **Brand Orange:** Active items, primary buttons, and key focus states use `#F97316`.
- [x] **No Forbidden Accents:** No purple, pink, blue, or navy brand elements exist.
- [x] **Sidebar Theming:** Sidebar adapts to both Light Mode (`bg-white`) and Dark Mode (`bg-[#141414]`).
- [x] **Header Theming:** Header adapts to both themes with matching borders and controls.
- [x] **Theme Persistence:** Selecting a theme updates `localStorage.setItem('worknest_theme', ...)` and restores without flash on refresh.
- [x] **Build & Lint Integrity:** `npm run lint` and `npm run build` execute cleanly with 0 errors.

