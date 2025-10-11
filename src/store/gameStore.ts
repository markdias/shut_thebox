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
  restartCountdown: number | null;
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
  instantWinOnShut: true,
  theme: 'neon',
  cheatFullWin: false,
  cheatAutoPlay: false,
  showHeaderDetails: false,
  showCodeTools: false
};

const storedSnapshot = loadScoresSnapshot();

const initialTheme = storedSnapshot?.theme ?? defaultOptions.theme;

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
  let restartTimer: number | null = null;
  const persistScores = () => {
    const state = get();
    saveScoresSnapshot(
      state.players,
      state.round,
      state.unfinishedCounts,
      state.previousWinnerIds,
      state.options.theme
    );
  };

  const scheduleAutoRestart = (seconds: number) => {
    if (restartTimer) {
      window.clearInterval(restartTimer);
      restartTimer = null;
    }
    set({ restartCountdown: seconds });
    restartTimer = window.setInterval(() => {
      const s = get();
      const next = (s.restartCountdown ?? 0) - 1;
      if (next <= 0) {
        window.clearInterval(restartTimer!);
        restartTimer = null;
        set({ restartCountdown: null });
        get().startGame();
      } else {
        set({ restartCountdown: next });
      }
    }, 1000);
  };

  return {
    phase: 'setup',
    options: { ...defaultOptions, theme: initialTheme },
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
    restartCountdown: null,
    setOption: (key, value) => {
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
      });
      persistScores();
    },
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
      // In auto-play, immediately roll to keep going hands-free
      const st = get();
      if (st.options.cheatAutoPlay && st.turn && !st.turn.rolled) {
        window.setTimeout(() => {
          const s2 = get();
          if (s2.options.cheatAutoPlay && s2.turn && !s2.turn.rolled) {
            get().rollDice();
          }
        }, 500);
      }
    },
    clearHistory: () => set({ logs: [] }),
    startGame: () => {
      if (restartTimer) {
        window.clearInterval(restartTimer);
        restartTimer = null;
      }
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
        waitingForNext: false,
        restartCountdown: null
      });
      persistScores();

      if (options.cheatAutoPlay) {
        window.setTimeout(() => {
          const latest = get();
          if (latest.options.cheatAutoPlay && latest.turn && !latest.turn.rolled) {
            latest.rollDice();
          }
        }, 500);
      }
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

      const pickDiceForTotal = (total: number, diceNum: number): number[] => {
        if (diceNum === 1) return [Math.min(6, Math.max(1, total))];
        for (let a = 1; a <= 6; a += 1) {
          const b = total - a;
          if (b >= 1 && b <= 6) return [a, b];
        }
        return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
      };

      let diceToRoll = diceCount ?? (canRollOneDie ? 1 : 2);
      let dice: number[] = [];
      let combos: number[][] = [];
      let rollTotal = 0;

      if (options.cheatFullWin) {
        const candidates: Array<{ total: number; diceNum: number; combos: number[][]; remainder: number }>=[];
        const tryDiceNums = canRollOneDie ? [1, 2] : [2];
        for (const dn of tryDiceNums) {
          const totals = dn === 1 ? [1,2,3,4,5,6] : [2,3,4,5,6,7,8,9,10,11,12];
          for (const t of totals) {
            const c = generateTileCombos(tilesOpen, t);
            if (c.length > 0) {
              const best = c
                .map((combo) => ({ combo, remainder: sumTiles(tilesOpen.filter((tile) => !combo.includes(tile))) }))
                .sort((a, b) => a.remainder - b.remainder)[0];
              candidates.push({ total: t, diceNum: dn, combos: c, remainder: best?.remainder ?? Number.MAX_SAFE_INTEGER });
            }
          }
        }
        if (candidates.length > 0) {
          candidates.sort((a, b) => a.remainder - b.remainder);
          const chosen = candidates[0];
          diceToRoll = chosen.diceNum;
          dice = pickDiceForTotal(chosen.total, diceToRoll);
          combos = chosen.combos;
          rollTotal = chosen.total;
        }
      }

      if (dice.length === 0) {
        diceToRoll = diceCount ?? (canRollOneDie ? 1 : 2);
        dice = [];
        for (let i = 0; i < diceToRoll; i += 1) {
          dice.push(Math.floor(Math.random() * 6) + 1);
        }
        rollTotal = dice.reduce((sum, value) => sum + value, 0);
        combos = generateTileCombos(tilesOpen, rollTotal);
      }
      const combosRated = combos.map((combo) => {
        const remainder = sumTiles(tilesOpen.filter((tile) => !combo.includes(tile)));
        const maxTile = Math.max(...combo);
        const sum = combo.reduce((acc, n) => acc + n, 0);
        const length = combo.length;
        return { combo, remainder, maxTile, sum, length };
      });

      const bestMoveEntry = combosRated
        .sort((a, b) => {
          if (b.maxTile !== a.maxTile) {
            return b.maxTile - a.maxTile;
          }
          if (b.sum !== a.sum) {
            return b.sum - a.sum;
          }
          if (a.length !== b.length) {
            return a.length - b.length; // prefer fewer tiles when equal
          }
          return a.remainder - b.remainder;
        })[0];
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
        return;
      }
      // Auto-play tick after a successful roll (visible, step-by-step)
      const stAfter = get();
      if (stAfter.options.cheatAutoPlay) {
        const bm = stAfter.bestMove;
        if (bm && stAfter.turn && stAfter.turn.rolled) {
          // Small delay to simulate thinking, then select best move
          window.setTimeout(() => {
            const s1 = get();
            if (!s1.turn || s1.turn.finished || !s1.turn.rolled) return;
            set({
              turn: {
                ...s1.turn,
                selectedTiles: bm
              }
            });
            // Another delay to simulate clicking confirm
            window.setTimeout(() => {
              const s2 = get();
              if (!s2.turn || s2.turn.finished || !s2.turn.rolled) return;
              get().confirmMove();
            }, 600);
          }, 600);
        }
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
            ],
            unfinishedCounts: {
              ...stateAfter.unfinishedCounts,
              [stateAfter.players[playerIndex].id]: 0
            }
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
          const aft = get();
          if (aft.options.cheatAutoPlay) {
            set({
              options: {
                ...aft.options,
                cheatAutoPlay: false,
                autoRetryOnFail: false
              },
              restartCountdown: null
            });
            persistScores();
          }
          if (aft.options.autoRetryOnFail) {
            scheduleAutoRestart(3);
          }
        } else {
          get().endTurn();
        }
      }
      // If auto-play is enabled and the turn continues, roll again after a short delay
      const s2 = get();
      if (s2.options.cheatAutoPlay && s2.turn && !s2.turn.finished && !s2.turn.rolled) {
        window.setTimeout(() => {
          const s3 = get();
          if (s3.turn && !s3.turn.finished && !s3.turn.rolled) {
            get().rollDice();
          }
        }, 700);
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
            const aft = get();
            if (aft.options.cheatAutoPlay) {
              set({
                options: {
                  ...aft.options,
                  cheatAutoPlay: false,
                  autoRetryOnFail: false
                },
                restartCountdown: null
              });
              persistScores();
            }
            if (aft.options.autoRetryOnFail) {
              scheduleAutoRestart(3);
            }
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
          const aft = get();
          if (aft.options.cheatAutoPlay || aft.options.autoRetryOnFail) {
            scheduleAutoRestart(3);
          }
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
          const aft2 = get();
          if (aft2.options.cheatAutoPlay) {
            set({
              options: {
                ...aft2.options,
                cheatAutoPlay: false,
                autoRetryOnFail: false
              },
              restartCountdown: null
            });
            persistScores();
          }
          if (aft2.options.autoRetryOnFail) {
            scheduleAutoRestart(3);
          }
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

      // If auto-play/retry is enabled and the round just finished without a winner (solo fail),
      // schedule a restart with a visible countdown.
      const after = get();
      if (
        (after.options.cheatAutoPlay || after.options.autoRetryOnFail) &&
        after.phase === 'finished' &&
        Array.isArray(after.winnerIds) &&
        after.winnerIds.length === 0
      ) {
        scheduleAutoRestart(3);
      } else if (after.options.cheatAutoPlay && after.waitingForNext) {
        // Auto-ack the next turn prompt
        window.setTimeout(() => {
          const again = get();
          if (again.options.cheatAutoPlay && again.waitingForNext) {
            again.acknowledgeNextTurn();
          }
        }, 600);
      }
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
