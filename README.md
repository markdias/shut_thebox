# Shut the Box

A TypeScript + React implementation of the classic pub game "Shut the Box". Rally a table of friends, roll the dice, and try to close every tile from 1 through 12 before you run out of moves.

## Getting started

```bash
npm install
npm run dev
```

This launches Vite's development server (default port `5173`). Open the printed URL in your browser to start playing locally.

## Game features

- Tiles 1–12 only — the box is only shut when every tile is closed.
- Any number of hot-seat players with editable names.
- Configurable one-die rule (after high tiles, when total &lt; 6, or never).
- Automatic detection of legal tile combinations for each roll, including highlights and optional "best move" hints.
- Score log that records every turn with win/loss styling and timestamps.

## Project structure

- `src/store`: Zustand state store with all core game logic.
- `src/components`: UI building blocks (board, settings, players, history).
- `src/utils`: Helper functions for tile combination generation and rule checks.
- `src/styles`: Global and component styling.

Feel free to deploy the production build with any static host after running `npm run build`.
