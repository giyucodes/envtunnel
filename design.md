# envtunnel — Design Direction

## Vibe
Dark, brutalist, developer-first. Inspired by terminal aesthetics and raw developer tooling.
No rounded corners. No gradients. No decorative nonsense.

## Typography
- **Primary font**: JetBrains Mono (monospace) — for headings, code, tokens
- **Body font**: JetBrains Mono — everything monospace, consistent hacker feel
- Headings: uppercase, tight letter-spacing
- Code/tokens: highlighted with subtle bg, crisp

## Colors
- Background: `#0a0a0a` (near black)
- Surface: `#111111`
- Border: `#222222`
- Primary text: `#f0f0f0`
- Muted text: `#555555`
- Accent: `#00ff88` (terminal green) — used sparingly for CTAs, live indicators, highlights
- Danger: `#ff4444`
- Warning: `#ffaa00`

## CSS Variables
```css
--bg: #0a0a0a;
--surface: #111111;
--border: #222222;
--text: #f0f0f0;
--muted: #555555;
--accent: #00ff88;
--danger: #ff4444;
```

## Layout
- Max width: 1100px, centered
- Sharp borders everywhere (`border: 1px solid var(--border)`)
- Zero border-radius on most elements
- Grid-based, asymmetric layouts
- Heavy use of monospace code blocks

## Components
- Buttons: flat, bordered, sharp corners. Accent green for primary, white outline for secondary
- Cards: `background: var(--surface)`, `border: 1px solid var(--border)`, sharp corners
- Inputs: dark bg, sharp border, monospace font
- Badges: inline, bordered, monospace text

## Anti-patterns
- No purple gradients
- No rounded card grids
- No Inter/Roboto
- No decorative illustrations
