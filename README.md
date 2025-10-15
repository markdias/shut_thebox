# Shut the Box

A TypeScript + React implementation of the classic pub game "Shut the Box". Configure tile ranges, scoring, and the one-die rule, then take turns closing tiles until somebody shuts the box or the lowest score wins.

## Getting started

```bash
npm install
npm run dev
```

This launches Vite's development server (default port `5173`). Open the printed URL in your browser to start playing locally. Use the glowing dice tray to choose **Start game** or **Start new round**—the first tap now rolls immediately so play begins right away.

## Game features

- Tile ranges: 1–9, 1–10, or 1–12.
- Any number of hot-seat players with editable names.
- Configurable one-die rule (after high tiles, when total &lt; 6, or never).
- Scoring modes: lowest single-round remainder, cumulative race to a target, or instant win on a shut box.
- Automatic detection of legal tile combinations for each roll, including highlights and optional "best move" hints.
- Optional move-confirmation toggle so you can require approval before tiles close.
- History log of every turn and instant win shout-outs.
- Mobile board layout that keeps essential controls visible without scrolling.

## Project structure

- `src/store`: Zustand state store with all core game logic.
- `src/components`: UI building blocks (board, settings, players, history).
- `src/utils`: Helper functions for tile combination generation and rule checks.
- `src/styles`: Global and component styling.

Feel free to deploy the production build with any static host after running `npm run build`.
### Deploying to GitHub Pages

This is a static Vite app. The `dist` folder contains a complete site (index.html + assets). To publish via GitHub Pages:

1) Base path

- If your Pages URL is `https://<user>.github.io/<repo>/` (project pages), set Vite `base` to `'/<repo>/'` in `vite.config.ts`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT for project pages; replace <repo> with your repository name
  // base: '/<repo>/'
})
```

- If you use a custom domain or a user/org site (`https://<user>.github.io/`), you can leave `base` as default ('/').

2) SPA fallback

The build step copies `index.html` to `404.html` so client‑side routes work on Pages.

3) GitHub Actions workflow

The repo includes `.github/workflows/deploy.yml` that:
- builds the app on pushes to `main`/`master`
- uploads `dist` as the Pages artifact
- deploys it to GitHub Pages

Enable GitHub Pages in the repo: Settings → Pages → Build and deployment → Source = GitHub Actions.

4) Environment variables

If you use Contentful (or any env vars), add them as Repository → Settings → Secrets and variables → Actions → Variables, then reference via `VITE_...` when building.
