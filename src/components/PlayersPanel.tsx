import { ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, MinusCircle, UserPlus2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

function PlayersPanel() {
  const players = useGameStore((state) => state.players);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const updatePlayerName = useGameStore((state) => state.updatePlayerName);
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);

  const handleNameChange = (id: string) => (event: ChangeEvent<HTMLInputElement>) => {
    updatePlayerName(id, event.target.value);
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Players</h2>
        <p>Set up a hot-seat match for as many players as you like.</p>
      </header>
      <div className="panel-body">
        <ul className="player-list">
          <AnimatePresence initial={false}>
            {players.map((player, index) => {
              const isActive = phase === 'inProgress' && turn?.playerIndex === index;
              const hasPlayed = player.lastScore !== null;
              const statusLabel = hasPlayed
                ? player.lastScore === 0
                  ? 'Shut the box!'
                  : `Score: ${player.lastScore}`
                : 'Awaiting turn';
              const showWinnerBadge = phase === 'finished' && player.lastScore === 0;
              return (
                <motion.li
                  key={player.id}
                  className={isActive ? 'active' : undefined}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                >
                  <div className="player-row">
                    <input
                      value={player.name}
                      onChange={handleNameChange(player.id)}
                      aria-label={`Rename ${player.name}`}
                    />
                    <button
                      type="button"
                      className="ghost icon-button"
                      onClick={() => removePlayer(player.id)}
                      disabled={players.length === 1 || phase !== 'setup'}
                      aria-label={`Remove ${player.name}`}
                    >
                      <MinusCircle size={16} />
                    </button>
                  </div>
                  <div className="player-stats">
                    <span>{statusLabel}</span>
                    {showWinnerBadge && (
                      <span className="badge with-icon">
                        <Crown size={12} aria-hidden />
                        Winner
                      </span>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        <button
          type="button"
          className="secondary icon-button"
          onClick={addPlayer}
          disabled={phase !== 'setup'}
        >
          <UserPlus2 size={16} />
          Add player
        </button>
      </div>
    </section>
  );
}

export default PlayersPanel;
