import classNames from 'classnames';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

const MIN_DICE = 1;
const MAX_DICE = 6;
const DEFAULT_DICE_COUNT = 6;

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

function GuessTile({
  value,
  selected,
  onSelect
}: {
  value: number;
  selected: boolean;
  onSelect: (value: number) => void;
}) {
  return (
    <button
      type="button"
      className={classNames('tile', 'open', 'guess-tile', { selected })}
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      aria-label={`Guess ${value} dots`}
    >
      {value}
    </button>
  );
}

const DiceDotsGame = () => {
  const [diceCount, setDiceCount] = useState(DEFAULT_DICE_COUNT);
  const [dice, setDice] = useState<number[]>(() => rollDice(DEFAULT_DICE_COUNT));
  const [guess, setGuess] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);

  const total = useMemo(() => dice.reduce((sum, value) => sum + value, 0), [dice]);
  const minGuess = diceCount;
  const maxGuess = diceCount * 6;
  const diceLabel = diceCount === 1 ? 'die' : 'dice';
  const possibleTotals = useMemo(() => {
    const totals: number[] = [];
    for (let value = minGuess; value <= maxGuess; value += 1) {
      totals.push(value);
    }
    return totals;
  }, [minGuess, maxGuess]);

  useEffect(() => {
    if (!rolling) {
      return;
    }
    const timer = window.setTimeout(() => setRolling(false), 650);
    return () => window.clearTimeout(timer);
  }, [rolling]);

  const handleRoll = () => {
    setRolling(true);
    setDice(rollDice(diceCount));
    setGuess(null);
    setResult(null);
    setRevealed(false);
  };

  const handleDiceCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCount = Number(event.target.value);
    setDiceCount(nextCount);
    setRolling(true);
    setDice(rollDice(nextCount));
    setGuess(null);
    setResult(null);
    setRevealed(false);
  };

  const handleGuessSelect = (value: number) => {
    setGuess((previous) => (previous === value ? null : value));
    if (!revealed) {
      setResult(null);
    }
  };

  const handleReveal = () => {
    if (guess === null) {
      setResult(`Choose a total between ${minGuess} and ${maxGuess} by tapping a tile first.`);
      return;
    }

    setRevealed(true);
    if (guess === total) {
      setResult(`Yes! The dice show ${total} dots in total.`);
    } else {
      setResult(`Close! The total was ${total} dots. Try another roll.`);
    }
  };

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>Dice dot detective</h4>
        <p>Choose how many dice roll, then guess the total number of dots.</p>
      </header>
      <div className="learning-card-body">
        <div
          className={classNames('learning-dice-tray', { rolling })}
          role="img"
          aria-label={
            rolling
              ? `${diceCount} ${diceLabel} ${diceCount === 1 ? 'is' : 'are'} rolling.`
              : `${diceCount} ${diceLabel} showing ${dice.join(', ')} for a total of ${total}`
          }
        >
          {dice.map((value, index) => (
            <span
              key={`die-${index}`}
              className={classNames('die', `die-face-${value}`, {
                rolling
              })}
            >
              {[...Array(value)].map((_, pipIndex) => (
                <span key={pipIndex} className="pip" />
              ))}
            </span>
          ))}
        </div>
        <p className="learning-hint" aria-live="polite">
          {revealed
            ? `The ${diceLabel} landed on ${dice.join(', ')} for a total of ${total}.`
            : 'Count the pips you see on each die, then tap the tile that matches your total before you press check!'}
        </p>
        <label className="field">
          <span className="field-label">Dice in play</span>
          <select value={diceCount} onChange={handleDiceCountChange}>
            {Array.from({ length: MAX_DICE }, (_, index) => index + MIN_DICE).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span className="field-label">Your guess</span>
          <div className="tiles-grid learning-tiles" role="group" aria-label="Choose your guess">
            {possibleTotals.map((value) => (
              <GuessTile key={value} value={value} selected={guess === value} onSelect={handleGuessSelect} />
            ))}
          </div>
          <p className="learning-selection" aria-live="polite">
            {guess === null ? 'Tap a tile to choose your total.' : `You selected ${guess} dots.`}
          </p>
        </div>
        <div className="learning-actions">
          <button type="button" className="primary" onClick={handleReveal}>
            Check my guess
          </button>
          <button type="button" className="secondary" onClick={handleRoll}>
            Roll again
          </button>
        </div>
        <div className="learning-feedback" role="status" aria-live="polite">
          {result ? (
            <p>{result}</p>
          ) : (
            <p>Tip: Add the numbers you see on the dice in your head before you check!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiceDotsGame;
