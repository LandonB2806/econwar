# EconWar Aesthetic Pipeline

This project does not accept free-styled UI art. Visual work must pass through
the same authority stack every time:

1. `DESIGN.md`
2. `impeccable`
3. Figma screenshots / built screenshots
4. Aseprite or matching generated pixel assets

## Required Tools

- **Aseprite:** final source for pixel sprites, region landmarks, icons, and
  small animation sheets.
- **Figma:** composition source of truth for screens before implementation.
  Frames must preserve `DESIGN.md` palette, typography, spacing, and component
  states.
- **Playwright or equivalent screenshot capture:** light and dark screenshots
  are required evidence for the critic.
- **`npm run aesthetic:gate`:** static anti-slop and identity check. This does
  not replace human critique; it blocks repeat mechanical failures.
- **Mobbin:** product UI pattern reference only. Do not copy its fintech/mobile
  look into EconWar.

## Pass Order

1. Art Director creates or updates the Figma frame and Aseprite assets.
2. Developer implements the screen.
3. Developer runs:

```bash
npm run aesthetic:gate
npm run build
```

4. Developer captures light and dark screenshots.
5. Aesthetic Design Tester returns the required verdict format from
   `politics/14_Aesthetic_Design_Tester_Critique.md`.

## Hard Gates For Current Blockers

- Start screen: a new player must infer political science, economics, and
  Thailand's four regions from the background alone.
- Region panels: a new player must identify Central, North, South, and
  Northeast without reading labels.
- Both screens must pass in light and dark themes.
- Any `DESIGN.md §0` slop trait is an automatic FAIL.
