import { useMemo, useCallback, useState, useEffect, useId } from 'react';
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
  const previousWinnerIds = useGameStore((state) => state.previousWinnerIds);
  const showHints = useGameStore((state) => state.showHints);
  const toggleHints = useGameStore((state) => state.toggleHints);
  const unfinishedCounts = useGameStore((state) => state.unfinishedCounts);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const historyVisible = useGameStore((state) => state.historyVisible);
  const toggleHistory = useGameStore((state) => state.toggleHistory);
  const winnerModalTitleId = useId();
  const theme = useGameStore((state) => state.options.theme);
  const cheatAutoPlay = useGameStore((state) => Boolean(state.options.cheatAutoPlay));
  const restartCountdown = useGameStore((state) => state.restartCountdown);
  const setOption = useGameStore((state) => state.setOption);

  const winners = useMemo(
    () => players.filter((player) => winnerIds.includes(player.id)),
    [players, winnerIds]
  );

  const activePlayer = turn ? players[turn.playerIndex] : null;
  const phaseLabel =
    phase === 'setup' ? 'Setup' : phase === 'finished' ? 'Round Complete' : 'In Play';
  const playerNames =
    players.length > 0 ? players.map((player) => player.name).join(', ') : '—';
  const previousWinnerNames = useMemo(() => {
    if (!previousWinnerIds.length) {
      return '—';
    }
    const nameMap = new Map(players.map((player) => [player.id, player.name]));
    return previousWinnerIds
      .map((id) => nameMap.get(id) ?? 'Player')
      .join(', ');
  }, [players, previousWinnerIds]);

  const winnersKey = winnerIds.join('|');

  useEffect(() => {
    if (phase === 'finished' && winners.length > 0) {
      setWinnerModalOpen(true);
    } else {
      setWinnerModalOpen(false);
    }
  }, [phase, winners.length, winnersKey]);

  useEffect(() => {
    const rootEl = document.documentElement;
    const bodyEl = document.body;
    const themeClass = `theme-${theme}`;
    const removeThemeClasses = (element: Element) => {
      Array.from(element.classList)
        .filter((cls) => cls.startsWith('theme-'))
        .forEach((cls) => element.classList.remove(cls));
    };
    removeThemeClasses(rootEl);
    removeThemeClasses(bodyEl);
    rootEl.classList.add(themeClass);
    bodyEl.classList.add(themeClass);
    return () => {
      rootEl.classList.remove(themeClass);
      bodyEl.classList.remove(themeClass);
    };
  }, [theme]);

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
      unfinishedCounts,
      previousWinnerIds,
      theme
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
  }, [phase, players, previousWinnerIds, round, unfinishedCounts, theme]);

  return (
    <div className={`app-shell theme-${theme}`}>
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
              className={`header-toggle ${headerCollapsed ? 'collapsed' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={headerCollapsed}
              aria-expanded={!headerCollapsed}
              aria-label={headerCollapsed ? 'Show header details' : 'Hide header details'}
              onClick={toggleHeaderCollapsed}
              onKeyDown={handleProgressKeyDown}
            >
              <span>{headerCollapsed ? 'Show header details' : 'Hide header details'}</span>
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
                <span className="status-chip players-chip" aria-label="Players in game">
                  <span className="status-label">Players</span>
                  <strong>{playerNames}</strong>
                </span>
                <span className="status-chip previous-chip" aria-label="Previous winners">
                  <span className="status-label">Previous winner</span>
                  <strong>{previousWinnerNames}</strong>
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

      {cheatAutoPlay && (
        <div className="autoplay-banner" role="status" aria-live="polite">
          <span className="autoplay-dot" aria-hidden="true" />
          <span className="autoplay-text">
            Auto-play active{typeof restartCountdown === 'number' ? ` — next game in ${restartCountdown}s` : ''}
          </span>
          <button
            type="button"
            className="ghost autoplay-stop"
            onClick={() => {
              setOption('cheatAutoPlay' as any, false as any);
              setOption('autoRetryOnFail' as any, false as any);
            }}
          >
            Stop
          </button>
        </div>
      )}

      {phase === 'finished' && winners.length > 0 && winnerModalOpen && (
        <div className="winner-modal" role="dialog" aria-modal="true" aria-labelledby={winnerModalTitleId}>
          <div className="winner-modal-backdrop" aria-hidden="true" />
          <div className="winner-modal-panel">
            <header className="winner-modal-header">
              <span className="winner-modal-kicker">Round complete</span>
              <h2 className="winner-modal-title" id={winnerModalTitleId}>
                {winners.length === 1
                  ? `${winners[0].name} wins!`
                  : `${winners.map((player) => player.name).join(', ')} tie for the win!`}
              </h2>
            </header>
            <div className="winner-modal-body">
              <ul className="winner-scores">
                {players.map((player) => (
                  <li key={`winner-score-${player.id}`}>
                    <span className="winner-score-name">{player.name}</span>
                    <span className="winner-score-value">
                      {player.lastScore !== null ? player.lastScore : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <footer className="winner-modal-footer">
              <button type="button" className="primary" onClick={() => setWinnerModalOpen(false)}>
                OK
              </button>
            </footer>
          </div>
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
