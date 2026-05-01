# Portfolio Website (SITE-1101)

A responsive personal portfolio website built with **HTML**, **CSS**, and **JavaScript**.  
Includes multiple pages (Home, About, Projects) and a playable **Snake** game using the HTML canvas.

## Live site (GitHub Pages)

- `https://YOUR_GITHUB_USERNAME.github.io/solmazadg09.github.io-SITE-1101/`

## Pages overview

- **Home**: `index.html` — navbar, hero section, featured projects preview, contact section, footer
- **About**: `about.html` — background, qualifications, and activities
- **Projects**: `projects.html` — card layout with project image placeholders
- **Game**: `game.html` — fully working Snake game (start screen, score, game over)

## Technologies used

- **HTML5**
- **CSS3** (responsive layout with media queries, modern card UI)
- **JavaScript** (site utilities + Snake game logic)
- **Google Fonts** (Inter)
- **Font Awesome** (footer icons)

## How to run locally

Because this is a static site, you can run it by simply opening the HTML files, but using a local server is recommended.

### Option A: Open directly

1. Double-click `index.html`

### Option B: Use a local server (recommended)

If you have Python installed:

```bash
python -m http.server 5500
```

Then open:

- `http://localhost:5500/`

## Notes / Customize

- Update your profile links in the footer (GitHub + Codecademy) and the repository link placeholders.
- Replace image placeholders by adding images to `images/` and referencing them in your HTML.