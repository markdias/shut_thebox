import classNames from 'classnames';
import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEARNING_GAMES } from './learningGames';
import ShapesGame from './ShapesGame';
import DiceDotsGame from './DiceDotsGame';
import DotCountingGame from './DotCountingGame';
import MathChallengeGame from './MathChallengeGame';
import type { LearningGameId } from '../../types';

const renderGame = (game: LearningGameId | null) => {
  switch (game) {
    case 'shapes':
      return <ShapesGame />;
    case 'dice':
      return <DiceDotsGame />;
    case 'dots':
      return <DotCountingGame />;
    case 'math':
      return <MathChallengeGame />;
    default:
      return null;
  }
};

const LearningGameBoard = () => {
  const showLearningGames = useGameStore((state) => Boolean(state.options.showLearningGames));
  const activeLearningGame = useGameStore((state) => state.activeLearningGame);
  const setActiveLearningGame = useGameStore((state) => state.setActiveLearningGame);

  const selectedDefinition = useMemo(
    () => LEARNING_GAMES.find((game) => game.id === activeLearningGame) ?? null,
    [activeLearningGame]
  );

  if (!showLearningGames || !activeLearningGame) {
    return null;
  }

  return (
    <section className="panel board learning-board">
      <div className="panel-body">
        <header className="learning-board-header">
          <span className="learning-board-kicker">Learning game</span>
          <h2>{selectedDefinition?.title ?? 'Explore together'}</h2>
          <p>
            {selectedDefinition?.description ??
              'Pick a mini game to practise quick math skills, then hop back into Shut the Box when you are ready.'}
          </p>
        </header>

        <div className="learning-board-switch" role="tablist" aria-label="Choose a learning game">
          {LEARNING_GAMES.map((game) => (
            <button
              key={game.id}
              type="button"
              role="tab"
              aria-selected={activeLearningGame === game.id}
              className={classNames('ghost', 'learning-game-button', {
                active: activeLearningGame === game.id
              })}
              onClick={() => setActiveLearningGame(game.id)}
            >
              <strong>{game.title}</strong>
              <span>{game.description}</span>
            </button>
          ))}
        </div>

        <div className="learning-board-content">{renderGame(activeLearningGame)}</div>

        <div className="learning-board-actions">
          <button type="button" className="ghost" onClick={() => setActiveLearningGame(null)}>
            Return to Shut the Box board
          </button>
        </div>
      </div>
    </section>
  );
};

export default LearningGameBoard;
