# User-Defined Preferred Patterns and Preferences

## Default Frontend Design Stack

These are recommended defaults for the UX Expert agent. Projects may override
any of these via their own configuration.

| Category | Default | Rationale |
|----------|---------|-----------|
| Component Library | shadcn/ui | Open code, composable, AI-readable, beautiful defaults |
| Styling | Tailwind CSS | Utility-first, design-token friendly, rapid iteration |
| Headless Primitives | Radix UI | Accessibility-first, unstyled, composable |
| Animation | Framer Motion (React) / CSS transitions (HTML) | Declarative, performant, reduced-motion aware |
| Icons | Lucide Icons | Consistent stroke width, tree-shakeable, MIT license |
| Theming | CSS custom properties (variables) | Framework-agnostic, runtime switchable (dark/light mode) |
| Font Loading | `next/font` (Next.js) or `@fontsource/*` packages | Self-hosted, no layout shift, privacy-friendly |

## Anti-Convergence Banned Defaults

These produce generic "AI slop" and must be actively avoided:

- **Fonts**: Inter, Roboto, Arial, system-ui as display/heading fonts
- **Colors**: Purple gradients on white backgrounds; timid, evenly-distributed palettes
- **Layouts**: Equal-width card grids as the default answer to every layout problem
- **Backgrounds**: Flat solid white (#ffffff) or light gray (#f5f5f5) with zero atmosphere
- **Patterns**: Cookie-cutter hero → features grid → testimonials → CTA footer

## Recommended Font Pairings

| Style | Display/Heading | Body | Monospace |
|-------|----------------|------|-----------|
| Editorial | Playfair Display | Source Serif 4 | JetBrains Mono |
| Tech/Modern | Cabinet Grotesk | General Sans | Fira Code |
| Luxury | DM Serif Display | Crimson Pro | IBM Plex Mono |
| Geometric | Satoshi | Plus Jakarta Sans | Space Mono |
| Neo-Brutalist | Instrument Serif | Instrument Sans | Berkeley Mono |

## Design Token Foundations

### Spacing (4px base unit)
`4 → 8 → 12 → 16 → 24 → 32 → 48 → 64`

### Border Radius Scale
`none(0) | sm(4px) | md(8px) | lg(12px) | xl(16px) | full(9999px)`

### Shadow System (5 levels)
| Level | Typical Use |
|-------|-------------|
| Subtle | Cards at rest, input fields |
| Default | Dropdowns, popovers |
| Medium | Floating actions, tooltips |
| Large | Modals, dialogs |
| Prominent | Hero cards, feature highlights |

### Animation Defaults
| Type | Duration | Easing |
|------|----------|--------|
| Micro-interaction | 150-200ms | ease-out |
| Layout transition | 300-500ms | cubic-bezier(0.33, 1, 0.68, 1) |
| Page enter/exit | 400-600ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Stagger per item | 50-80ms | — |
