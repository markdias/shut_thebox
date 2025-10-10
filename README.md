# Shut the Box

A TypeScript + React implementation of the classic pub game "Shut the Box". Configure tile ranges, scoring, and the one-die rule, then take turns closing tiles until somebody shuts the box or the lowest score wins.

## Getting started

```bash
npm install
npm run dev
```

This launches Vite's development server (default port `5173`). Open the printed URL in your browser to start playing locally.

## Game features

- Tile ranges: 1–9, 1–10, or 1–12.
- Any number of hot-seat players with editable names.
- Configurable one-die rule (after high tiles, when total &lt; 6, or never).
- Scoring modes: lowest single-round remainder, cumulative race to a target, or instant win on a shut box.
- Automatic detection of legal tile combinations for each roll, including highlights and optional "best move" hints.
- History log of every turn and instant win shout-outs.

## Project structure

- `src/store`: Zustand state store with all core game logic.
- `src/components`: UI building blocks (board, settings, players, history).
- `src/utils`: Helper functions for tile combination generation and rule checks.
- `src/styles`: Global and component styling.

Feel free to deploy the production build with any static host after running `npm run build`.
