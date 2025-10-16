import { useCallback, useEffect, useMemo, useState } from 'react';

type Operation = 'add' | 'subtract' | 'multiply' | 'divide';
type Difficulty = 'starter' | 'explorer' | 'challenger' | 'master';

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

const DEFAULT_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

interface Range {
  min: number;
  max: number;
}

interface DifficultyConfig {
  add: { left: Range; right: Range };
  subtract: { left: Range; right: Range };
  multiply: { left: Range; right: Range };
  divide: { divisor: Range; quotient: Range };
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  starter: {
    add: { left: { min: 0, max: 10 }, right: { min: 0, max: 10 } },
    subtract: { left: { min: 1, max: 10 }, right: { min: 0, max: 10 } },
    multiply: { left: { min: 1, max: 5 }, right: { min: 1, max: 5 } },
    divide: { divisor: { min: 1, max: 5 }, quotient: { min: 1, max: 5 } }
  },
  explorer: {
    add: { left: { min: 1, max: 12 }, right: { min: 1, max: 12 } },
    subtract: { left: { min: 6, max: 20 }, right: { min: 1, max: 10 } },
    multiply: { left: { min: 2, max: 6 }, right: { min: 2, max: 6 } },
    divide: { divisor: { min: 2, max: 6 }, quotient: { min: 2, max: 6 } }
  },
  challenger: {
    add: { left: { min: 10, max: 45 }, right: { min: 10, max: 45 } },
    subtract: { left: { min: 20, max: 70 }, right: { min: 6, max: 30 } },
    multiply: { left: { min: 3, max: 12 }, right: { min: 3, max: 12 } },
    divide: { divisor: { min: 3, max: 12 }, quotient: { min: 3, max: 12 } }
  },
  master: {
    add: { left: { min: 30, max: 99 }, right: { min: 30, max: 99 } },
    subtract: { left: { min: 60, max: 120 }, right: { min: 12, max: 48 } },
    multiply: { left: { min: 6, max: 15 }, right: { min: 6, max: 15 } },
    divide: { divisor: { min: 4, max: 15 }, quotient: { min: 4, max: 15 } }
  }
};

const DIFFICULTY_DETAILS: Record<
  Difficulty,
  { label: string; description: string }
> = {
  starter: {
    label: 'Starter',
    description: 'Gentle sums within 10—perfect for brand-new mathematicians.'
  },
  explorer: {
    label: 'Explorer',
    description: 'Friendly facts: numbers up to about 20 and times tables to 6.'
  },
  challenger: {
    label: 'Challenger',
    description: 'Mid-level mix with answers that push into the 40s and 100s.'
  },
  master: {
    label: 'Master',
    description: 'Trickier totals including big regrouping and extended tables.'
  }
};

const OPERATION_DETAILS: Record<Operation, { label: string; helper: string }> = {
  add: { label: 'Addition', helper: 'Combine two addends.' },
  subtract: { label: 'Subtraction', helper: 'Find the difference.' },
  multiply: { label: 'Multiplication', helper: 'Use times tables.' },
  divide: { label: 'Division', helper: 'Split into equal groups.' }
};

const DIFFICULTY_ORDER: Difficulty[] = ['starter', 'explorer', 'challenger', 'master'];

const randomInRange = ({ min, max }: Range) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateChallenge = (operations: Operation[], difficulty: Difficulty): MathChallenge => {
  const pool = operations.length ? operations : DEFAULT_OPERATIONS;
  const operation = pool[Math.floor(Math.random() * pool.length)];
  const config = DIFFICULTY_CONFIG[difficulty];

  if (operation === 'add') {
    const left = randomInRange(config.add.left);
    const right = randomInRange(config.add.right);
    return { left, right, operation, symbol: OPERATION_SYMBOLS[operation], answer: left + right };
  }

  if (operation === 'subtract') {
    const right = randomInRange(config.subtract.right);
    const leftMin = Math.max(config.subtract.left.min, right);
    const left = randomInRange({ min: leftMin, max: config.subtract.left.max });
    return { left, right, operation, symbol: OPERATION_SYMBOLS[operation], answer: left - right };
  }

  if (operation === 'multiply') {
    const left = randomInRange(config.multiply.left);
    const right = randomInRange(config.multiply.right);
    return { left, right, operation, symbol: OPERATION_SYMBOLS[operation], answer: left * right };
  }

  const divisor = randomInRange(config.divide.divisor);
  const quotient = randomInRange(config.divide.quotient);
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
  const [selectedOperations, setSelectedOperations] = useState<Operation[]>(DEFAULT_OPERATIONS);
  const [difficulty, setDifficulty] = useState<Difficulty>('starter');
  const operationsForGame = useMemo(
    () => (selectedOperations.length ? selectedOperations : DEFAULT_OPERATIONS),
    [selectedOperations]
  );
  const [challenge, setChallenge] = useState<MathChallenge>(() =>
    generateChallenge(operationsForGame, difficulty)
  );
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const equationStem = `${challenge.left} ${challenge.symbol} ${challenge.right}`;
  const prompt = `${equationStem} = ${answerRevealed ? challenge.answer : '?'}`;

  const operationLabel = useMemo(() => describeOperation(challenge.operation), [challenge.operation]);

  const selectionSummary = useMemo(() => {
    if (operationsForGame.length === DEFAULT_OPERATIONS.length) {
      return 'mixed operations';
    }

    const labels = operationsForGame.map((operation) => describeOperation(operation));
    if (labels.length === 1) {
      return labels[0];
    }

    if (labels.length === 2) {
      return `${labels[0]} and ${labels[1]}`;
    }

    const last = labels[labels.length - 1];
    return `${labels.slice(0, -1).join(', ')}, and ${last}`;
  }, [operationsForGame]);

  const createChallenge = useCallback(
    () => generateChallenge(operationsForGame, difficulty),
    [operationsForGame, difficulty]
  );

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

    setAnswerRevealed(true);

    if (parsed === challenge.answer) {
      setFeedback('Great work! Ready for another question?');
      setStatus('correct');
    } else {
      setFeedback('Almost! The correct answer is shown above—try another question.');
      setStatus('incorrect');
    }
  };

  const handleNext = () => {
    setChallenge(createChallenge());
    setGuess('');
    setFeedback(null);
    setStatus('neutral');
    setAnswerRevealed(false);
  };

  useEffect(() => {
    setChallenge(createChallenge());
    setGuess('');
    setFeedback(null);
    setStatus('neutral');
    setAnswerRevealed(false);
  }, [createChallenge]);

  const toggleOperation = (operation: Operation) => {
    setSelectedOperations((current) =>
      current.includes(operation)
        ? current.filter((item) => item !== operation)
        : [...current, operation]
    );
  };

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>Math mixer</h4>
        <p>
          Choose your mix of {selectionSummary} and tackle {DIFFICULTY_DETAILS[difficulty].label.toLowerCase()} level
          challenges.
        </p>
      </header>
      <div className="learning-card-body math-challenge">
        <div className="math-challenge-controls">
          <fieldset className="math-operation-selector">
            <legend>Sum types</legend>
            <p>Select at least one operation you want to practise.</p>
            <div className="math-operation-grid">
              {DEFAULT_OPERATIONS.map((operation) => {
                const isChecked = selectedOperations.includes(operation);
                return (
                  <label
                    key={operation}
                    className={`math-operation-toggle${isChecked ? ' active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOperation(operation)}
                    />
                    <div>
                      <strong>{OPERATION_DETAILS[operation].label}</strong>
                      <span>{OPERATION_DETAILS[operation].helper}</span>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="math-options-note">
              {selectedOperations.length
                ? `Currently practising ${selectionSummary}.`
                : 'No boxes ticked? We will surprise you with all four operations.'}
            </p>
          </fieldset>
          <label className="field math-difficulty-select">
            <span className="field-label">Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              {DIFFICULTY_ORDER.map((value) => (
                <option key={value} value={value}>
                  {DIFFICULTY_DETAILS[value].label}
                </option>
              ))}
            </select>
            <span className="field-hint">{DIFFICULTY_DETAILS[difficulty].description}</span>
          </label>
        </div>
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
