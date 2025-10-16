import { useMemo, useState } from 'react';

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
const MAX_DOTS = 20;

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const createDotPattern = (): DotPattern => {
  const count = Math.floor(Math.random() * (MAX_DOTS - MIN_DOTS + 1)) + MIN_DOTS;
  const dots: DotSpec[] = Array.from({ length: count }, (_, index) => ({
    id: index,
    left: randomInRange(8, 92),
    top: randomInRange(8, 92),
    size: randomInRange(8, 14)
  }));
  return { count, dots };
};

const DotCountingGame = () => {
  const [pattern, setPattern] = useState<DotPattern>(() => createDotPattern());
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');

  const dotElements = useMemo(
    () =>
      pattern.dots.map((dot) => (
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
      )),
    [pattern.dots]
  );

  const handleCheck = () => {
    const trimmed = guess.trim();
    if (trimmed === '') {
      setFeedback('Type how many dots you counted before checking.');
      setStatus('neutral');
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setFeedback('Type how many dots you counted before checking.');
      setStatus('neutral');
      return;
    }

    if (parsed === pattern.count) {
      setFeedback(`Nice eyes! There are ${pattern.count} dots.`);
      setStatus('correct');
    } else {
      setFeedback(`Not quite—there are ${pattern.count} dots. Try another pattern.`);
      setStatus('incorrect');
    }
  };

  const handleNewPattern = () => {
    setPattern(createDotPattern());
    setGuess('');
    setFeedback(null);
    setStatus('neutral');
  };

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>Secret dot flash</h4>
        <p>Count the glowing dots and enter how many you see before they change.</p>
      </header>
      <div className="learning-card-body">
        <div
          className="dot-count-display"
          role="img"
          aria-label={`A cluster of ${pattern.count} dots to count.`}
        >
          {dotElements}
        </div>
        <label className="field">
          <span className="field-label">Your count</span>
          <input
            type="number"
            min={0}
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            placeholder="Enter the number of dots"
            aria-describedby="dot-count-help"
          />
        </label>
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
