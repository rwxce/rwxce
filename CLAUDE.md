# rwxce

Static shelf site in `site/` (en at the root, `es/`, `ca/`), deployed by `pages.yml` on push to `main`.

## Plate height rule

Every project plate on the shelf (001, 002, 003, 004 and any new one) must be as tall as the Zliding plate (003) in the two-column layout, from 1280px up.

- The art column is a square (`aspect-ratio: 1; max-width: 600px`) and the plate padding is `clamp(28px, 4.4vw, 64px)`. Both live in the `@media (min-width: 1280px)` block at the end of `site/assets/site.css`.
- A new plate joins that block; never use a fixed px `min-height` (Zliding's height follows the viewport width).
- Before pushing, measure `.plate` heights at 1440 and 1280 in en, es and ca: they must match within 2px. Below 1280 the text may exceed the square, so natural height is accepted.
- Single-column (mobile) layout must not change.
