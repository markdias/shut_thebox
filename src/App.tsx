import { useMemo } from 'react';
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-glow" aria-hidden="true" />
        <div className="header-main">
          <div>
            <span className="title-kicker">Neon parlour edition</span>
            <h1>Shut the Box</h1>
            <p className="app-subtitle">
              Configure your rules, roll the dice, and close every tile you can.
            </p>
          </div>
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
        </div>
        <div className="header-toolbar">
          <div className="game-progress">
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
