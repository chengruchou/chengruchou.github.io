# Cheng-Ru Chou — Academic Website

English academic portfolio for Cheng-Ru Chou, published as a static GitHub Pages site.

## Structure

- `index.html` — semantic page content and metadata
- `assets/portfolio.css` — visual system, responsive layout, and motion fallbacks
- `assets/portfolio.js` — scroll-linked canvas narrative, progressive reveals, and navigation behavior
- `assets/scene-*.webp` — optimized cinematic research artwork
- `assets/profile.jpg` — profile portrait

The site has no build step or runtime dependency. All content required by the page is committed directly.

## Local preview

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. A local server is required because the canvas loads image assets.

## Publish with GitHub Pages

GitHub Pages is configured to deploy the repository root from the `main` branch.
Merging a verified change into `main` publishes it at <https://chengruchou.github.io>.

## Accessibility and performance

- Mobile and coarse-pointer devices use native, sequential story panels.
- `prefers-reduced-motion` and data-saver users receive a static fallback.
- All core copy and links remain semantic HTML; canvas visuals are decorative.
- Hero artwork is stored as compressed WebP and loaded progressively.
