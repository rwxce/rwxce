# rwxce

Static shelf site in `site/` (en at the root, `es/`, `ca/`), deployed by `pages.yml` on push to `main`.

## The shelf

The shelf is a grid of app-style icons; clicking one opens its card (the plate) in a modal with previous / next.

- A new project adds, in en, es and ca: one `.tile` (`data-open`, `data-keywords`, icon) in `#apps` and one `article.plate` (`data-card`, `data-name`, same key) in `#sheet`, in the same order, with the next number. Move the "under construction" slot and the hero counter up by one.
- Current numbers: 001 Zliding, 002 mascot-studio, 003 agentic-repo-kit, 004 Memory Archive.

## Plate height rule

Every project card in the sheet must be as tall as Zliding's card in the two-column layout, from 1280px up, so previous / next never makes the modal jump.

- The art column is a square (`aspect-ratio: 1; max-width: 600px`) and the plate padding is `clamp(28px, 4.4vw, 64px)`. Both live in the `@media (min-width: 1280px)` block at the end of `site/assets/site.css`.
- A new plate joins that block; never use a fixed px `min-height` (Zliding's height follows the viewport width).
- Before pushing, run `node ci/check-plate-heights.mjs`: it opens every card at 1440 and 1280 in en, es and ca and the heights must match within 2px. Below 1280 the text may exceed the square, so natural height is accepted.
- Single-column (mobile) cards keep their natural height.
