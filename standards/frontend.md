# Frontend Standard

## Purpose

Keep P3 and SmartBites interfaces coherent, maintainable, and fast to extend.

## Stack

- Mission Control: React, Vite, JavaScript/TypeScript where present, Tailwind.
- SmartBites mobile: React Native and Expo.
- Server state belongs in TanStack Query when the app has enough server interactions to justify it.
- Client-only interface state can use local component state first; use Zustand when state crosses many branches.

## Component Rules

- Components use PascalCase.
- SmartBites shared wrappers use the `SB*` prefix.
- Keep page components focused on layout and orchestration.
- Extract reusable controls when duplication creates real maintenance cost.

## Styling

- Respect the existing product visual system before introducing new palettes.
- Use restrained operational UI for internal tools: dense, scannable, and predictable.
- Use stable dimensions for dashboards, boards, icon buttons, counters, and repeated tiles.
- Avoid nested cards, decorative blobs, one-note color palettes, and oversized marketing composition in operational tools.

## Data And Loading

- Handle loading, empty, and degraded states.
- Prefer structured API responses over string parsing.
- Keep polling intervals explicit and easy to replace with WebSockets later.

## Accessibility

- Buttons and inputs need clear labels or titles.
- Do not rely on color alone for status.
- Text must fit in its container across mobile and desktop widths.

## Verification

- Run the app build before closeout.
- For visual work, inspect the UI in browser when a dev server is available.
- Include screenshots or test notes before any commit request.
