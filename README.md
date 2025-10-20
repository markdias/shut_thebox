# Shut the Box

A TypeScript + React take on the pub classic. This single-page app recreates tabletop Shut the Box with configurable rules, best-move coaching, persistent scores, and a suite of kid-friendly learning mini games that reuse the tile interface. Use this reference to understand every feature before porting the experience to another stack or language.

## Quick start

```bash
npm install
npm run dev
```

The Vite development server (default port `5173`) serves the whole experience. The printed URL lands on the full game shell with responsive controls for desktop and touch layouts.

## Core gameplay flow

- **Setup** – Configure options, add players, and keep the scoreboard from previous sessions thanks to localStorage persistence.
- **Turn loop** – Roll automatically chooses two dice unless the one-die rule allows a single die. Players select open tiles whose sum matches the roll; optional confirmation prevents accidental closures.
- **Round resolution** – The round ends once all players have no legal moves. Winners see a modal with round scores and ties handled explicitly. Optional instant-win triggers when a player shuts the entire box.
- **Instructions overlay** – "How to Play" opens an accessible dialog that summarises the rules for new players.

## Rules & scoring configuration

All knobs live inside the Settings panel:

| Option | Values | Behaviour |
| --- | --- | --- |
| Highest tile | 1–9, 1–10, 1–12 | Regenerates the tile strip outside active rounds. Hidden code `madness` unlocks a 1–56 variant for testing. |
| One-die rule | After top tiles shut · When remainder < 6 · Never | Determines when the UI offers a single-die roll. |
| Scoring mode | Lowest remainder · Cumulative race to target · Instant win | Adapts scorekeeping. Target mode enables a numeric goal input; instant mode forces the instant-win toggle on. |
| Instant win on shut | Toggle | Grants the victory immediately when no tiles remain (also implied by instant scoring). |
| Require confirmation | Toggle | Forces a confirmation tap before tiles close. |
| Auto-retry on failure | Toggle | When paired with auto-play it restarts runs automatically. |
| Show header details | Toggle | Expands the status chip row under the neon header. |
| Show code tools | Toggle | Reveals a text box for cheat codes (`full`, `madness`, `takeover`). |
| Theme | Neon glow · Matrix grid · Classic wood · Tabletop felt | Applies CSS theme classes to the body and `<html>`. |
| Show learning games | Toggle | Swaps the main board for mini-game content when active. |

Cheat codes perform extra tasks:

- `full` – Enables perfect-roll rigging for instant wins.
- `madness` – Raises `maxTile` to 56 for giant boards.
- `takeover` – Activates visible auto-play (uses best-move hints), auto-retry, and restarts the round.

A double-click on tile 12 also triggers a secret forced double-six on the next roll.

## Player management & history

- Add or remove hot-seat players in setup, rename them inline, and toggle per-player hints.
- Track each player's last score and cumulative totals (for target mode) inside the roster.
- A dedicated History panel records every roll, move, and shout-out. It also counts unfinished turns per player so you can gauge who leaves tiles standing.
- The "Save scores" header action exports the persisted snapshot as `shut-the-box-scores.json` including round, phase, totals, and theme.

Scores, round number, unfinished counts, previous winners, and the selected theme persist automatically in `localStorage` (`shut-the-box:scores`).

## Assistive & automated play

- Global hints illuminate legal tiles. Players can also toggle hints individually.
- A rated "best move" highlights the preferred combination; auto-play uses this path.
- Pending-turn toasts, restart countdowns, and end-turn acknowledgements keep multi-player sessions coordinated.
- Auto-play banner lets hosts stop hands-free demos.
- Optional move confirmation and the status tray guard against mis-taps on mobile.
- Winner modal celebrates the round and supports ties; instructions modal provides quick rule refreshers.

## Learning mini games

Enable "Show learning games" and use the **More Games** button to swap out the main board. Each mini game reuses the app chrome and supports touch or mouse input:

- **Word sound builder** – Choose 2–6 letter words, tap tiles to hear phonetic playback, and optionally stream higher-fidelity audio via Voice RSS. Falls back to Web Speech API or on-screen prompts when unavailable.
- **Shape explorer** – Render regular polygons, custom quadrilaterals, circles, and ellipses. Tap glowing vertices to count corners; the UI tracks totals and supplies fun facts.
- **Dice dot detective** – Pick 1–6 dice, predict the total with tile-style buttons, then reveal animated dice for immediate feedback.
- **Secret dot flash** – Flash up to 36 non-overlapping dots for subitising practice. Adjustable difficulty controls dot range and flash timing.
- **Math mixer** – Generate arithmetic equations (addition, subtraction, multiplication, division) with Starter and harder difficulty levels; reveal answers inline once checked.

The active learning game is stored in state so returning to the board is a single click.

## User interface & responsiveness

- Mobile header condenses into a menu + status toggle; desktop keeps settings and history buttons inline.
- Dice tray animates when rolls change and tracks the last meaningful roll for context.
- Status chips display round, phase, active player, roster, previous winners, and hint state.
- Progress meter shows percent of tiles closed, and toast notifications announce next turns.
- Multiple CSS themes deliver neon, grid, wood, and felt aesthetics.

## Architecture notes

- **Framework** – React 18 + Vite 5 with TypeScript.
- **State** – A single Zustand store (`src/store/gameStore.ts`) drives gameplay, learning modules, persistence, auto-play, and cheat codes.
- **Logic helpers** – `src/utils/combinations.ts` and `src/utils/gameLogic.ts` generate legal moves, rate best combos, and enforce the one-die rule. `src/utils/id.ts` produces stable identifiers. `src/utils/storage.ts` handles persistence, and `src/utils/speech/voiceRss.ts` encapsulates the optional external TTS service.
- **Components** – `src/components` contains panels for the board, settings, players, history, and each learning game. Styles live under `src/styles`.

## Building & deploying

```bash
npm run build
```

Build runs TypeScript checks, emits Vite assets, and copies `index.html` to `404.html` for SPA routing on static hosts. Serve the `dist/` directory with any static provider.

For GitHub Pages deployments, enable the included workflow (`.github/workflows/deploy.yml`) or host the generated output manually. Set `base` in `vite.config.ts` when publishing to a project sub-path.

## Continuous integration

A dedicated GitHub Actions workflow (`.github/workflows/ci.yml`) installs dependencies with `npm ci` and runs the production build on every pull request targeting `main`. Keep the build passing locally before opening a PR so the automated check succeeds.

## Optional Voice RSS configuration

The Word Sound Builder can stream higher fidelity narration via [Voice RSS](https://www.voicerss.org/). Supply credentials via environment variables (e.g. `.env.local`):

```env
VITE_VOICERSS_KEY=your-api-key
VITE_VOICERSS_LANGUAGE=en-gb
VITE_VOICERSS_VOICE=Linda
VITE_VOICERSS_AUDIO_FORMAT=44khz_16bit_mono
VITE_VOICERSS_RATE=-1
```

Without a key, the app gracefully falls back to the browser's Web Speech voices or on-screen guidance.

