import { ChangeEvent } from 'react';
import { useGameStore } from '../store/gameStore';

function PlayersPanel() {
  const players = useGameStore((state) => state.players);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const updatePlayerName = useGameStore((state) => state.updatePlayerName);
  const togglePlayerHints = useGameStore((state) => state.togglePlayerHints);
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);
  const options = useGameStore((state) => state.options);

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
            return (
              <li key={player.id} className={isActive ? 'active' : undefined}>
                <div className="player-row">
                  <input
                    value={player.name}
                    onChange={handleNameChange(player.id)}
                    disabled={phase !== 'setup'}
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
                  <span>Last: {player.lastScore ?? '—'}</span>
                  <span>
                    {options.scoring === 'target' ? 'Total' : 'Score'}:{' '}
                    {options.scoring === 'target'
                      ? player.totalScore
                      : player.lastScore ?? '—'}
                  </span>
                </div>
                <button
                  type="button"
                  className={`hint-toggle ${player.hintsEnabled ? 'on' : 'off'}`}
                  onClick={() => togglePlayerHints(player.id)}
                >
                  Hints {player.hintsEnabled ? 'On' : 'Off'}
                </button>
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
