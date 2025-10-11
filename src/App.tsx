import { useMemo, useCallback, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useGameStore } from './store/gameStore';
import SettingsPanel from './components/SettingsPanel';
import GameBoard from './components/GameBoard';
import HistoryLog from './components/HistoryLog';
import PlayersPanel from './components/PlayersPanel';
import './styles/App.css';

function App() {
  const phase = useGameStore((state) => state.phase);
  const round = useGameStore((state) => state.round);
  const turn = useGameStore((state) => state.turn);
  const toggleSettings = useGameStore((state) => state.toggleSettings);
  const settingsOpen = useGameStore((state) => state.settingsOpen);
  const resetGame = useGameStore((state) => state.resetGame);
  const winnerIds = useGameStore((state) => state.winnerIds);
  const players = useGameStore((state) => state.players);
  const showHints = useGameStore((state) => state.showHints);
  const toggleHints = useGameStore((state) => state.toggleHints);
  const tilesOpen = useGameStore((state) => state.tilesOpen);
  const maxTile = useGameStore((state) => state.options.maxTile);
  const unfinishedCounts = useGameStore((state) => state.unfinishedCounts);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const historyVisible = useGameStore((state) => state.historyVisible);
  const toggleHistory = useGameStore((state) => state.toggleHistory);

  const winners = useMemo(
    () => players.filter((player) => winnerIds.includes(player.id)),
    [players, winnerIds]
  );

  const activePlayer = turn ? players[turn.playerIndex] : null;
  const closedTiles = Math.max(0, maxTile - tilesOpen.length);
  const completionPercent =
    maxTile > 0 ? Math.min(100, Math.round((closedTiles / maxTile) * 100)) : 0;
  const phaseLabel =
    phase === 'setup' ? 'Setup' : phase === 'finished' ? 'Round Complete' : 'In Play';

  const toggleHeaderCollapsed = useCallback(() => {
    setHeaderCollapsed((previous) => !previous);
  }, []);

  const handleProgressKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleHeaderCollapsed();
      }
    },
    [toggleHeaderCollapsed]
  );

  const handleSaveScores = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

      const payload = {
        exportedAt: new Date().toISOString(),
        round,
        phase,
        players: players.map((player) => ({
          id: player.id,
          name: player.name,
          totalScore: player.totalScore,
          lastScore: player.lastScore
        })),
        unfinishedCounts
      };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'shut-the-box-scores.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 0);
  }, [phase, players, round]);

  return (
    <div className="app-shell">
      <header className={`app-header ${headerCollapsed ? 'headline-collapsed' : ''}`}>
        <div className="header-glow" aria-hidden="true" />
        <div className={`header-main ${headerCollapsed ? 'collapsed' : ''}`}>
          <div>
            <span className="title-kicker">Neon parlour edition</span>
            <h1>Shut the Box</h1>
            <p className="app-subtitle">
              Configure your rules, roll the dice, and close every tile you can.
            </p>
          </div>
        </div>
        <div className="header-toolbar">
          <div className="progress-stack">
            <div
              className={`game-progress ${headerCollapsed ? 'collapsed' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={headerCollapsed}
              aria-expanded={!headerCollapsed}
              aria-label={headerCollapsed ? 'Show header details' : 'Hide header details'}
              onClick={toggleHeaderCollapsed}
              onKeyDown={handleProgressKeyDown}
            >
              <div className="progress-label">
                <span>Tiles shut</span>
                <span>
                  {closedTiles}/{maxTile}
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
            <div className="status-block">
              <div className="status-tray">
                <span className="status-chip">
                  <span className="status-label">Round</span>
                  <strong>{round}</strong>
                </span>
                <span className={`status-chip phase-${phase}`}>
                  <span className="status-label">Phase</span>
                  <strong>{phaseLabel}</strong>
                </span>
                <span className="status-chip wide">
                  <span className="status-label">Active player</span>
                  <strong>
                    {phase === 'inProgress' && activePlayer ? activePlayer.name : 'Waiting to start'}
                  </strong>
                </span>
                <span className={`status-chip hint-${showHints ? 'on' : 'off'}`}>
                  <span className="status-label">Hints</span>
                  <strong>{showHints ? 'On' : 'Off'}</strong>
                </span>
              </div>
              <div className="header-actions">
                <button className="secondary" onClick={() => toggleSettings(!settingsOpen)}>
                  {settingsOpen ? 'Hide Settings' : 'Show Settings'}
                </button>
                <button className="secondary" onClick={() => toggleHistory(!historyVisible)}>
                  {historyVisible ? 'Hide History' : 'Show History'}
                </button>
                <button className="secondary" onClick={toggleHints}>
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </button>
                <button type="button" className="ghost" onClick={handleSaveScores}>
                  Save scores
                </button>
                <button className="ghost" onClick={resetGame}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {phase === 'finished' && winners.length > 0 && (
        <div className="winner-banner">
          <strong>
            {winners.length === 1
              ? `${winners[0].name} wins!`
              : `${winners.map((player) => player.name).join(', ')} tie for the win!`}
          </strong>
        </div>
      )}

      <main className={`app-content ${settingsOpen ? 'with-sidebar' : 'full-width'}`}>
        <section className="board-column">
          <GameBoard />
          {historyVisible && <HistoryLog />}
        </section>
        {settingsOpen && (
          <aside className="sidebar">
            <SettingsPanel />
            <PlayersPanel />
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;
