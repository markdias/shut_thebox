import classNames from 'classnames';
import { useMemo } from 'react';
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
  const rollDice = useGameStore((state) => state.rollDice);
  const selectTile = useGameStore((state) => state.selectTile);
  const confirmMove = useGameStore((state) => state.confirmMove);
  const resetSelection = useGameStore((state) => state.resetSelection);
  const endTurn = useGameStore((state) => state.endTurn);
  const bestMove = useGameStore((state) => state.bestMove);
  const showHints = useGameStore((state) => state.showHints);

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

  const canRoll = phase === 'inProgress' && !!turn && !turn.rolled;
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

  return (
    <section className="panel board">
      <header className="panel-header">
        <div>
          <span className="panel-kicker">Roll. React. Shut the box.</span>
          <h2>Board</h2>
          <p>
            {phase === 'setup'
              ? 'Add players and press Start Game to begin.'
              : 'Roll the dice, select a matching combination, and confirm your move.'}
          </p>
        </div>
        <div className="dice-display">
          <span className="dice-label">Current roll</span>
          {turn?.dice.length ? (
            <div className="dice-values">
              {turn.dice.map((value, index) => (
                <span key={`${value}-${index}`} className="die">
                  {value}
                </span>
              ))}
              <span className="dice-total">= {diceTotal}</span>
            </div>
          ) : (
            <span className="dice-placeholder">Roll to begin</span>
          )}
        </div>
      </header>

      <div className="panel-body">
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
              className="primary"
              onClick={() => rollDice(2)}
              disabled={!canRoll}
            >
              Roll two dice
            </button>
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
              disabled={!canConfirm}
            >
              Confirm move
            </button>
            <button
              type="button"
              className="secondary"
              onClick={resetSelection}
              disabled={!hasSelection}
            >
              Clear selection
            </button>
            <button type="button" className="ghost" onClick={endTurn} disabled={phase !== 'inProgress'}>
              End turn
            </button>
          </div>
        </div>

        {selectableCombos.length ? (
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
        ) : (
          <div className="combo-list">
            <div className="combo-header">
              <h3>Available combinations</h3>
              <span className="combo-count muted">0</span>
            </div>
            <p className="muted">Roll the dice to see your options.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default GameBoard;
