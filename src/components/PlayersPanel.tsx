import { ChangeEvent } from 'react';
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
          {players.map((player, index) => {
            const isActive = phase === 'inProgress' && turn?.playerIndex === index;
            const hasPlayed = player.lastScore !== null;
            const statusLabel = hasPlayed
              ? player.lastScore === 0
                ? 'Shut the box!'
                : `Score: ${player.lastScore}`
              : 'Awaiting turn';
            return (
              <li key={player.id} className={isActive ? 'active' : undefined}>
                <div className="player-row">
                  <input
                    value={player.name}
                    onChange={handleNameChange(player.id)}
                    aria-label={`Rename ${player.name}`}
                  />
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => removePlayer(player.id)}
                    disabled={players.length === 1 || phase !== 'setup'}
                    aria-label={`Remove ${player.name}`}
                  >
                    ×
                  </button>
                </div>
                <div className="player-stats">
                  <span>{statusLabel}</span>
                  {phase === 'finished' && player.lastScore === 0 && (
                    <span className="badge">Winner</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <button type="button" className="secondary" onClick={addPlayer} disabled={phase !== 'setup'}>
          Add player
        </button>
      </div>
    </section>
  );
}

export default PlayersPanel;
