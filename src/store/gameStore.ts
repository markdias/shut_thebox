import { create } from 'zustand';
import { GameOptions, GamePhase, Player, TurnState } from '../types';
import { generateTileCombos, isSameCombo } from '../utils/combinations';
import { canUseOneDie, createInitialTiles, shouldInstantWin, sumTiles } from '../utils/gameLogic';
import { createId } from '../utils/id';

interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
}

interface GameStore {
  phase: GamePhase;
  options: GameOptions;
  tilesOpen: number[];
  players: Player[];
  round: number;
  turn: TurnState | null;
  logs: GameLogEntry[];
  winnerIds: string[];
  settingsOpen: boolean;
  showHints: boolean;
  bestMove: number[] | null;
  setOption: <K extends keyof GameOptions>(key: K, value: GameOptions[K]) => void;
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  toggleSettings: (open: boolean) => void;
  toggleHints: () => void;
  startGame: () => void;
  rollDice: (diceCount?: number) => void;
  selectTile: (tile: number) => void;
  resetSelection: () => void;
  confirmMove: () => void;
  endTurn: () => void;
  resetGame: () => void;
  clearHistory: () => void;
}

function createDefaultPlayers(): Player[] {
  return [
    {
      id: createId(),
      name: 'Player 1',
      totalScore: 0,
      lastScore: null
    }
  ];
}

const defaultOptions: GameOptions = {
  maxTile: 9,
  oneDieRule: 'after789',
  scoring: 'lowest',
  targetScore: 100,
  instantWinOnShut: true
};

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'setup',
  options: defaultOptions,
  tilesOpen: createInitialTiles(defaultOptions.maxTile),
  players: createDefaultPlayers(),
  round: 1,
  turn: null,
  logs: [],
  winnerIds: [],
  settingsOpen: true,
  showHints: false,
  bestMove: null,
  setOption: (key, value) =>
    set((state) => {
      const nextOptions = {
        ...state.options,
        [key]: value
      } as GameOptions;

      if (key === 'scoring' && value === 'instant') {
        nextOptions.instantWinOnShut = true;
      }

      if (key === 'maxTile' && state.phase !== 'inProgress') {
        return {
          options: nextOptions,
          tilesOpen: createInitialTiles(value as number)
        };
      }

      return { options: nextOptions };
    }),
  addPlayer: () =>
    set((state) => ({
      players: [
        ...state.players,
        {
          id: createId(),
          name: `Player ${state.players.length + 1}`,
          totalScore: 0,
          lastScore: null
        }
      ]
    })),
  removePlayer: (id) =>
    set((state) => {
      if (state.players.length === 1) {
        return {};
      }
      return {
        players: state.players.filter((player) => player.id !== id)
      };
    }),
  updatePlayerName: (id, name) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === id ? { ...player, name } : player
      )
    })),
  toggleSettings: (open) => set({ settingsOpen: open }),
  toggleHints: () =>
    set((state) => ({
      showHints: !state.showHints
    })),
  clearHistory: () => set({ logs: [] }),
  startGame: () => {
    const { options, players } = get();
    const sanitizedPlayers = players.map((player, index) => ({
      ...player,
      name: player.name.trim() || `Player ${index + 1}`,
      totalScore: options.scoring === 'target' ? player.totalScore : 0,
      lastScore: null
    }));

    const initialTiles = createInitialTiles(options.maxTile);

    set({
      phase: 'inProgress',
      tilesOpen: initialTiles,
      players: sanitizedPlayers,
      round: options.scoring === 'target' ? get().round : 1,
      turn: {
        playerIndex: 0,
        dice: [],
        rolled: false,
        selectableCombos: [],
        selectedTiles: [],
        history: [],
        canRollOneDie: canUseOneDie(initialTiles, options),
        finished: false
      },
      logs: [],
      winnerIds: [],
      bestMove: null
    });
  },
  rollDice: (diceCount) => {
    const state = get();
    const { turn, tilesOpen, options } = state;
    if (!turn || turn.finished) {
      return;
    }

    const canRollOneDie = canUseOneDie(tilesOpen, options);
    if (diceCount === 1 && !canRollOneDie) {
      return;
    }

    const diceToRoll = diceCount ?? (canRollOneDie ? 1 : 2);
    const dice: number[] = [];
    for (let i = 0; i < diceToRoll; i += 1) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    const total = dice.reduce((sum, value) => sum + value, 0);
    const combos = generateTileCombos(tilesOpen, total);
    const bestMoveEntry = combos
      .map((combo) => ({
        combo,
        remainder: sumTiles(tilesOpen.filter((tile) => !combo.includes(tile)))
      }))
      .sort((a, b) => a.remainder - b.remainder)[0];
    const bestMove = bestMoveEntry ? bestMoveEntry.combo : null;

    set({
      turn: {
        ...turn,
        dice,
        rolled: true,
        selectableCombos: combos,
        selectedTiles: [],
        canRollOneDie,
        finished: combos.length === 0,
        history: turn.history
      },
      bestMove
    });

    if (combos.length === 0) {
      get().endTurn();
    }
  },
  selectTile: (tile) => {
    const { turn, tilesOpen } = get();
    if (!turn || !turn.rolled || turn.finished) {
      return;
    }

    if (!tilesOpen.includes(tile)) {
      return;
    }

    set((state) => {
      if (!state.turn) return {};
      const alreadySelected = state.turn.selectedTiles.includes(tile);
      const selectedTiles = alreadySelected
        ? state.turn.selectedTiles.filter((value) => value !== tile)
        : [...state.turn.selectedTiles, tile];
      return {
        turn: {
          ...state.turn,
          selectedTiles
        }
      };
    });
  },
  resetSelection: () =>
    set((state) =>
      state.turn
        ? {
            turn: {
              ...state.turn,
              selectedTiles: []
            }
          }
        : {}
    ),
  confirmMove: () => {
    const state = get();
    const { turn, tilesOpen, options } = state;
    if (!turn || !turn.rolled || turn.finished) {
      return;
    }

    const total = turn.dice.reduce((sum, value) => sum + value, 0);
    const sortedSelection = [...turn.selectedTiles].sort((a, b) => a - b);
    const isValid = turn.selectableCombos.some((combo) =>
      isSameCombo(combo, sortedSelection)
    );

    if (!isValid) {
      return;
    }

    const remainingTiles = tilesOpen.filter(
      (tile) => !sortedSelection.includes(tile)
    );

    const historyEntry = {
      dice: turn.dice,
      closedTiles: sortedSelection
    };

    const nextCanRollOneDie = canUseOneDie(remainingTiles, options);
    const playerIndex = turn.playerIndex;

    const turnFinished = remainingTiles.length === 0;
    const instantWin = shouldInstantWin(remainingTiles, options);

    set({
      tilesOpen: remainingTiles,
      turn: {
        ...turn,
        dice: [],
        rolled: false,
        selectableCombos: [],
        selectedTiles: [],
        canRollOneDie: nextCanRollOneDie,
        finished: turnFinished,
        history: [...turn.history, historyEntry]
      }
    });

    set((stateAfter) => ({
      bestMove: null
    }));

    if (turnFinished) {
      const remainder = sumTiles(remainingTiles);
      set((stateAfter) => {
        const updatedPlayers = stateAfter.players.map((player, index) =>
          index === playerIndex
            ? {
                ...player,
                lastScore: remainder,
                totalScore:
                  stateAfter.options.scoring === 'target'
                    ? player.totalScore + remainder
                    : remainder
              }
            : player
        );
        const endMessage = `${updatedPlayers[playerIndex].name} shut the box!`;

        return {
          players: updatedPlayers,
          logs: [
            ...stateAfter.logs,
            {
              id: createId(),
              message: endMessage,
              timestamp: Date.now()
            }
          ]
        };
      });

      if (instantWin) {
        set((stateAfter) => ({
          phase: 'finished',
          winnerIds: [stateAfter.players[playerIndex].id],
          turn: stateAfter.turn
            ? { ...stateAfter.turn, finished: true }
            : stateAfter.turn
        }));
      } else {
        get().endTurn();
      }
    }
  },
  endTurn: () => {
    const state = get();
    const { turn, tilesOpen, options } = state;
    if (!turn) {
      return;
    }

    const remainder = sumTiles(tilesOpen);
    const updatedPlayers = state.players.map((player, index) =>
      index === turn.playerIndex
        ? {
            ...player,
            lastScore: remainder,
            totalScore:
              options.scoring === 'target'
                ? player.totalScore + remainder
                : remainder
          }
        : player
    );

    const logEntry: GameLogEntry = {
      id: createId(),
      message:
        turn.rolled && turn.selectableCombos.length === 0
          ? `${updatedPlayers[turn.playerIndex].name} had no moves and scored ${remainder}.`
          : `${updatedPlayers[turn.playerIndex].name} ends the turn with ${remainder}.`,
      timestamp: Date.now()
    };

    const nextPlayerIndex = turn.playerIndex + 1;
    const isLastPlayer = nextPlayerIndex >= updatedPlayers.length;

    const newState: Partial<GameStore> = {
      tilesOpen: createInitialTiles(options.maxTile),
      players: updatedPlayers,
      logs: [...state.logs, logEntry],
      bestMove: null
    };

    if (options.scoring === 'lowest') {
      if (isLastPlayer) {
        const minScore = Math.min(
          ...updatedPlayers.map((player) => player.lastScore ?? Infinity)
        );
        const winnerIds = updatedPlayers
          .filter((player) => player.lastScore === minScore)
          .map((player) => player.id);
        Object.assign(newState, {
          phase: 'finished',
          winnerIds,
          turn: null
        });
      } else {
        Object.assign(newState, {
          turn: {
            playerIndex: nextPlayerIndex,
            dice: [],
            rolled: false,
            selectableCombos: [],
            selectedTiles: [],
            history: [],
            canRollOneDie: canUseOneDie(
              createInitialTiles(options.maxTile),
              options
            ),
            finished: false
          }
        });
      }
    } else {
      const targetReached =
        options.scoring === 'target' &&
        updatedPlayers.some((player) => player.totalScore >= options.targetScore);
      if (targetReached) {
        const minTotal = Math.min(
          ...updatedPlayers.map((player) => player.totalScore)
        );
        const winnerIds = updatedPlayers
          .filter((player) => player.totalScore === minTotal)
          .map((player) => player.id);
        Object.assign(newState, {
          phase: 'finished',
          winnerIds,
          turn: null
        });
      } else {
        const nextIndex = isLastPlayer ? 0 : nextPlayerIndex;
        Object.assign(newState, {
          round: isLastPlayer ? state.round + 1 : state.round,
          turn: {
            playerIndex: nextIndex,
            dice: [],
            rolled: false,
            selectableCombos: [],
            selectedTiles: [],
            history: [],
            canRollOneDie: canUseOneDie(
              createInitialTiles(options.maxTile),
              options
            ),
            finished: false
          }
        });
      }
    }

    set(newState);
  },
  resetGame: () => {
    const { options } = get();
    const initialTiles = createInitialTiles(options.maxTile);
    set((state) => ({
      phase: 'setup',
      tilesOpen: initialTiles,
      turn: null,
      logs: [],
      winnerIds: [],
      bestMove: null,
      round: 1,
      players: state.players.map((player, index) => ({
        ...player,
        name: player.name.trim() || `Player ${index + 1}`,
        totalScore: 0,
        lastScore: null
      }))
    }));
  }
}));
