import { useMemo } from 'react';
import { useGameStore } from './store/gameStore';
import SettingsPanel from './components/SettingsPanel';
import GameBoard from './components/GameBoard';
import HistoryLog from './components/HistoryLog';
import PlayersPanel from './components/PlayersPanel';
import './styles/App.css';

function App() {
  const phase = useGameStore((state) => state.phase);
  const toggleSettings = useGameStore((state) => state.toggleSettings);
  const settingsOpen = useGameStore((state) => state.settingsOpen);
  const resetGame = useGameStore((state) => state.resetGame);
  const winnerIds = useGameStore((state) => state.winnerIds);
  const players = useGameStore((state) => state.players);
  const showHints = useGameStore((state) => state.showHints);
  const toggleHints = useGameStore((state) => state.toggleHints);

  const winners = useMemo(
    () => players.filter((player) => winnerIds.includes(player.id)),
    [players, winnerIds]
  );

  const bestScore = useMemo(() => {
    const scores = players
      .map((player) => player.lastScore)
      .filter((score): score is number => typeof score === 'number');
    return scores.length ? Math.min(...scores) : null;
  }, [players]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Shut the Box</h1>
          <p className="app-subtitle">
            Configure your rules, roll the dice, and close every tile you can.
          </p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={() => toggleSettings(!settingsOpen)}>
            {settingsOpen ? 'Hide Settings' : 'Show Settings'}
          </button>
          <button className="secondary" onClick={toggleHints}>
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
          <button className="ghost" onClick={resetGame}>
            Reset
          </button>
        </div>
      </header>

      {phase === 'finished' && (
        <div className="winner-banner">
          {winners.length > 0 ? (
            <strong>
              {winners.length === 1
                ? `${winners[0].name} shut the box!`
                : `${winners.map((player) => player.name).join(', ')} shut the box!`}
            </strong>
          ) : (
            <strong>
              No winners this round. Best score: {bestScore ?? '—'}
            </strong>
          )}
        </div>
      )}

      <main className="app-content">
        <section className="board-column">
          <GameBoard />
          <HistoryLog />
        </section>
        <aside className={`sidebar ${settingsOpen ? 'open' : 'collapsed'}`}>
          <SettingsPanel />
          <PlayersPanel />
        </aside>
      </main>
    </div>
  );
}

export default App;
