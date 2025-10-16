import classNames from 'classnames';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

const MIN_DICE = 1;
const MAX_DICE = 6;
const DEFAULT_DICE_COUNT = 6;

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

const DiceDotsGame = () => {
  const [diceCount, setDiceCount] = useState(DEFAULT_DICE_COUNT);
  const [dice, setDice] = useState<number[]>(() => rollDice(DEFAULT_DICE_COUNT));
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);

  const total = useMemo(() => dice.reduce((sum, value) => sum + value, 0), [dice]);
  const minGuess = diceCount;
  const maxGuess = diceCount * 6;
  const diceLabel = diceCount === 1 ? 'die' : 'dice';

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
    setGuess('');
    setResult(null);
    setRevealed(false);
  };

  const handleDiceCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCount = Number(event.target.value);
    setDiceCount(nextCount);
    setRolling(true);
    setDice(rollDice(nextCount));
    setGuess('');
    setResult(null);
    setRevealed(false);
  };

  const handleReveal = () => {
    if (guess === '') {
      setResult(`Type a number between ${minGuess} and ${maxGuess} to guess the total dots.`);
      return;
    }

    const parsed = Number(guess);
    if (Number.isNaN(parsed)) {
      setResult(`Type a number between ${minGuess} and ${maxGuess} to guess the total dots.`);
      return;
    }

    if (parsed < minGuess || parsed > maxGuess) {
      setResult(`Try a number between ${minGuess} and ${maxGuess}.`);
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
            : 'Count the pips you see on each die and add them together before you press check!'}
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
        <label className="field">
          <span className="field-label">Your guess</span>
          <input
            type="number"
            min={minGuess}
            max={maxGuess}
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            placeholder={`Enter a number between ${minGuess} and ${maxGuess}`}
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
