import { useMemo, useState } from 'react';

type Point = [number, number];

type ShapeDrawing =
  | { kind: 'regularPolygon'; sides: number; rotation?: number }
  | { kind: 'polygon'; points: Point[] }
  | { kind: 'circle'; radius?: number }
  | { kind: 'ellipse'; rx: number; ry: number; rotation?: number };

interface ShapeInfo {
  name: string;
  corners: number;
  sides: number;
  funFact: string;
  drawing: ShapeDrawing;
}

const SHAPE_FILL = 'rgba(59, 130, 246, 0.35)';
const SHAPE_STROKE = 'rgba(191, 219, 254, 0.9)';
const CORNER_COLOR = 'rgba(250, 204, 21, 0.9)';

const REGULAR_POLYGON_SHAPES: ShapeInfo[] = [
  {
    name: 'Triangle',
    corners: 3,
    sides: 3,
    funFact: 'Triangles are the strongest polygon—push on any corner and the shape keeps its form.',
    drawing: { kind: 'regularPolygon', sides: 3 }
  },
  {
    name: 'Square',
    corners: 4,
    sides: 4,
    funFact: 'A square has four equal sides and four right angles, like a checkerboard tile.',
    drawing: { kind: 'regularPolygon', sides: 4 }
  },
  {
    name: 'Pentagon',
    corners: 5,
    sides: 5,
    funFact: 'The famous Pentagon building near Washington, D.C. is shaped like this five-sided polygon.',
    drawing: { kind: 'regularPolygon', sides: 5 }
  },
  {
    name: 'Hexagon',
    corners: 6,
    sides: 6,
    funFact: 'Honeybees use hexagons in their hives because they connect without leaving any gaps.',
    drawing: { kind: 'regularPolygon', sides: 6 }
  },
  {
    name: 'Heptagon',
    corners: 7,
    sides: 7,
    funFact: 'A seven-sided heptagon is rare in nature but shows up in puzzles and fantasy game tokens.',
    drawing: { kind: 'regularPolygon', sides: 7 }
  },
  {
    name: 'Octagon',
    corners: 8,
    sides: 8,
    funFact: 'Stop signs use an octagon shape so drivers can recognise them instantly from any angle.',
    drawing: { kind: 'regularPolygon', sides: 8 }
  },
  {
    name: 'Nonagon',
    corners: 9,
    sides: 9,
    funFact: 'The word nonagon comes from Latin and literally means "nine corners".',
    drawing: { kind: 'regularPolygon', sides: 9 }
  },
  {
    name: 'Decagon',
    corners: 10,
    sides: 10,
    funFact: 'A decagon has ten equal sides when regular—double the sides of a pentagon!',
    drawing: { kind: 'regularPolygon', sides: 10 }
  },
  {
    name: 'Dodecagon',
    corners: 12,
    sides: 12,
    funFact: 'A regular dodecagon looks almost like a circle with twelve gentle edges.',
    drawing: { kind: 'regularPolygon', sides: 12 }
  }
];

const CUSTOM_SHAPES: ShapeInfo[] = [
  {
    name: 'Rectangle',
    corners: 4,
    sides: 4,
    funFact: 'Rectangles have opposite sides that are the same length—think of a book cover.',
    drawing: {
      kind: 'polygon',
      points: [
        [-48, -32],
        [48, -32],
        [48, 32],
        [-48, 32]
      ]
    }
  },
  {
    name: 'Parallelogram',
    corners: 4,
    sides: 4,
    funFact: 'Opposite sides of a parallelogram run alongside each other, like train tracks.',
    drawing: {
      kind: 'polygon',
      points: [
        [-52, -36],
        [42, -36],
        [52, 36],
        [-42, 36]
      ]
    }
  },
  {
    name: 'Rhombus',
    corners: 4,
    sides: 4,
    funFact: 'Every side of a rhombus is equal—imagine a tilted square or a kite turned sideways.',
    drawing: {
      kind: 'polygon',
      points: [
        [0, -52],
        [52, 0],
        [0, 52],
        [-52, 0]
      ]
    }
  },
  {
    name: 'Trapezoid',
    corners: 4,
    sides: 4,
    funFact: 'A trapezoid has one pair of parallel sides. Bridges often use this shape for support.',
    drawing: {
      kind: 'polygon',
      points: [
        [-52, 40],
        [52, 40],
        [28, -42],
        [-28, -42]
      ]
    }
  },
  {
    name: 'Circle',
    corners: 0,
    sides: 0,
    funFact: 'Circles are perfectly round—they never end and have no corners at all.',
    drawing: { kind: 'circle', radius: 48 }
  },
  {
    name: 'Oval',
    corners: 0,
    sides: 0,
    funFact: 'An oval, or ellipse, stretches a circle into an egg-like shape with a long and short axis.',
    drawing: { kind: 'ellipse', rx: 54, ry: 36 }
  }
];

const SHAPES: ShapeInfo[] = [...REGULAR_POLYGON_SHAPES, ...CUSTOM_SHAPES];

const NUMBER_TILES = Array.from({ length: 12 }, (_, index) => index + 1);

const createRegularPolygonPoints = (sides: number, radius = 56, rotationDeg = -90): Point[] => {
  const angleStep = (Math.PI * 2) / sides;
  const rotation = (rotationDeg * Math.PI) / 180;
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + index * angleStep;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
};

const formatPoints = (points: Point[]): string => points.map(([x, y]) => `${x},${y}`).join(' ');

const renderShapeArt = (shape: ShapeInfo) => {
  const viewBox = '-70 -70 140 140';
  const commonProps = {
    stroke: SHAPE_STROKE,
    strokeWidth: 3,
    fill: SHAPE_FILL
  };

  if (shape.drawing.kind === 'circle') {
    const radius = shape.drawing.radius ?? 52;
    return (
      <svg className="shape-canvas" viewBox={viewBox} role="presentation" aria-hidden="true">
        <circle cx={0} cy={0} r={radius} {...commonProps} />
      </svg>
    );
  }

  if (shape.drawing.kind === 'ellipse') {
    const { rx, ry, rotation = 0 } = shape.drawing;
    return (
      <svg className="shape-canvas" viewBox={viewBox} role="presentation" aria-hidden="true">
        <ellipse cx={0} cy={0} rx={rx} ry={ry} transform={`rotate(${rotation})`} {...commonProps} />
      </svg>
    );
  }

  const points: Point[] =
    shape.drawing.kind === 'regularPolygon'
      ? createRegularPolygonPoints(shape.drawing.sides, 58, shape.drawing.rotation)
      : shape.drawing.points;

  return (
    <svg className="shape-canvas" viewBox={viewBox} role="presentation" aria-hidden="true">
      <polygon points={formatPoints(points)} {...commonProps} />
      {shape.corners > 0 &&
        points.map(([x, y], index) => (
          <circle key={`corner-${index}`} cx={x} cy={y} r={4.5} fill={CORNER_COLOR} className="shape-corner" />
        ))}
    </svg>
  );
};

function getRandomShape(previousName?: string): ShapeInfo {
  const pool = previousName ? SHAPES.filter((shape) => shape.name !== previousName) : SHAPES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

const ShapesGame = () => {
  const [shape, setShape] = useState<ShapeInfo>(() => getRandomShape());
  const [stage, setStage] = useState<'sides' | 'corners' | 'complete'>('sides');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastGuess, setLastGuess] = useState<number | null>(null);
  const [guessStatus, setGuessStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');

  const art = useMemo(() => renderShapeArt(shape), [shape]);
  const includeZeroTile = shape.sides === 0 || shape.corners === 0 || lastGuess === 0;
  const numberTiles = useMemo(
    () => (includeZeroTile ? [0, ...NUMBER_TILES] : NUMBER_TILES),
    [includeZeroTile]
  );

  const questionPrompt = useMemo(() => {
    if (stage === 'sides') {
      return `How many sides does this ${shape.name} have?`;
    }
    if (stage === 'corners') {
      return `Great! Now how many corners does this ${shape.name} have?`;
    }
    return `Awesome! You matched every detail of the ${shape.name}.`;
  }, [shape, stage]);

  const hintPrompt = useMemo(() => {
    if (stage === 'complete') {
      return 'Tap the glowing shape to explore the next challenge.';
    }
    if (shape.corners === 0) {
      return 'Curved shapes have no corners—use the 0 tile when you need it.';
    }
    return 'Glow-dots mark every corner. Count them before choosing a number tile.';
  }, [shape, stage]);

  const handleNumberPick = (value: number) => {
    if (stage === 'complete') {
      setFeedback('You already solved this one! Tap the shape to see the next shape.');
      setGuessStatus('neutral');
      return;
    }

    setLastGuess(value);
    const expected = stage === 'sides' ? shape.sides : shape.corners;

    if (value === expected) {
      if (stage === 'sides') {
        setFeedback(
          `Nice counting! A ${shape.name} has ${shape.sides} sides. Now pick how many corners it has.`
        );
        setStage('corners');
        setGuessStatus('neutral');
        setLastGuess(null);
      } else {
        setFeedback(
          `Great job! A ${shape.name} has ${shape.sides} sides and ${shape.corners} corners. Tap the shape to keep exploring.`
        );
        setGuessStatus('correct');
        setStage('complete');
      }
    } else {
      setFeedback('Not quite—count again and try another number tile.');
      setGuessStatus('incorrect');
    }
  };

  const handleNextShape = () => {
    setShape((current) => getRandomShape(current.name));
    setStage('sides');
    setFeedback(null);
    setGuessStatus('neutral');
    setLastGuess(null);
  };

  const handleShapeClick = () => {
    if (stage !== 'complete') {
      setFeedback('Answer both questions first, then tap the shape to move on.');
      return;
    }

    handleNextShape();
  };

  return (
    <div className="learning-card">
      <header className="learning-card-header">
        <h4>{shape.name} explorer</h4>
        <p>Use the Shut the Box number tiles to answer each question, then tap the shape to continue.</p>
      </header>
      <div className="learning-card-body">
        <div className="shape-display">
          <button
            type="button"
            className={`shape-art-button${stage === 'complete' ? ' ready' : ''}`}
            onClick={handleShapeClick}
            aria-label={
              stage === 'complete'
                ? 'Show another shape'
                : `${shape.name} illustration. Answer the questions before moving on.`
            }
          >
            {art}
          </button>
          <p className="shape-hint">{hintPrompt}</p>
        </div>
        <section className="learning-number-board" aria-live="polite">
          <h5>{questionPrompt}</h5>
          <div className="learning-number-grid">
            {numberTiles.map((value) => {
              const isActive = value === lastGuess && guessStatus !== 'neutral';
              const stateClass =
                isActive && guessStatus === 'correct'
                  ? ' correct'
                  : isActive && guessStatus === 'incorrect'
                  ? ' incorrect'
                  : '';
              const labelTarget = stage === 'sides' ? 'sides' : 'corners';
              const ariaLabel = value === 0 ? `Select zero ${labelTarget}` : `Select ${value} ${labelTarget}`;
              return (
                <button
                  key={value}
                  type="button"
                  className={`learning-number-button${stateClass}`}
                  onClick={() => handleNumberPick(value)}
                  aria-label={ariaLabel}
                >
                  <span>{value}</span>
                </button>
              );
            })}
          </div>
        </section>
        <div className="learning-feedback" role="status" aria-live="polite">
          <p>{feedback ?? `Tip: ${shape.funFact}`}</p>
        </div>
        <div className="learning-hint" aria-live="polite">
          {stage === 'corners' ? (
            <p>Step 2: Pick the number of corners.</p>
          ) : stage === 'complete' ? (
            <p>✅ You matched both sides and corners! Tap the shape to explore the next one.</p>
          ) : (
            <p>Step 1: Start with the sides.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShapesGame;
