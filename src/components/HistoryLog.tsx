import { useGameStore } from '../store/gameStore';

function HistoryLog() {
  const logs = useGameStore((state) => state.logs);
  const clearHistory = useGameStore((state) => state.clearHistory);

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Score log</h2>
        <div className="header-row">
          <p>Track every finished turn and celebrate each shut box.</p>
          <button
            type="button"
            className="ghost"
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
            {logs
              .slice()
              .reverse()
              .map((log) => (
                <li key={log.id} className={`log-card ${log.result}`}>
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
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default HistoryLog;
