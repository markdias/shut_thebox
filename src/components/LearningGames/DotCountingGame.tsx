import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DotSpec {
  id: number;
  left: number;
  top: number;
  size: number;
}

interface DotPattern {
  count: number;
  dots: DotSpec[];
}

const MIN_DOTS = 4;
const MAX_DOTS = 36;
const EDGE_PADDING = 2;
const TILE_VALUES = Array.from({ length: MAX_DOTS }, (_, index) => index + 1);

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const shuffle = <T,>(values: T[]): T[] => {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const createDotPattern = (): DotPattern => {
  const count = Math.floor(Math.random() * (MAX_DOTS - MIN_DOTS + 1)) + MIN_DOTS;
  const gridDimension = Math.ceil(Math.sqrt(count));
  const cellSize = 100 / gridDimension;
  const jitter = cellSize * 0.2;
  const minSize = cellSize * 0.35;
  const maxSize = cellSize * 0.55;

  const cells = shuffle(Array.from({ length: gridDimension * gridDimension }, (_, index) => index));

  const dots: DotSpec[] = cells.slice(0, count).map((cellIndex, index) => {
    const row = Math.floor(cellIndex / gridDimension);
    const column = cellIndex % gridDimension;
    const baseLeft = (column + 0.5) * cellSize;
    const baseTop = (row + 0.5) * cellSize;
    const size = randomInRange(minSize, maxSize);
    const radius = size / 2;
    const minCenter = radius + EDGE_PADDING;
    const maxCenter = 100 - radius - EDGE_PADDING;
    const left = clamp(baseLeft + randomInRange(-jitter, jitter), minCenter, maxCenter);
    const top = clamp(baseTop + randomInRange(-jitter, jitter), minCenter, maxCenter);

    return {
      id: index,
      left,
      top,
      size
    };
  });

  return { count, dots };
};

const DotCountingGame = () => {
  const [pattern, setPattern] = useState<DotPattern>(() => createDotPattern());
  const [guess, setGuess] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');
  const [selectedDots, setSelectedDots] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelectedDots(new Set());
  }, [pattern]);

  const handleDotToggle = useCallback((id: number) => {
    setSelectedDots((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const dotElements = useMemo(
    () =>
      pattern.dots.map((dot) => {
        const isSelected = selectedDots.has(dot.id);
        return (
          <button
            key={dot.id}
            type="button"
            className={classNames('dot-count-dot', { selected: isSelected })}
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              width: `${dot.size}%`,
              height: `${dot.size}%`
            }}
            onClick={() => handleDotToggle(dot.id)}
            aria-pressed={isSelected}
            aria-label={`Mark dot ${dot.id + 1} as ${isSelected ? 'uncounted' : 'counted'}`}
          />
        );
      }),
    [handleDotToggle, pattern.dots, selectedDots]
  );

  const handleTileSelect = useCallback((value: number) => {
    setGuess((previous) => (previous === value ? null : value));
    setStatus('neutral');
    setFeedback(null);
  }, []);

  const handleCheck = () => {
    if (guess === null) {
      setFeedback('Tap a number tile to lock in your count before checking.');
      setStatus('neutral');
      return;
    }

    if (guess === pattern.count) {
      setFeedback('Great counting! Tap “New dot pattern” for a fresh challenge.');
      setStatus('correct');
    } else {
      setFeedback('Not quite—use the glowing total above to try a different tile.');
      setStatus('incorrect');
    }
  };

  const handleNewPattern = () => {
    setPattern(createDotPattern());
    setGuess(null);
    setFeedback(null);
    setStatus('neutral');
  };

  const boxStatus = useMemo(() => {
    if (status === 'correct') {
      return `Nice eyes! There are ${pattern.count} dots glowing.`;
    }
    if (status === 'incorrect') {
      return `There are ${pattern.count} dots shining in this pattern. Count again and try another tile.`;
    }
    return 'Tap each dot as you count it, then choose the tile that matches your total.';
  }, [pattern.count, status]);

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>Secret dot flash</h4>
        <p>Count the glowing dots, mark them as you go, then choose the matching tile.</p>
      </header>
      <div className="learning-card-body">
        <div
          className={classNames('learning-pressable', 'dot-count-panel', {
            success: status === 'correct',
            failure: status === 'incorrect'
          })}
        >
          <div className="dot-count-display" role="img" aria-label={`A cluster of ${pattern.count} dots to count.`}>
            {dotElements}
          </div>
          <span className="dot-count-message" role="status" aria-live="polite">
            {boxStatus}
          </span>
        </div>
        <section className="learning-number-board" aria-live="polite">
          <h5>How many dots are glowing?</h5>
          <div className="learning-number-grid">
            {TILE_VALUES.map((value) => {
              const isChosen = guess === value;
              const isChecked = isChosen && status !== 'neutral';
              const stateClass = isChecked
                ? status === 'correct'
                  ? ' correct'
                  : ' incorrect'
                : isChosen
                ? ' selected'
                : '';
              return (
                <button
                  key={value}
                  type="button"
                  className={`learning-number-button${stateClass}`}
                  onClick={() => handleTileSelect(value)}
                  aria-pressed={isChosen}
                  aria-label={`Select ${value} dots`}
                >
                  <span>{value}</span>
                </button>
              );
            })}
          </div>
          <p className="learning-selection" aria-live="polite">
            {guess === null ? 'Tap a tile to choose your total.' : `You selected ${guess} dots.`}
          </p>
        </section>
        <div className="learning-actions">
          <button type="button" className="primary" onClick={handleCheck}>
            Check my answer
          </button>
          <button type="button" className="secondary" onClick={handleNewPattern}>
            New dot pattern
          </button>
        </div>
        <div className={`learning-feedback ${status}`} role="status" aria-live="polite">
          <p id="dot-count-help">
            {feedback ?? 'Tip: group the dots into smaller sets to make counting faster.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DotCountingGame;
