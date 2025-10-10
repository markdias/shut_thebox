import { create } from 'zustand';
import { GameOptions, GamePhase, Player, TurnState } from '../types';
import { generateTileCombos, isSameCombo } from '../utils/combinations';
import { canUseOneDie, createInitialTiles, sumTiles } from '../utils/gameLogic';
import { createId } from '../utils/id';

type LogResult = 'info' | 'win' | 'loss';

interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
  playerId?: string;
  playerName?: string;
  score?: number;
  round?: number;
  result: LogResult;
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
  maxTile: 12,
  oneDieRule: 'after789'
};

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'setup',
  options: defaultOptions,
  tilesOpen: createInitialTiles(defaultOptions.maxTile),
  players: createDefaultPlayers(),
  round: 0,
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
    const { options, players, round: currentRound, logs } = get();
    const nextRound = currentRound + 1;
    const sanitizedPlayers = players.map((player, index) => ({
      ...player,
      name: player.name.trim() || `Player ${index + 1}`,
      totalScore: 0,
      lastScore: null
    }));

    const initialTiles = createInitialTiles(options.maxTile);

    set({
      phase: 'inProgress',
      tilesOpen: initialTiles,
      players: sanitizedPlayers,
      round: nextRound,
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
      logs: [
        ...logs,
        {
          id: createId(),
          message: 'New game started — aim to shut all 12 tiles!',
          timestamp: Date.now(),
          result: 'info',
          round: nextRound
        }
      ],
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
      get().endTurn();
    }
  },
  endTurn: () => {
    const state = get();
    const { turn, tilesOpen, options } = state;
    if (!turn) {
      return;
    }

    const remainder = sumTiles(tilesOpen);
    const shutTheBox = tilesOpen.length === 0;
    const updatedPlayers = state.players.map((player, index) =>
      index === turn.playerIndex
        ? {
            ...player,
            lastScore: remainder,
            totalScore: remainder
          }
        : player
    );

    const logEntry: GameLogEntry = {
      id: createId(),
      message: shutTheBox
        ? `${updatedPlayers[turn.playerIndex].name} shut the box!`
        : `${updatedPlayers[turn.playerIndex].name} scores ${remainder}.`,
      timestamp: Date.now(),
      playerId: updatedPlayers[turn.playerIndex].id,
      playerName: updatedPlayers[turn.playerIndex].name,
      score: remainder,
      round: state.round,
      result: shutTheBox ? 'win' : 'loss'
    };

    const nextPlayerIndex = turn.playerIndex + 1;
    const isLastPlayer = nextPlayerIndex >= updatedPlayers.length;

    const newState: Partial<GameStore> = {
      tilesOpen: createInitialTiles(options.maxTile),
      players: updatedPlayers,
      logs: [...state.logs, logEntry],
      bestMove: null
    };

    if (isLastPlayer) {
      const winnerIds = updatedPlayers
        .filter((player) => player.lastScore === 0)
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
      round: 0,
      players: state.players.map((player, index) => ({
        ...player,
        name: player.name.trim() || `Player ${index + 1}`,
        totalScore: 0,
        lastScore: null
      }))
    }));
  }
}));
