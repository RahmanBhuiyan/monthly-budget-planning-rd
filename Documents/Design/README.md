# Design / UX — workspace

This folder is **currently a placeholder**. There is no dedicated designer on the project today; the visual decisions to date were made by the engineer.

The two referenced-but-missing docs from `frontend/GEMINI.md` belong here:
- `BrandGuideline.md` — colors, typography, spacing tokens (today: scattered in `frontend/src/App.css`; should be hoisted into `Documents/Engineering/Frontend/StylingGuide.md` §2 as the canonical source AND mirrored here as the brand-facing version)
- `UserJourney.md` — flow diagrams, interactive states (today: `docs/app-flow.svg` and `docs/mobile-flow.svg` carry this implicitly)

## What's here today
*Nothing yet — this is the workspace, not the artifacts.*

## Suggested files (create when a designer joins or design work is prioritized)
| File | Purpose |
|------|---------|
| `BrandGuideline.md` | Brand-facing color/typography/voice. Mirrors but does not duplicate `Engineering/Frontend/StylingGuide.md` |
| `UserJourney.md` | Higher-level flows than the wireframe SVGs — including auth, error, and edge-case states |
| `design-system.md` | Component inventory aligned with `Engineering/Frontend/ComponentsGuide.md` |
| `accessibility-checklist.md` | A11y standards beyond WCAG AA basics |
| `wireframes/` | Source files (Figma exports, Sketch, etc.) |

## Boundary
- *Visual decisions* → here
- *How those visuals are implemented in CSS* → `Engineering/Frontend/StylingGuide.md`
- *Per-page UI specifics* → `Engineering/Frontend/PagesGuide.md`

## Until a designer joins
This workspace exists so the structure is forward-compatible. The engineer making visual decisions today should at minimum keep `Engineering/Frontend/StylingGuide.md` honest — that's the de facto brand document.
