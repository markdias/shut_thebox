import { useMemo, useState } from 'react';

const DICE_COUNT = 6;

function rollDice(): number[] {
  return Array.from({ length: DICE_COUNT }, () => Math.floor(Math.random() * 6) + 1);
}

const DiceDotsGame = () => {
  const [dice, setDice] = useState<number[]>(() => rollDice());
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const total = useMemo(() => dice.reduce((sum, value) => sum + value, 0), [dice]);

  const handleRoll = () => {
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
        <div className="dice-row" role="img" aria-label={`Six dice rolled with a total of ${revealed ? total : 'hidden'}.`}>
          {dice.map((value, index) => (
            <span key={`die-${index}`} className={`dice-face ${revealed ? 'revealed' : ''}`} aria-hidden="true">
              {revealed ? value : '❓'}
            </span>
          ))}
        </div>
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
        {revealed && (
          <p className="learning-hint">The dice showed: {dice.join(', ')}.</p>
        )}
      </div>
    </div>
  );
};

export default DiceDotsGame;
