import classNames from 'classnames';
import { ChangeEvent, useCallback, useEffect, useId, useMemo, useState } from 'react';

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

interface LevelSpec {
  id: 'starter' | 'challenger' | 'expert';
  label: string;
  description: string;
  minDots: number;
  maxDots: number;
  baseFlashMs: number;
  perDotMs: number;
  minFlashMs: number;
  maxFlashMs: number;
}

const EDGE_PADDING = 2;

const LEVELS: LevelSpec[] = [
  {
    id: 'starter',
    label: 'Level 1',
    description: 'Gentle flash for quick groups.',
    minDots: 4,
    maxDots: 10,
    baseFlashMs: 1700,
    perDotMs: 90,
    minFlashMs: 1100,
    maxFlashMs: 3200
  },
  {
    id: 'challenger',
    label: 'Level 2',
    description: 'More dots with a brisk flash.',
    minDots: 8,
    maxDots: 20,
    baseFlashMs: 1400,
    perDotMs: 70,
    minFlashMs: 1000,
    maxFlashMs: 2600
  },
  {
    id: 'expert',
    label: 'Level 3',
    description: 'Packed patterns and a speedy reveal.',
    minDots: 12,
    maxDots: 36,
    baseFlashMs: 1200,
    perDotMs: 60,
    minFlashMs: 900,
    maxFlashMs: 2200
  }
];

type LevelId = (typeof LEVELS)[number]['id'];

const INITIAL_LEVEL = LEVELS[0];

const GLOBAL_MIN_DOTS = LEVELS[0].minDots;
const GLOBAL_MAX_DOTS = LEVELS[LEVELS.length - 1].maxDots;
const TILE_VALUES = Array.from({ length: GLOBAL_MAX_DOTS }, (_, index) => index + 1);

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const randomIntInclusive = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const shuffle = <T,>(values: T[]): T[] => {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const createDotPattern = (count: number): DotPattern => {
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

const getFlashDuration = (level: LevelSpec, count: number) =>
  clamp(level.baseFlashMs + level.perDotMs * count, level.minFlashMs, level.maxFlashMs);

const formatFlashDuration = (milliseconds: number) => `${(milliseconds / 1000).toFixed(1)}s`;

const createRandomPatternForLevel = (level: LevelSpec) =>
  createDotPattern(randomIntInclusive(level.minDots, level.maxDots));

const DotCountingGame = () => {
  const [levelId, setLevelId] = useState<LevelId>(INITIAL_LEVEL.id);
  const [pattern, setPattern] = useState<DotPattern>(() => createRandomPatternForLevel(INITIAL_LEVEL));
  const [guess, setGuess] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');
  const [isFlashVisible, setIsFlashVisible] = useState(true);
  const [flashIteration, setFlashIteration] = useState(0);

  const level = useMemo(() => LEVELS.find((entry) => entry.id === levelId) ?? INITIAL_LEVEL, [levelId]);

  const flashDurationMs = useMemo(
    () => getFlashDuration(level, pattern.count),
    [level, pattern.count]
  );

  const availableTileValues = useMemo(
    () => TILE_VALUES.filter((value) => value >= level.minDots && value <= level.maxDots),
    [level.maxDots, level.minDots]
  );

  const sliderHintId = useId();

  const dotElements = useMemo(
    () =>
      pattern.dots.map((dot) => {
        return (
          <span
            key={dot.id}
            className="dot-count-dot"
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              width: `${dot.size}%`,
              height: `${dot.size}%`
            }}
          />
        );
      }),
    [pattern.dots]
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
      setFeedback('Great recall! Try a new pattern or bump the level for a tougher flash.');
      setStatus('correct');
    } else {
      setFeedback('Not quite—flash the dots again or try a different tile.');
      setStatus('incorrect');
    }
  };

  const handleNewPattern = () => {
    setPattern(createRandomPatternForLevel(level));
    setGuess(null);
    setFeedback(null);
    setStatus('neutral');
    setIsFlashVisible(true);
    setFlashIteration((iteration) => iteration + 1);
  };

  const handleFlashAgain = () => {
    setIsFlashVisible(true);
    setFlashIteration((iteration) => iteration + 1);
  };

  const handleLevelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextLevelId = event.target.value as LevelId;
    const nextLevel = LEVELS.find((entry) => entry.id === nextLevelId) ?? INITIAL_LEVEL;
    setLevelId(nextLevelId);
    setPattern(createRandomPatternForLevel(nextLevel));
    setGuess(null);
    setFeedback(null);
    setStatus('neutral');
    setIsFlashVisible(true);
    setFlashIteration((iteration) => iteration + 1);
  };

  useEffect(() => {
    if (!isFlashVisible) {
      return;
    }
    const timer = window.setTimeout(() => setIsFlashVisible(false), flashDurationMs);
    return () => window.clearTimeout(timer);
  }, [flashDurationMs, flashIteration, isFlashVisible]);

  const boxStatus = useMemo(() => {
    if (status === 'correct') {
      return `Nice recall! ${pattern.count} dots flashed this round.`;
    }
    if (status === 'incorrect') {
      return `There were ${pattern.count} dots in the flash. Try another pattern to keep practising.`;
    }
    return isFlashVisible
      ? 'Watch closely! Count the glowing dots before they fade.'
      : 'Dots hidden—lock in your total or flash them again for another peek.';
  }, [isFlashVisible, pattern.count, status]);

  const levelRangeLabel = useMemo(
    () => `Each flash shows between ${level.minDots} and ${level.maxDots} dots.`,
    [level.maxDots, level.minDots]
  );

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>Secret dot flash</h4>
        <p>
          Choose a level, watch the dots flash, and remember the total before they disappear. Tap a tile to
          lock in your guess.
        </p>
      </header>
      <div className="learning-card-body">
        <div
          className={classNames('learning-pressable', 'dot-count-panel', {
            success: status === 'correct',
            failure: status === 'incorrect'
          })}
        >
          <div
            className={classNames('dot-count-display', { concealed: !isFlashVisible })}
            role="img"
            aria-label={
              isFlashVisible
                ? 'A cluster of glowing dots to count quickly.'
                : 'Dots hidden after the flash. Decide if you trust your total.'
            }
          >
            <div className="dot-count-dots" aria-hidden={!isFlashVisible}>
              {dotElements}
            </div>
            {!isFlashVisible && (
              <div className="dot-count-cover" aria-hidden="true">
                <span>Dots hidden! Trust your count or flash them again.</span>
              </div>
            )}
          </div>
          <span className="dot-count-message" role="status" aria-live="polite">
            {boxStatus}
          </span>
        </div>
        <section className="dot-count-settings" aria-live="polite">
          <fieldset className="dot-count-levels">
            <legend>Challenge level</legend>
            <div className="dot-count-level-grid">
              {LEVELS.map((entry) => {
                const isActive = entry.id === level.id;
                return (
                  <label
                    key={entry.id}
                    className={classNames('dot-count-level-option', { active: isActive })}
                  >
                    <input
                      type="radio"
                      name="dot-count-level"
                      value={entry.id}
                      checked={isActive}
                      onChange={handleLevelChange}
                    />
                    <span className="dot-count-level-title">{entry.label}</span>
                    <span className="dot-count-level-description">{entry.description}</span>
                    <span className="dot-count-level-range">{entry.minDots}–{entry.maxDots} dots</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="field dot-count-slider">
            <span className="field-label">Dot flash size</span>
            <div className="dot-count-slider-values" aria-live="polite" aria-atomic="true">
              <span className="dot-count-slider-secret" aria-hidden="true">
                Secret flash
              </span>
              <span className="sr-only">
                The dot flash size stays hidden until you check your answer.
              </span>
            </div>
            <p id={sliderHintId} className="field-hint">
              {levelRangeLabel} The exact total stays secret until you check your answer. The dots stay
              visible for about {formatFlashDuration(flashDurationMs)}.
            </p>
          </div>
        </section>
        <section className="learning-number-board" aria-live="polite">
          <h5>How many dots flashed?</h5>
          <div className="learning-number-grid">
            {availableTileValues.map((value) => {
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
          <button type="button" className="secondary" onClick={handleFlashAgain}>
            Flash dots again
          </button>
          <button type="button" className="secondary" onClick={handleNewPattern}>
            New dot pattern
          </button>
        </div>
        <div className={`learning-feedback ${status}`} role="status" aria-live="polite">
          <p id="dot-count-help">
            {feedback ?? 'Tip: look for friendly groups before the glow fades so you can recall them later.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DotCountingGame;
