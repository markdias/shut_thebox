import { useGameStore } from '../store/gameStore';

function HistoryLog() {
  const logs = useGameStore((state) => state.logs);
  const clearHistory = useGameStore((state) => state.clearHistory);

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Turn history</h2>
        <div className="header-row">
          <p>Every roll and end-of-turn result is captured here.</p>
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
      <div className="panel-body log-list">
        {logs.length === 0 ? (
          <p className="muted">No turns have been logged yet.</p>
        ) : (
          <ul>
            {logs
              .slice()
              .reverse()
              .map((log) => (
                <li key={log.id}>{log.message}</li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default HistoryLog;
