import { create } from 'zustand';
import { GameOptions, GamePhase, Player, TurnState } from '../types';
import { generateTileCombos, isSameCombo } from '../utils/combinations';
import { canUseOneDie, createInitialTiles, shouldInstantWin, sumTiles } from '../utils/gameLogic';
import { createId } from '../utils/id';
import { loadScoresSnapshot, saveScoresSnapshot } from '../utils/storage';

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
  previousWinnerIds: string[];
  settingsOpen: boolean;
  showHints: boolean;
  historyVisible: boolean;
  bestMove: number[] | null;
  unfinishedCounts: Record<string, number>;
  pendingTurn: TurnState | null;
  pendingTiles: number[] | null;
  waitingForNext: boolean;
  setOption: <K extends keyof GameOptions>(key: K, value: GameOptions[K]) => void;
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  togglePlayerHints: (id: string) => void;
  toggleSettings: (open: boolean) => void;
  toggleHints: () => void;
  toggleHistory: (open: boolean) => void;
  acknowledgeNextTurn: () => void;
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
      lastScore: null,
      hintsEnabled: false
    }
  ];
}

const defaultOptions: GameOptions = {
  maxTile: 12,
  oneDieRule: 'after789',
  scoring: 'lowest',
  targetScore: 100,
  instantWinOnShut: true
};

const storedSnapshot = loadScoresSnapshot();

const initialPlayers: Player[] =
  storedSnapshot && storedSnapshot.players.length > 0
    ? storedSnapshot.players.map((player, index) => ({
        id: player.id ?? createId(),
        name: player.name || `Player ${index + 1}`,
        totalScore: typeof player.totalScore === 'number' ? player.totalScore : 0,
        lastScore: typeof player.lastScore === 'number' ? player.lastScore : null,
        hintsEnabled: typeof player.hintsEnabled === 'boolean' ? player.hintsEnabled : false
      }))
    : createDefaultPlayers();

const initialRound = storedSnapshot?.round && storedSnapshot.round > 0 ? storedSnapshot.round : 1;
const storedCounts = storedSnapshot?.unfinishedCounts ?? {};

const initialUnfinishedCounts = initialPlayers.reduce<Record<string, number>>((acc, player) => {
  acc[player.id] = storedCounts[player.id] ?? 0;
  return acc;
}, {});

const initialPreviousWinnerIds = storedSnapshot?.previousWinnerIds ?? [];

export const useGameStore = create<GameStore>((set, get) => {
  const persistScores = () => {
    const state = get();
    saveScoresSnapshot(state.players, state.round, state.unfinishedCounts, state.previousWinnerIds);
  };

  return {
    phase: 'setup',
    options: defaultOptions,
    tilesOpen: createInitialTiles(defaultOptions.maxTile),
    players: initialPlayers,
    round: initialRound,
    turn: null,
    logs: [],
    winnerIds: [],
    previousWinnerIds: initialPreviousWinnerIds,
    settingsOpen: false,
    showHints: false,
    historyVisible: false,
    bestMove: null,
    unfinishedCounts: initialUnfinishedCounts,
    pendingTurn: null,
    pendingTiles: null,
    waitingForNext: false,
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
    addPlayer: () => {
      const newId = createId();
      set((state) => ({
        players: [
          ...state.players,
          {
            id: newId,
            name: `Player ${state.players.length + 1}`,
            totalScore: 0,
            lastScore: null,
            hintsEnabled: false
          }
        ],
        unfinishedCounts: {
          ...state.unfinishedCounts,
          [newId]: 0
        },
        round: 1
      }));
      persistScores();
    },
    removePlayer: (id) => {
      set((state) => {
        if (state.players.length === 1) {
          return {};
        }
        const { [id]: _removed, ...rest } = state.unfinishedCounts;
        return {
          players: state.players.filter((player) => player.id !== id),
          unfinishedCounts: rest,
          previousWinnerIds: state.previousWinnerIds.filter((winnerId) => winnerId !== id)
        };
      });
      persistScores();
    },
    updatePlayerName: (id, name) => {
      set((state) => ({
        players: state.players.map((player) =>
          player.id === id ? { ...player, name } : player
        )
      }));
      persistScores();
    },
    togglePlayerHints: (id) => {
      set((state) => ({
        players: state.players.map((player) =>
          player.id === id
            ? { ...player, hintsEnabled: !player.hintsEnabled }
            : player
        )
      }));
      persistScores();
    },
    toggleSettings: (open) => set({ settingsOpen: open }),
    toggleHints: () =>
      set((state) => ({
        showHints: !state.showHints
      })),
    toggleHistory: (open) => set({ historyVisible: open }),
    acknowledgeNextTurn: () => {
      const { pendingTurn, pendingTiles, options } = get();
      if (!pendingTurn) {
        set({ waitingForNext: false, pendingTiles: null, pendingTurn: null });
        return;
      }
      const nextTiles = pendingTiles ?? createInitialTiles(options.maxTile);
      set({
        tilesOpen: nextTiles,
        turn: pendingTurn,
        pendingTurn: null,
        pendingTiles: null,
        waitingForNext: false,
        bestMove: null
      });
      persistScores();
    },
    clearHistory: () => set({ logs: [] }),
    startGame: () => {
      const state = get();
      const { options, players, unfinishedCounts, phase, round } = state;

      const sanitizedPlayers = players.map((player, index) => ({
        ...player,
        name: player.name.trim() || `Player ${index + 1}`,
        totalScore: options.scoring === 'target' ? player.totalScore : 0,
        lastScore: null
      }));

      const initialTiles = createInitialTiles(options.maxTile);
      const syncedCounts = sanitizedPlayers.reduce<Record<string, number>>((acc, player) => {
        acc[player.id] = unfinishedCounts[player.id] ?? 0;
        return acc;
      }, {});

      const isNewRound = phase !== 'setup';
      const nextRound = isNewRound ? round + 1 : 1;

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
        logs: [],
        winnerIds: [],
        bestMove: null,
        unfinishedCounts: syncedCounts,
        pendingTurn: null,
        waitingForNext: false
      });
      persistScores();
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

      const remainingTiles = tilesOpen.filter((tile) => !sortedSelection.includes(tile));

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

      set(() => ({
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
          persistScores();
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
      const playerId = state.players[turn.playerIndex]?.id;
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

      const playerClosedRound = remainder === 0;
      const resetTiles = createInitialTiles(options.maxTile);
      const updatedCounts = { ...state.unfinishedCounts };
      if (!playerClosedRound && playerId) {
        updatedCounts[playerId] = (updatedCounts[playerId] ?? 0) + 1;
      }

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
      const baseUpdate: Partial<GameStore> = {
        tilesOpen,
        players: updatedPlayers,
        logs: [...state.logs, logEntry],
        bestMove: null,
        unfinishedCounts: updatedCounts
      };

      let pendingTurn: TurnState | null = null;
      let pendingTiles: number[] | null = null;

      const buildPendingTurn = (playerIndex: number): TurnState => ({
        playerIndex,
        dice: [],
        rolled: false,
        selectableCombos: [],
        selectedTiles: [],
        history: [],
        canRollOneDie: canUseOneDie(resetTiles, options),
        finished: false
      });

      if (options.scoring === 'lowest') {
        if (isLastPlayer) {
          const scoredPlayers = updatedPlayers.filter((player) => player.lastScore !== null);
          const minScore = Math.min(
            ...scoredPlayers.map((player) => player.lastScore ?? Number.POSITIVE_INFINITY)
          );
          const winnerIds =
            Number.isFinite(minScore) && scoredPlayers.length > 0
              ? scoredPlayers
                  .filter((player) => (player.lastScore ?? Number.POSITIVE_INFINITY) === minScore)
                  .map((player) => player.id)
              : [];
          const singlePlayerNoShut =
            scoredPlayers.length === 1 && (scoredPlayers[0].lastScore ?? 0) > 0;

          if (winnerIds.length > 0 && !singlePlayerNoShut) {
            set({
              ...baseUpdate,
              phase: 'finished',
              winnerIds,
              previousWinnerIds: winnerIds,
              turn: {
                ...turn,
                rolled: false,
                finished: true
              },
              pendingTurn: null,
              pendingTiles: null,
              waitingForNext: false
            });
            persistScores();
            return;
          } else if (singlePlayerNoShut) {
            set({
              ...baseUpdate,
              phase: 'finished',
              winnerIds: [],
              previousWinnerIds: [],
              turn: {
                ...turn,
                rolled: false,
                finished: true
              },
              pendingTurn: null,
              pendingTiles: null,
              waitingForNext: false
            });
            persistScores();
            return;
          } else {
            Object.assign(baseUpdate, {
              round: state.round + 1
            });
            pendingTurn = buildPendingTurn(0);
            pendingTiles = resetTiles;
          }
        } else {
          pendingTurn = buildPendingTurn(nextPlayerIndex);
          pendingTiles = resetTiles;
        }
      } else {
        const shutIds = updatedPlayers
          .filter((player) => player.lastScore === 0)
          .map((player) => player.id);

        if (shutIds.length > 0 && options.scoring === 'instant') {
          set({
            ...baseUpdate,
            phase: 'finished',
            winnerIds: shutIds,
            previousWinnerIds: shutIds,
            turn: {
              ...turn,
              rolled: false,
              finished: true
            },
            pendingTurn: null,
            pendingTiles: null,
            waitingForNext: false
          });
          persistScores();
          return;
        } else {
          const nextIndex = isLastPlayer ? 0 : nextPlayerIndex;
          if (isLastPlayer) {
            Object.assign(baseUpdate, { round: state.round + 1 });
          }
          pendingTurn = buildPendingTurn(nextIndex);
          pendingTiles = resetTiles;
        }
      }

      set({
        ...baseUpdate,
        turn: {
          ...turn,
          rolled: false,
          finished: true
        },
        pendingTurn,
        pendingTiles,
        waitingForNext: pendingTurn !== null
      });
      persistScores();
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
        previousWinnerIds: state.previousWinnerIds,
        bestMove: null,
        round: 1,
        players: state.players.map((player, index) => ({
          ...player,
          name: player.name.trim() || `Player ${index + 1}`,
          totalScore: 0,
          lastScore: null
        })),
        unfinishedCounts: state.unfinishedCounts,
        pendingTurn: null,
        waitingForNext: false
      }));
      persistScores();
    }
  };
});
