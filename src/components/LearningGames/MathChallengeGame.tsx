import { useMemo, useState } from 'react';

type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

interface MathChallenge {
  left: number;
  right: number;
  operation: Operation;
  symbol: string;
  answer: number;
}

const OPERATION_SYMBOLS: Record<Operation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷'
};

const generateChallenge = (): MathChallenge => {
  const operations: Operation[] = ['add', 'subtract', 'multiply', 'divide'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  if (operation === 'add') {
    const left = Math.floor(Math.random() * 18) + 3;
    const right = Math.floor(Math.random() * 18) + 3;
    return { left, right, operation, symbol: OPERATION_SYMBOLS[operation], answer: left + right };
  }

  if (operation === 'subtract') {
    const left = Math.floor(Math.random() * 20) + 10;
    const right = Math.floor(Math.random() * 10) + 1;
    return { left, right, operation, symbol: OPERATION_SYMBOLS[operation], answer: left - right };
  }

  if (operation === 'multiply') {
    const left = Math.floor(Math.random() * 10) + 2;
    const right = Math.floor(Math.random() * 10) + 2;
    return { left, right, operation, symbol: OPERATION_SYMBOLS[operation], answer: left * right };
  }

  // division challenge with whole-number answers
  const divisor = Math.floor(Math.random() * 10) + 2;
  const quotient = Math.floor(Math.random() * 10) + 2;
  const dividend = divisor * quotient;
  return { left: dividend, right: divisor, operation, symbol: OPERATION_SYMBOLS[operation], answer: quotient };
};

const describeOperation = (operation: Operation) => {
  switch (operation) {
    case 'add':
      return 'addition';
    case 'subtract':
      return 'subtraction';
    case 'multiply':
      return 'multiplication';
    case 'divide':
      return 'division';
    default:
      return 'math';
  }
};

const MathChallengeGame = () => {
  const [challenge, setChallenge] = useState<MathChallenge>(() => generateChallenge());
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');

  const prompt = useMemo(
    () => `${challenge.left} ${challenge.symbol} ${challenge.right} = ?`,
    [challenge]
  );

  const operationLabel = useMemo(() => describeOperation(challenge.operation), [challenge.operation]);

  const handleCheck = () => {
    const trimmed = guess.trim();
    if (trimmed === '') {
      setFeedback('Type your answer first, then press check.');
      setStatus('neutral');
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setFeedback('Use digits only—this puzzle expects a number.');
      setStatus('neutral');
      return;
    }

    if (parsed === challenge.answer) {
      setFeedback(`Great work! ${prompt.replace(' = ?', '')} = ${challenge.answer}.`);
      setStatus('correct');
    } else {
      setFeedback(`Almost! ${prompt.replace(' = ?', '')} equals ${challenge.answer}. Try another question.`);
      setStatus('incorrect');
    }
  };

  const handleNext = () => {
    setChallenge(generateChallenge());
    setGuess('');
    setFeedback(null);
    setStatus('neutral');
  };

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>Math mixer</h4>
        <p>Answer quick-fire {operationLabel} questions with addition, subtraction, multiplication, or division.</p>
      </header>
      <div className="learning-card-body math-challenge">
        <div className="math-challenge-equation" aria-live="polite">
          <span className="math-operation-tag">{operationLabel}</span>
          <strong>{prompt}</strong>
        </div>
        <label className="field">
          <span className="field-label">Your answer</span>
          <input
            type="number"
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            placeholder="Enter the result"
          />
        </label>
        <div className="learning-actions math-challenge-actions">
          <button type="button" className="primary" onClick={handleCheck}>
            Check my answer
          </button>
          <button type="button" className="secondary" onClick={handleNext}>
            New question
          </button>
        </div>
        <div className={`learning-feedback ${status}`} role="status" aria-live="polite">
          <p>{feedback ?? 'Tip: Use mental math tricks like doubles or times tables to go faster.'}</p>
        </div>
      </div>
    </div>
  );
};

export default MathChallengeGame;
