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
  const endTurn = useGameStore((state) => state.endTurn);
  const bestMove = useGameStore((state) => state.bestMove);
  const showHints = useGameStore((state) => state.showHints);
  const startGame = useGameStore((state) => state.startGame);
  const unfinishedCounts = useGameStore((state) => state.unfinishedCounts);
  const pendingTurn = useGameStore((state) => state.pendingTurn);
  const waitingForNext = useGameStore((state) => state.waitingForNext);
  const acknowledgeNextTurn = useGameStore((state) => state.acknowledgeNextTurn);

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
  if (turn?.selectableCombos) {
    turn.selectableCombos.forEach((combo) =>
      combo.forEach((value) => highlightTiles.add(value))
    );
  }
  if (showHints && bestMove) {
    bestMove.forEach((value) => bestTiles.add(value));
  }

  const startLabel = phase === 'setup' ? 'Start Game' : 'Start New Round';
  const startDisabled = phase === 'inProgress';
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
  const indicatorName = waitingForNext && pendingPlayerName ? pendingPlayerName : activePlayerName;
  const indicatorLabel = waitingForNext ? 'Next up' : 'Now playing';
  const indicatorFlash = turnHighlight || waitingForNext;

  const handleDiceClick = () => {
    if (!canRoll) {
      return;
    }
    rollDice(2);
  };

  return (
    <section className="panel board">
      <header className="panel-header">
        <div className="board-header-left">
          <span className="panel-kicker">Roll. React. Shut the box.</span>
          <h2>Board</h2>
          <p>
            {phase === 'setup'
              ? 'Add players and press Start Game to begin.'
              : 'Roll the dice, select a matching combination, and confirm your move.'}
          </p>
        </div>
        <div className="board-header-right">
          <button
            type="button"
            className="secondary board-start-button"
            onClick={startGame}
            disabled={startDisabled}
          >
            {startLabel}
          </button>
        </div>
      </header>

      <div className="panel-body">
        <div
          className={classNames('dice-zone', {
            ready: canRoll,
            rolling: diceRolling
          })}
          role="button"
          tabIndex={canRoll ? 0 : -1}
          aria-disabled={!canRoll}
          aria-label={canRoll ? 'Roll two dice' : 'Dice roll unavailable'}
          onClick={handleDiceClick}
          onKeyDown={(event) => {
            if (!canRoll) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleDiceClick();
            }
          }}
        >
          <span className="dice-label">Current roll</span>
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
                {value ? <span className="die-value">{value}</span> : null}
              </span>
            ))}
            {hasActiveDice ? (
              <span className="dice-total">= {displayedTotal}</span>
            ) : (
              <span className="dice-placeholder">Tap dice to roll</span>
            )}
          </div>
          <span className="dice-hint">
            {canRoll
              ? hasActiveDice
                ? 'Tap to roll again'
                : 'Tap or press Enter to roll two dice'
              : 'Waiting for current turn'}
          </span>
        </div>

        {waitingForNext && pendingPlayerName && (
          <div className="turn-toast" role="alertdialog" aria-live="assertive">
            <div className="turn-toast-body">
              <span className="turn-toast-label">Next player</span>
              <span className="turn-toast-name">{pendingPlayerName}</span>
              <span className="turn-toast-sub">Ready for their go?</span>
              <button
                type="button"
                className="primary turn-toast-action"
                onClick={acknowledgeNextTurn}
              >
                Start turn
              </button>
            </div>
          </div>
        )}

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
              'status-card-accent': showHints && !!bestMove,
              'status-card-alert': turn?.rolled && selectableCombos.length === 0
            })}
          >
            <span className="status-card-label">Valid combos</span>
            <span className="status-card-value">
              {turn?.rolled ? selectableCombos.length : 'Roll first'}
            </span>
          </div>
        </div>

        <div className="unfinished-panel">
          <div className="unfinished-header">
            <h3>Unfinished turns</h3>
            <span className="unfinished-sub">Tracks turns that ended without a shut box</span>
          </div>
          <ul className="unfinished-list">
            {players.map((player) => (
              <li key={`unfinished-${player.id}`}>
                <span className="unfinished-name">{player.name}</span>
                <span className="unfinished-count">{unfinishedCounts[player.id] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="tiles-grid">
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
          <div className="roll-buttons">
            <button
              type="button"
              className="secondary"
              onClick={() => rollDice(1)}
              disabled={!canRoll || !turn?.canRollOneDie}
            >
              Roll one die
            </button>
          </div>
          <div className="move-buttons">
            <button
              type="button"
              className="primary"
              onClick={confirmMove}
              disabled={!canConfirm || waitingForNext}
            >
              Confirm move
            </button>
            <button
              type="button"
              className="secondary"
              onClick={resetSelection}
              disabled={!hasSelection || waitingForNext}
            >
              Clear selection
            </button>
            <button
              type="button"
              className="ghost"
              onClick={endTurn}
              disabled={phase !== 'inProgress' || waitingForNext}
            >
              End turn
            </button>
          </div>
        </div>

        {showHints && selectableCombos.length ? (
          <div className="combo-list">
            <div className="combo-header">
              <h3>Available combinations</h3>
              <span className="combo-count">{selectableCombos.length}</span>
            </div>
            <ul>
              {selectableCombos.map((combo, index) => (
                <li key={`${combo.join('-')}-${index}`}>
                  {combo.join(' + ')}
                  {showHints && bestMove && combo.length === bestMove.length &&
                    combo.every((value) => bestMove.includes(value)) && <span className="badge">Best</span>}
                </li>
              ))}
            </ul>
          </div>
        ) : showHints ? (
          <div className="combo-list">
            <div className="combo-header">
              <h3>Available combinations</h3>
              <span className="combo-count muted">0</span>
            </div>
            <p className="muted">Roll the dice to see your options.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default GameBoard;
