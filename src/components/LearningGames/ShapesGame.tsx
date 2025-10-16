import { useMemo, useState } from 'react';

interface ShapeInfo {
  name: string;
  corners: number;
  sides: number;
  funFact: string;
}

const SHAPES: ShapeInfo[] = [
  {
    name: 'Triangle',
    corners: 3,
    sides: 3,
    funFact: 'Triangles are the only shapes that are always flat, even if you push on the corners.'
  },
  {
    name: 'Square',
    corners: 4,
    sides: 4,
    funFact: 'A square has four equal sides and four right angles.'
  },
  {
    name: 'Rectangle',
    corners: 4,
    sides: 4,
    funFact: 'Rectangles have opposite sides that are the same length.'
  },
  {
    name: 'Pentagon',
    corners: 5,
    sides: 5,
    funFact: 'The U.S. Department of Defense building is shaped like a pentagon.'
  },
  {
    name: 'Hexagon',
    corners: 6,
    sides: 6,
    funFact: 'Honeybees build hexagon-shaped cells because they fit together without gaps.'
  },
  {
    name: 'Octagon',
    corners: 8,
    sides: 8,
    funFact: 'An octagon has eight sides and eight corners—think of a stop sign!'
  },
  {
    name: 'Circle',
    corners: 0,
    sides: 0,
    funFact: 'Circles are perfectly round, so they do not have any corners or straight sides.'
  }
];

function getRandomShape(excludeName?: string): ShapeInfo {
  const available = excludeName ? SHAPES.filter((shape) => shape.name !== excludeName) : SHAPES;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

const ShapesGame = () => {
  const [shape, setShape] = useState<ShapeInfo>(() => getRandomShape());
  const [cornerGuess, setCornerGuess] = useState('');
  const [sideGuess, setSideGuess] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const correct = useMemo(() => {
    const corners = Number(cornerGuess);
    const sides = Number(sideGuess);
    return corners === shape.corners && sides === shape.sides;
  }, [cornerGuess, sideGuess, shape]);

  const handleCheck = () => {
    const corners = Number(cornerGuess);
    const sides = Number(sideGuess);
    if (Number.isNaN(corners) || Number.isNaN(sides)) {
      setResult('Enter the number of corners and sides to check your answer.');
      return;
    }

    if (corners === shape.corners && sides === shape.sides) {
      setResult(`Great job! A ${shape.name} has ${shape.corners} corners and ${shape.sides} sides.`);
    } else {
      setResult(`Not quite. A ${shape.name} has ${shape.corners} corners and ${shape.sides} sides.`);
    }
  };

  const handleNextShape = () => {
    setShape((current) => getRandomShape(current.name));
    setCornerGuess('');
    setSideGuess('');
    setResult(null);
  };

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>{shape.name} explorer</h4>
        <p>How many corners and sides does this shape have?</p>
      </header>
      <div className="learning-card-body">
        <div className="learning-question-grid">
          <label className="field">
            <span className="field-label">Corners</span>
            <input
              type="number"
              min={0}
              value={cornerGuess}
              onChange={(event) => setCornerGuess(event.target.value)}
              aria-label={`How many corners does a ${shape.name} have?`}
            />
          </label>
          <label className="field">
            <span className="field-label">Sides</span>
            <input
              type="number"
              min={0}
              value={sideGuess}
              onChange={(event) => setSideGuess(event.target.value)}
              aria-label={`How many sides does a ${shape.name} have?`}
            />
          </label>
        </div>
        <div className="learning-actions">
          <button type="button" className="primary" onClick={handleCheck}>
            Check my answer
          </button>
          <button type="button" className="secondary" onClick={handleNextShape}>
            Try another shape
          </button>
        </div>
        <div className="learning-feedback" role="status" aria-live="polite">
          {result ? <p>{result}</p> : <p>Tip: {shape.funFact}</p>}
        </div>
        <div className="learning-hint" aria-live="polite">
          {result && correct && <p>✅ You matched both the corners and sides!</p>}
        </div>
      </div>
    </div>
  );
};

export default ShapesGame;
