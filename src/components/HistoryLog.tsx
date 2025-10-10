import { AnimatePresence, motion } from 'framer-motion';
import { NotebookPen, Skull, Trophy } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

function HistoryLog() {
  const logs = useGameStore((state) => state.logs);
  const clearHistory = useGameStore((state) => state.clearHistory);

  const iconForResult = (result: 'info' | 'win' | 'loss') => {
    switch (result) {
      case 'win':
        return <Trophy size={16} aria-hidden />;
      case 'loss':
        return <Skull size={16} aria-hidden />;
      default:
        return <NotebookPen size={16} aria-hidden />;
    }
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Score log</h2>
        <div className="header-row">
          <p>Track every finished turn and celebrate each shut box.</p>
          <button
            type="button"
            className="ghost icon-button"
            onClick={clearHistory}
            disabled={logs.length === 0}
          >
            Clear log
          </button>
        </div>
      </header>
      <div className="panel-body log-cards">
        {logs.length === 0 ? (
          <p className="muted">No turns have been logged yet.</p>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {logs
                .slice()
                .reverse()
                .map((log) => (
                  <motion.li
                    key={log.id}
                    className={`log-card ${log.result}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  >
                    <div className="log-icon" aria-hidden>
                      {iconForResult(log.result)}
                    </div>
                    <div className="log-content">
                      <div className="log-card-header">
                        <span className="log-title">{log.message}</span>
                        {typeof log.score === 'number' && (
                          <span className="log-score">Score: {log.score}</span>
                        )}
                      </div>
                      <div className="log-meta">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        {log.playerName && <span>{log.playerName}</span>}
                        {typeof log.round === 'number' && <span>Game {log.round}</span>}
                      </div>
                    </div>
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}

export default HistoryLog;
