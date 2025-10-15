import classNames from 'classnames';
import { useMemo, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { createInitialTiles } from '../utils/gameLogic';

function TileButton({
  value,
  open,
  selected,
  highlight,
  best,
  onClick
}: {
  value: number;
  open: boolean;
  selected: boolean;
  highlight: boolean;
  best: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={classNames('tile', {
        open,
        selected,
        highlight,
        best
      })}
      onClick={onClick}
      disabled={!open}
    >
      {value}
    </button>
  );
}

function GameBoard() {
  const tilesOpen = useGameStore((state) => state.tilesOpen);
  const options = useGameStore((state) => state.options);
  const turn = useGameStore((state) => state.turn);
  const phase = useGameStore((state) => state.phase);
  const players = useGameStore((state) => state.players);
  const rollDice = useGameStore((state) => state.rollDice);
  const selectTile = useGameStore((state) => state.selectTile);
  const confirmMove = useGameStore((state) => state.confirmMove);
  const resetSelection = useGameStore((state) => state.resetSelection);
  const bestMove = useGameStore((state) => state.bestMove);
  const globalHints = useGameStore((state) => state.showHints);
  const pendingTurn = useGameStore((state) => state.pendingTurn);
  const waitingForNext = useGameStore((state) => state.waitingForNext);
  const acknowledgeNextTurn = useGameStore((state) => state.acknowledgeNextTurn);
  const startGame = useGameStore((state) => state.startGame);

  const allTiles = useMemo(
    () => createInitialTiles(options.maxTile),
    [options.maxTile]
  );

  const diceTotal = turn?.dice.reduce((sum, value) => sum + value, 0) ?? 0;
  const selectedTiles = turn?.selectedTiles ?? [];
  const selectableCombos = turn?.selectableCombos ?? [];
  const tilesRemaining = tilesOpen.length;
  const hasSelection = selectedTiles.length > 0;
  const selectionMatchesTotal =
    diceTotal > 0 &&
    selectedTiles.reduce((sum, value) => sum + value, 0) === diceTotal;
  const selectedTotal = selectedTiles.reduce((sum, value) => sum + value, 0);

  const legalSelection =
    selectionMatchesTotal &&
    selectableCombos.some((combo) =>
      combo.length === selectedTiles.length &&
      combo.every((value) => selectedTiles.includes(value))
    );

  const canRoll = phase === 'inProgress' && !!turn && !turn.rolled && !waitingForNext;
  const canConfirm = !!turn && turn.rolled && legalSelection;

  const highlightTiles = new Set<number>();
  const bestTiles = new Set<number>();
  const activePlayerHints = turn ? players[turn.playerIndex]?.hintsEnabled ?? false : false;
  const hintsActive = globalHints || activePlayerHints;
  if (hintsActive && turn?.selectableCombos) {
    turn.selectableCombos.forEach((combo) =>
      combo.forEach((value) => highlightTiles.add(value))
    );
  }
  if (hintsActive && bestMove) {
    bestMove.forEach((value) => bestTiles.add(value));
  }

  const canRollOneDieOption = !!turn && turn.canRollOneDie;
  const oneDieAvailable = canRoll && canRollOneDieOption;
  const totalTiles = allTiles.length;
  const tilesClosedCount = totalTiles - tilesRemaining;
  const progressPercent =
    totalTiles > 0 ? Math.min(100, Math.round((tilesClosedCount / totalTiles) * 100)) : 0;
  const showRoundIncomplete = phase === 'finished' && tilesRemaining > 0;
  const activePlayerName =
    phase === 'inProgress' && turn ? players[turn.playerIndex]?.name ?? null : null;

  const lastHistoryDice =
    turn && turn.history.length > 0 ? turn.history[turn.history.length - 1].dice : [];
  const displayedDice = turn?.dice.length ? turn.dice : lastHistoryDice;
  const diceSlots = Math.max(displayedDice.length, 2);
  const diceRender = Array.from({ length: diceSlots }, (_, index) => displayedDice[index] ?? 0);
  const hasActiveDice = displayedDice.length > 0;
  const displayedTotal = hasActiveDice
    ? displayedDice.reduce((sum, value) => sum + value, 0)
    : 0;

  const [turnHighlight, setTurnHighlight] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const previousPlayerRef = useRef<string | null>(null);
  const diceSequence = turn?.dice?.join('-') ?? '';

  useEffect(() => {
    let timeout: number | undefined;
    const currentName = activePlayerName ?? null;

    if (!currentName) {
      previousPlayerRef.current = null;
      setTurnHighlight(false);
      return () => undefined;
    }

    if (previousPlayerRef.current && previousPlayerRef.current !== currentName) {
      setTurnHighlight(true);
      timeout = window.setTimeout(() => {
        setTurnHighlight(false);
      }, 1600);
    }

    if (previousPlayerRef.current !== currentName) {
      previousPlayerRef.current = currentName;
    }

    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [activePlayerName]);

  useEffect(() => {
    if (!diceSequence) {
      setDiceRolling(false);
      return;
    }
    setDiceRolling(true);
    const timeout = window.setTimeout(() => {
      setDiceRolling(false);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [diceSequence]);

  const pendingPlayerName = pendingTurn ? players[pendingTurn.playerIndex]?.name ?? null : null;
  const showTurnToast = waitingForNext && !!pendingPlayerName;
  const indicatorName = waitingForNext && pendingPlayerName ? pendingPlayerName : activePlayerName;
  const indicatorLabel = waitingForNext ? 'Next up' : 'Now playing';
  const indicatorFlash = turnHighlight || waitingForNext;
  const canStartRound = (phase === 'setup' || phase === 'finished') && !waitingForNext;
  const diceHintText = (() => {
    if (waitingForNext) {
      return 'Awaiting next player confirmation';
    }
    if (canStartRound) {
      return phase === 'setup'
        ? 'Tap the dice to start the game'
        : 'Tap the dice to start the next round';
    }
    if (canRoll) {
      return hasActiveDice ? 'Tap to roll again' : 'Tap or press Enter to roll two dice';
    }
    return 'Waiting for current turn';
  })();

  const diceActive =
    (phase === 'inProgress' && !waitingForNext && (!turn || !turn.rolled)) || canStartRound;
  const tilesActive = !!turn && turn.rolled && !waitingForNext;
  const confirmReady = canConfirm && !waitingForNext;

  const handleDiceClick = () => {
    if (canStartRound) {
      startGame();
      return;
    }
    if (!canRoll) {
      return;
    }
    rollDice(2);
  };

  const handleRollOneDie = () => {
    if (!oneDieAvailable) {
      return;
    }
    rollDice(1);
  };

  return (
    <section className="panel board">
      <div className="panel-body">
        <div className="dice-section">
          <aside
            aria-hidden={!showTurnToast}
            className={classNames('turn-sidebar', {
              visible: showTurnToast
            })}
          >
            {showTurnToast ? (
              <div className="turn-toast" role="alertdialog" aria-live="assertive">
                <div className="turn-toast-body">
                  <span className="turn-toast-label">Next player</span>
                  <span className="turn-toast-name">{pendingPlayerName}</span>
                  <span className="turn-toast-sub">Ready for their go?</span>
                  <button
                    type="button"
                    className={classNames('primary', 'turn-toast-action', {
                      'action-ready': waitingForNext
                    })}
                    onClick={acknowledgeNextTurn}
                  >
                    Start turn
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
          <div
            className={classNames('dice-zone', {
              ready: canRoll || canStartRound,
              rolling: diceRolling,
              active: diceActive,
              'start-ready': canStartRound
            })}
            role="button"
            tabIndex={canRoll || canStartRound ? 0 : -1}
            aria-disabled={!(canRoll || canStartRound)}
            aria-label={
              canStartRound
                ? 'Start the round by rolling the dice'
                : canRoll
                  ? 'Roll two dice'
                  : 'Dice roll unavailable'
            }
            onClick={handleDiceClick}
            onKeyDown={(event) => {
              if (!(canRoll || canStartRound)) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleDiceClick();
              }
            }}
          >
            <span className="dice-label">
              {canStartRound ? 'Ready to start' : 'Current roll'}
              {canStartRound ? <span className="dice-label-pill">Tap to begin</span> : null}
            </span>
            <div className={classNames('dice-values', { rolling: diceRolling })}>
              {diceRender.map((value, index) => (
                <span
                  key={`die-${index}`}
                  className={classNames('die', value ? `die-face-${value}` : 'die-empty', {
                    rolling: diceRolling && !!turn?.dice.length
                  })}
                  aria-label={
                    value ? `Die showing ${value}` : 'Die ready to roll'
                  }
                >
          {value
            ? [...Array(value)].map((_, pipIndex) => <span key={pipIndex} className="pip" />)
            : <span className="die-placeholder">?</span>}
                </span>
              ))}
            </div>
            <div className="dice-actions">
              <span className="dice-hint">{diceHintText}</span>
              <button
                type="button"
                className={classNames('dice-control', { available: oneDieAvailable })}
                onClick={handleRollOneDie}
                disabled={!canRollOneDieOption || !canRoll}
              >
                Roll one die
              </button>
            </div>
          </div>
        {hintsActive && (
          <aside className="combo-sidebar">
            <div className="combo-header">
              <h3>Available combinations</h3>
              <span className="combo-count">{selectableCombos.length}</span>
            </div>
            {selectableCombos.length ? (
              <ul>
                {selectableCombos.map((combo, index) => (
                  <li key={`${combo.join('-')}-${index}`}>
                    <span className="combo-index">{index + 1}</span>
                    <span className="combo-values">
                      {combo.join(' + ')}
                    </span>
                    {bestMove &&
                      combo.length === bestMove.length &&
                      combo.every((value) => bestMove.includes(value)) && (
                        <span className="badge">Best</span>
                      )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Roll to reveal combos.</p>
            )}
            <button
              type="button"
              className="secondary combos-clear"
              onClick={resetSelection}
              disabled={!hasSelection || waitingForNext}
            >
              Clear selection
            </button>
          </aside>
        )}
        </div>

        <div className="board-progress">
          <div className="progress-label">
            <span>Tiles shut</span>
            <span>
              {tilesClosedCount}/{totalTiles}
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          {showRoundIncomplete && (
            <div
              className="board-progress-note board-progress-note-alert action-ready"
              role="status"
              aria-live="assertive"
            >
              <span className="note-icon" aria-hidden="true">
                !
              </span>
              <span className="note-text">BOX NOT SHUT THIS ROUND.</span>
            </div>
          )}
        </div>

        {indicatorName && (
          <div
            className={classNames('turn-indicator', {
              flash: indicatorFlash
            })}
            role="status"
            aria-live="polite"
          >
            <div className="turn-indicator-dot" aria-hidden="true" />
            <span className="turn-indicator-label">{indicatorLabel}</span>
            <span className="turn-indicator-name">{indicatorName}</span>
          </div>
        )}

        <div className="board-status-grid">
          <div className="status-card">
            <span className="status-card-label">Tiles in play</span>
            <span className="status-card-value">{tilesRemaining}</span>
          </div>
          <div className="status-card">
            <span className="status-card-label">Selected total</span>
            <span className="status-card-value">
              {selectedTotal > 0 ? `${selectedTotal}${diceTotal ? ` / ${diceTotal}` : ''}` : '—'}
            </span>
          </div>
          <div
            className={classNames('status-card', {
              'status-card-accent': hintsActive && !!bestMove,
              'status-card-alert': turn?.rolled && selectableCombos.length === 0
            })}
          >
            <span className="status-card-label">Valid combos</span>
            <span className="status-card-value">
              {turn?.rolled ? selectableCombos.length : 'Roll first'}
            </span>
          </div>
          <div className="status-card total-card">
            <span className="status-card-label">Dice total</span>
            <span className="status-card-value">{hasActiveDice ? displayedTotal : '—'}</span>
          </div>
        </div>

        <div
          className={classNames('tiles-grid', {
            active: tilesActive
          })}
        >
          {allTiles.map((tile) => {
            const open = tilesOpen.includes(tile);
            const selected = selectedTiles.includes(tile);
            return (
              <TileButton
                key={tile}
                value={tile}
                open={open}
                selected={selected}
                highlight={highlightTiles.has(tile) && turn?.rolled === true}
                best={bestTiles.has(tile)}
                onClick={() => selectTile(tile)}
              />
            );
          })}
        </div>

        {selectableCombos.length === 0 && turn?.rolled && (
          <div className="no-moves">No valid moves. Your turn ends.</div>
        )}

        <div className="board-controls">
          <button
            type="button"
            className={classNames('confirm-prompt', {
              'action-ready': confirmReady
            })}
            onClick={confirmMove}
            disabled={!canConfirm || waitingForNext}
          >
            Confirm move
          </button>
          {!hintsActive && (
            <button
              type="button"
              className="secondary clear-inline"
              onClick={resetSelection}
              disabled={!hasSelection || waitingForNext}
            >
              Clear selection
            </button>
          )}
        </div>

      </div>
    </section>
  );
}

export default GameBoard;
