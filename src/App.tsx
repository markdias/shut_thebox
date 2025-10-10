import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Lightbulb,
  LightbulbOff,
  RotateCcw,
  Settings2,
  Sparkles
} from 'lucide-react';
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
  const round = useGameStore((state) => state.round);
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
      <div className="ambient-backdrop">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <header className="app-header">
        <div className="title-block">
          <div className="title-row">
            <h1>Shut the Box</h1>
            <span className="title-icon" aria-hidden>
              <Sparkles size={22} />
            </span>
          </div>
          <p className="app-subtitle">
            Configure your rules, roll the dice, and close every tile you can.
          </p>
          <div className="header-stats">
            <div className="stat-chip">
              <Sparkles size={16} />
              <span>
                {bestScore !== null ? `Best remainder: ${bestScore}` : 'No scores yet'}
              </span>
            </div>
            {phase === 'inProgress' && (
              <div className="stat-chip subtle">
                <span className="dot" aria-hidden />
                <span>Round {round}</span>
              </div>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="secondary icon-button"
            onClick={() => toggleSettings(!settingsOpen)}
          >
            <Settings2 size={16} />
            <span>{settingsOpen ? 'Hide Settings' : 'Show Settings'}</span>
          </button>
          <button className="secondary icon-button" onClick={toggleHints}>
            {showHints ? <LightbulbOff size={16} /> : <Lightbulb size={16} />}
            <span>{showHints ? 'Hide Hints' : 'Show Hints'}</span>
          </button>
          <button className="ghost icon-button" onClick={resetGame}>
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {phase === 'finished' && (
          <motion.div
            className="winner-banner"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <Sparkles size={18} aria-hidden />
            {winners.length > 0 ? (
              <strong>
                {winners.length === 1
                  ? `${winners[0].name} shut the box!`
                  : `${winners.map((player) => player.name).join(', ')} shut the box!`}
              </strong>
            ) : (
              <strong>No winners this round. Best score: {bestScore ?? '—'}</strong>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
