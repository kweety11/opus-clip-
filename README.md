# Film Trend 🎬

**Film Trend** is an AI-style search engine for shot reference research — inspired by [filmvibes.io](https://filmvibes.io). Search stills & GIF-style previews from feature films, commercials and music videos to build director's treatments, mood boards and animatics.

## Features

| Tool | Where | How it works |
|---|---|---|
| **AI Shot Search** | `search.html` | Free-text search over titles, movies, keywords, crew, camera metadata |
| **Cinematic Filters** | `search.html` | Source (Film / Commercial / Music Video), shot size, camera angle, camera movement, time of day |
| **Dominant Color filter** | `search.html` | 8 colour buckets as clickable swatches |
| **Color Harmony tool** | `search.html` | Pick a base hue + complementary / analogous / triadic — the harmony is mapped to colour buckets and applied as a filter |
| **Search by Image** | `search.html` | Paste any image (Ctrl/⌘+V) — the page reads its dominant colour on a canvas and pulls shots with the same vibe |
| **Smart Feed** | `search.html` | Opening a shot re-ranks the grid by similarity (movie, palette, composition, time of day, size, movement) |
| **Hover Motion Previews** | everywhere | Cards play a slow Ken-Burns pan on hover, simulating GIF previews |
| **Shot Inspector** | lightbox | Full metadata (dir/DP/genre/specs) + Download Still (real SVG export), GIF/MP4 quota messaging, Add to board |
| **Library** | `movies.html`, `movie.html` | Per-title pages with all shots, crew facts and source tabs |
| **Pricing** | `pricing.html` | Free / Pro $8 / Team $16 (2 seats min, usage-based extra seats) + FAQ |
| **Blog** | `blog.html` | Reference-research editorial teasers |

## Demo imagery

There are no copyrighted frames in this repo. Every "still" is generated at runtime by `js/scene.js` — a procedural SVG renderer that composes cinematic frames (horizon, neon city, corridor, window, road, rain, close-up, symmetry) from each title's colour palette, with film grain, letterboxing and a vignette. Swap `sceneSVG()` for real CDN images to go to production.

## Stack

Zero dependencies, zero build step — plain HTML + CSS + vanilla JS. Open `index.html` in a browser or serve statically:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Structure

```
index.html        Landing page (hero search, marquee, features, workflow, CTA)
search.html       The search engine (filters, harmony, paste-to-search, smart feed)
movies.html       Library index with source tabs
movie.html        Per-title stills page (?m=slug)
pricing.html      Plans + FAQ
blog.html         Blog teasers
css/style.css     Design system (dark cinematic theme)
js/data.js        Catalogue: 16 titles, 56 shots with full camera metadata
js/scene.js       Procedural SVG still generator
js/ui.js          Header/footer, shot cards, lightbox, downloads, toasts
js/search.js      Search, facets, colour harmony, image-paste search, smart feed
```
