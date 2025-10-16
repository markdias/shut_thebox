import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';

const DICE_COUNT = 6;

function rollDice(): number[] {
  return Array.from({ length: DICE_COUNT }, () => Math.floor(Math.random() * 6) + 1);
}

const PIP_LAYOUTS: Record<number, { col: number; row: number }[]> = {
  1: [{ col: 2, row: 2 }],
  2: [
    { col: 1, row: 1 },
    { col: 3, row: 3 }
  ],
  3: [
    { col: 1, row: 1 },
    { col: 2, row: 2 },
    { col: 3, row: 3 }
  ],
  4: [
    { col: 1, row: 1 },
    { col: 3, row: 1 },
    { col: 1, row: 3 },
    { col: 3, row: 3 }
  ],
  5: [
    { col: 1, row: 1 },
    { col: 3, row: 1 },
    { col: 2, row: 2 },
    { col: 1, row: 3 },
    { col: 3, row: 3 }
  ],
  6: [
    { col: 1, row: 1 },
    { col: 3, row: 1 },
    { col: 1, row: 2 },
    { col: 3, row: 2 },
    { col: 1, row: 3 },
    { col: 3, row: 3 }
  ]
};

const DiceDotsGame = () => {
  const [dice, setDice] = useState<number[]>(() => rollDice());
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);

  const total = useMemo(() => dice.reduce((sum, value) => sum + value, 0), [dice]);

  useEffect(() => {
    if (!rolling) {
      return;
    }
    const timer = window.setTimeout(() => setRolling(false), 650);
    return () => window.clearTimeout(timer);
  }, [rolling]);

  const handleRoll = () => {
    setRolling(true);
    setDice(rollDice());
    setGuess('');
    setResult(null);
    setRevealed(false);
  };

  const handleReveal = () => {
    const parsed = Number(guess);
    if (Number.isNaN(parsed)) {
      setResult('Type a number to guess the total number of dots.');
      return;
    }

    setRevealed(true);
    if (parsed === total) {
      setResult(`Yes! The dice show ${total} dots in total.`);
    } else {
      setResult(`Close! The total was ${total} dots. Try another roll.`);
    }
  };

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>Dice dot detective</h4>
        <p>Roll six dice and guess the total number of dots.</p>
      </header>
      <div className="learning-card-body">
        <div
          className={classNames('learning-dice-tray', { rolling })}
          role="img"
          aria-label={
            revealed
              ? `Six dice showing ${dice.join(', ')} for a total of ${total}`
              : 'Six dice are rolling with their values hidden until you reveal them.'
          }
        >
          {dice.map((value, index) => {
            const pipLayout = PIP_LAYOUTS[value];
            return (
              <span
                key={`die-${index}`}
                className={classNames('die', revealed ? 'die-revealed' : 'die-empty', {
                  rolling
                })}
              >
                {revealed ? (
                  pipLayout.map((position, pipIndex) => (
                    <span
                      key={pipIndex}
                      className="pip"
                      style={{ gridColumn: position.col, gridRow: position.row }}
                    />
                  ))
                ) : (
                  <span className="die-placeholder">?</span>
                )}
              </span>
            );
          })}
        </div>
        <p className="learning-hint" aria-live="polite">
          {revealed
            ? `The dice landed on ${dice.join(', ')} for a total of ${total}.`
            : 'Imagine the pips and add them in your head before you press reveal!'}
        </p>
        <label className="field">
          <span className="field-label">Your guess</span>
          <input
            type="number"
            min={6}
            max={36}
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            placeholder="Enter a number between 6 and 36"
          />
        </label>
        <div className="learning-actions">
          <button type="button" className="primary" onClick={handleReveal}>
            Check my guess
          </button>
          <button type="button" className="secondary" onClick={handleRoll}>
            Roll again
          </button>
        </div>
        <div className="learning-feedback" role="status" aria-live="polite">
          {result ? <p>{result}</p> : <p>Tip: Add the numbers you see in your head before you reveal!</p>}
        </div>
      </div>
    </div>
  );
};

export default DiceDotsGame;
