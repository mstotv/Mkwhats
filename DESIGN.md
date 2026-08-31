---
name: Ethos Automation
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3d4947'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#605e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2dd'
  on-secondary-container: '#666460'
  tertiary: '#5d5c5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#757474'
  on-tertiary-container: '#f7feff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#e6e2dd'
  secondary-fixed-dim: '#c9c6c1'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#484743'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin_desktop: 64px
  margin_mobile: 20px
---

## Brand & Style
The design system is rooted in **Modern Minimalism** with a focus on editorial sophistication. It targets high-end enterprise clients and developers seeking an automated communication platform that feels like a premium utility rather than a cluttered dashboard.

The aesthetic mimics high-quality stationery or architectural journals: heavy on whitespace, precise in alignment, and intentional with color. The interface should feel calm, intellectual, and extremely organized. It leverages subtle depth and a "paper-on-paper" layering effect to guide the user through complex automation workflows without cognitive overload.

## Colors
The palette is built on a foundation of "Warm Neutrality."

- **Primary Green (#0A9387):** Reserved strictly for high-priority actions, active states, and critical success indicators. It represents the link to the WhatsApp ecosystem.
- **Light Beige (#F9F5F0):** The primary canvas for Light Mode. It provides a softer, more sophisticated look than pure white, reducing eye strain.
- **Deep Charcoal (#1A1A1A):** Used for typography in Light Mode to ensure maximum legibility and as the primary background for Dark Mode.
- **Functional Tones:** Use low-saturation grays for borders and secondary text to maintain the "monochrome-plus-one" editorial feel.

## Typography
The system employs a high-contrast typographic pairing:

- **Headlines:** Use **Playfair Display**. It provides a literary, authoritative feel. Keep tracking tight on larger sizes and ensure line heights are generous enough to allow the serifs to breathe.
- **Body & UI:** Use **Inter**. It is selected for its exceptional legibility at small sizes and its neutral, systematic nature.
- **Labels:** Use Inter in uppercase with slight letter spacing for meta-data, tags, and small navigation elements to create a distinct visual hierarchy from body prose.

## Layout & Spacing
The layout follows a **Fluid Grid** model with strict vertical rhythm based on an 8px baseline. 

- **Desktop:** 12-column grid with 24px gutters. Content should be centered with a max-width of 1280px for readability.
- **Mobile:** Single column with 20px side margins.
- **Rhythm:** Use large "hero" padding (80px+) between major sections to emphasize the premium, unhurried nature of the brand. Group related form elements with 12px spacing, and separate distinct card sections with 24px.

## Elevation & Depth
This design system avoids heavy drop shadows in favor of **Tonal Layering** and **Soft Ambient Occlusion**.

- **Level 0 (Background):** Light Beige (#F9F5F0) or Deep Charcoal (#1A1A1A).
- **Level 1 (Cards/Containers):** Pure White (Light Mode) or #242424 (Dark Mode). Use a very soft, diffused shadow: `0px 4px 20px rgba(0, 0, 0, 0.04)`.
- **Level 2 (Dropdowns/Modals):** Same surface as Level 1 but with a more pronounced shadow: `0px 12px 32px rgba(0, 0, 0, 0.08)`.
- **Interactions:** On hover, cards should not lift but rather transition their border color to the Primary Green or a slightly darker neutral to maintain a "flat but sophisticated" look.

## Shapes
The shape language is **Soft yet Structured**. 

A standard border radius of **4px (0.25rem)** is used for buttons and input fields to maintain a professional, slightly sharp edge. Larger containers like cards or dashboard panels use **8px (0.5rem)** to feel approachable. Avoid fully rounded "pill" shapes except for status tags (e.g., "Active", "Pending") to ensure they are immediately distinguishable from action buttons.

## Components
- **Buttons:** Primary buttons are solid Primary Green with white text. Secondary buttons use a transparent background with a 1px border of the Primary Green. Use `label-sm` typography for button labels.
- **Input Fields:** Minimalist style. Underline-only or subtle 1px border on all four sides using the neutral border color. Focus state transitions the border to Primary Green.
- **Cards:** White surfaces with 8px radius and the Level 1 soft shadow. Use for automation steps, analytics snapshots, and user profiles.
- **Chips/Tags:** Small, pill-shaped markers. For "WhatsApp" related statuses, use a light tint of Primary Green (10% opacity) with dark green text.
- **Accordions:** Clean, border-bottom only separation. Use Playfair Display for the accordion title and Inter for the content. The chevron icon should be thin and elegant.
- **Footer:** A robust, multi-column structural footer using the Deep Charcoal background in both modes. Typography in the footer should be shifted to a smaller, secondary neutral color to remain unobtrusive.
- **Automation Nodes:** Specialized components for the "Automation" aspect. Use connecting lines that are 1px thick, neutral gray, with circular nodes.