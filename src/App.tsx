import { useMemo, useCallback, useState, useEffect, useId } from 'react';
import { useGameStore } from './store/gameStore';
import SettingsPanel from './components/SettingsPanel';
import GameBoard from './components/GameBoard';
import HistoryLog from './components/HistoryLog';
import PlayersPanel from './components/PlayersPanel';
import TutorialOverlay, { TutorialStep } from './components/TutorialOverlay';
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
  const showHeaderDetails = useGameStore((state) => Boolean(state.options.showHeaderDetails));
  const headerCollapsed = !showHeaderDetails;
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const historyVisible = useGameStore((state) => state.historyVisible);
  const toggleHistory = useGameStore((state) => state.toggleHistory);
  const mobileMenuPanelId = useId();
  const winnerModalTitleId = useId();
  const theme = useGameStore((state) => state.options.theme);
  const cheatAutoPlay = useGameStore((state) => Boolean(state.options.cheatAutoPlay));
  const restartCountdown = useGameStore((state) => state.restartCountdown);
  const setOption = useGameStore((state) => state.setOption);
  const endTurn = useGameStore((state) => state.endTurn);
  const waitingForNext = useGameStore((state) => state.waitingForNext);
  const [tutorialVariant, setTutorialVariant] = useState<'desktop' | 'mobile' | null>(null);
  const [preTutorialSettingsOpen, setPreTutorialSettingsOpen] = useState<boolean | null>(null);
  const [preTutorialMobileMenuOpen, setPreTutorialMobileMenuOpen] = useState<boolean | null>(null);
  const initialIsMobileViewport =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 720px)').matches
      : false;
  const [isMobileViewport, setIsMobileViewport] = useState(initialIsMobileViewport);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileChipsVisible, setMobileChipsVisible] = useState(!initialIsMobileViewport);

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(max-width: 720px)');
    const applyMatches = (matches: boolean) => {
      setIsMobileViewport(matches);
      setMobileChipsVisible(matches ? false : true);
      setMobileMenuOpen(false);
    };

    applyMatches(query.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyMatches(event.matches);
    };

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handleChange);
      return () => {
        query.removeEventListener('change', handleChange);
      };
    }

    query.addListener(handleChange);
    return () => {
      query.removeListener(handleChange);
    };
  }, []);

  const createMenuActionHandler = useCallback(
    (action: () => void) => () => {
      action();
      if (isMobileViewport) {
        setMobileMenuOpen(false);
      }
    },
    [isMobileViewport]
  );

  const desktopTutorialSteps: TutorialStep[] = useMemo(
    () => [
      {
        id: 'start-round',
        title: 'Start a new round',
        description:
          'Press “Start Game” to begin playing or launch the next round when everyone is ready.',
        targetId: 'start-round-button',
        placement: 'right'
      },
      {
        id: 'add-players',
        title: 'Seat everyone at the table',
        description:
          'Open the Settings sidebar to add, rename, or remove players. Use “Add player” to include another friend before the first roll.',
        targetId: 'add-player-button',
        placement: 'left'
      },
      {
        id: 'player-hints',
        title: 'Enable hints per player',
        description:
          'Each player row has its own Hints toggle. Let new players opt in while keeping experienced players on manual mode.',
        targetId: 'player-hints-toggle',
        placement: 'left'
      },
      {
        id: 'dice-zone',
        title: 'Roll the dice',
        description:
          'Use the dice area to roll. It highlights when it is your turn so you know when to tap.',
        targetId: 'dice-zone',
        placement: 'bottom'
      },
      {
        id: 'tiles-grid',
        title: 'Pick tiles that match the roll',
        description:
          'Click tiles that add up to your dice total. Hints can show valid options when enabled.',
        targetId: 'tiles-grid',
        placement: 'top'
      },
      {
        id: 'global-hints',
        title: 'Toggle hints during play',
        description:
          'Use “Show Hints” in the header toolbar to reveal or hide suggested tile combinations at any time.',
        targetId: 'header-hints-toggle',
        placement: 'bottom'
      },
      {
        id: 'confirm-move',
        title: 'Confirm your move',
        description:
          'Use “Confirm move” to shut the selected tiles and keep your turn going.',
        targetId: 'confirm-move-button',
        placement: 'top'
      },
      {
        id: 'end-turn',
        title: 'Wrap up a turn',
        description:
          'When you are stuck, “End turn” advances play. You can also open settings, history, or hints from this toolbar.',
        targetId: 'header-end-turn',
        placement: 'bottom'
      }
    ],
    []
  );

  const mobileTutorialSteps: TutorialStep[] = useMemo(
    () => [
      {
        id: 'mobile-menu',
        title: 'Use the mobile menu',
        description:
          'Tap the Menu button to reveal settings, history, hints, and this tutorial. The panel is open now so you can explore the options.',
        targetId: 'mobile-menu-toggle',
        placement: 'bottom'
      },
      {
        id: 'start-round',
        title: 'Start a new round',
        description:
          'Use “Start Game” to kick things off or begin a fresh round after scoring.',
        targetId: 'start-round-button',
        placement: 'right'
      },
      {
        id: 'add-players',
        title: 'Add and manage players',
        description:
          'Scroll to the Players section inside Settings to add, rename, or remove players before a round begins. The “Add player” button makes space for another opponent.',
        targetId: 'add-player-button',
        placement: 'left'
      },
      {
        id: 'player-hints',
        title: 'Set personal hint preferences',
        description:
          'Each player can toggle their own hints using the button in their row, perfect for mixing newcomers with veterans.',
        targetId: 'player-hints-toggle',
        placement: 'left'
      },
      {
        id: 'dice-zone',
        title: 'Roll the dice',
        description:
          'Tap the dice pad to roll. It pulses when it is ready so you know when you can act.',
        targetId: 'dice-zone',
        placement: 'bottom'
      },
      {
        id: 'tiles-grid',
        title: 'Select tiles to shut',
        description:
          'Tap tiles that add up to your roll. Selected tiles glow before you confirm the move.',
        targetId: 'tiles-grid',
        placement: 'top'
      },
      {
        id: 'global-hints',
        title: 'Show hints mid-game',
        description:
          'Need help during a turn? Use “Show Hints” in the header menu to reveal suggestions, then hide them again when you are ready.',
        targetId: 'header-hints-toggle',
        placement: 'bottom'
      },
      {
        id: 'confirm-move',
        title: 'Confirm and continue',
        description:
          '“Confirm move” locks in your selection. Keep rolling until you cannot make another play.',
        targetId: 'confirm-move-button',
        placement: 'top'
      }
    ],
    []
  );

  const activeTutorialSteps =
    tutorialVariant === 'desktop'
      ? desktopTutorialSteps
      : tutorialVariant === 'mobile'
        ? mobileTutorialSteps
        : null;

  const startTutorial = useCallback(() => {
    setPreTutorialSettingsOpen(settingsOpen);
    if (!settingsOpen) {
      toggleSettings(true);
    }
    if (isMobileViewport) {
      setPreTutorialMobileMenuOpen(mobileMenuOpen);
      setMobileMenuOpen(true);
    }
    setTutorialVariant(isMobileViewport ? 'mobile' : 'desktop');
  }, [isMobileViewport, mobileMenuOpen, settingsOpen, setMobileMenuOpen, toggleSettings]);

  const handleCloseTutorial = useCallback(() => {
    setTutorialVariant(null);
    if (preTutorialSettingsOpen !== null) {
      toggleSettings(preTutorialSettingsOpen);
      setPreTutorialSettingsOpen(null);
    }
    if (preTutorialMobileMenuOpen !== null) {
      setMobileMenuOpen(preTutorialMobileMenuOpen);
      setPreTutorialMobileMenuOpen(null);
    }
  }, [
    preTutorialMobileMenuOpen,
    preTutorialSettingsOpen,
    setMobileMenuOpen,
    toggleSettings
  ]);

  const renderStatusTray = (extraClass?: string) => {
    const trayClass = ['status-tray', extraClass].filter(Boolean).join(' ');
    return (
      <div className={trayClass}>
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
          <strong>{phase === 'inProgress' && activePlayer ? activePlayer.name : 'Waiting to start'}</strong>
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
    );
  };

  const renderHeaderActions = (extraClass?: string) => {
    const actionsClass = ['header-actions', extraClass].filter(Boolean).join(' ');
    return (
      <div className={actionsClass}>
        <button
          className="secondary"
          onClick={createMenuActionHandler(() => toggleSettings(!settingsOpen))}
        >
          {settingsOpen ? 'Hide Settings' : 'Show Settings'}
        </button>
        <button className="secondary" onClick={createMenuActionHandler(() => toggleHistory(!historyVisible))}>
          {historyVisible ? 'Hide History' : 'Show History'}
        </button>
        <button
          className="secondary"
          data-tutorial-target="header-hints-toggle"
          onClick={createMenuActionHandler(toggleHints)}
        >
          {showHints ? 'Hide Hints' : 'Show Hints'}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={createMenuActionHandler(handleSaveScores)}
        >
          Save scores
        </button>
        <button className="ghost" onClick={createMenuActionHandler(resetGame)}>
          Reset
        </button>
        <button
          className="ghost"
          data-tutorial-target="header-end-turn"
          onClick={createMenuActionHandler(endTurn)}
          disabled={phase !== 'inProgress' || waitingForNext}
        >
          End turn
        </button>
        <button
          className="ghost"
          type="button"
          data-tutorial-target="header-how-to-play"
          onClick={startTutorial}
        >
          How to Play
        </button>
      </div>
    );
  };

  // Header visibility is controlled via settings (options.showHeaderDetails)

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
          <div className="header-title-group">
            <h1>Shut the Box</h1>
            <p className="app-subtitle" hidden>
              Configure your rules, roll the dice, and close every tile you can.
            </p>
          </div>
        </div>
        <div className="header-toolbar">
          <div className="progress-stack">
            {/* Header details toggle moved to Settings panel */}
            <div className="status-block">
              {isMobileViewport ? (
                <>
                  <div className="mobile-header-toggle">
                    <button
                      type="button"
                      className={`mobile-menu-button ${mobileMenuOpen ? 'open' : ''}`}
                      data-tutorial-target="mobile-menu-toggle"
                      aria-expanded={mobileMenuOpen}
                      aria-controls={mobileMenuPanelId}
                      onClick={() => setMobileMenuOpen((open) => !open)}
                    >
                      <span className="sr-only">
                        {mobileMenuOpen ? 'Close header menu' : 'Open header menu'}
                      </span>
                      <span aria-hidden="true" className="mobile-menu-icon">
                        <span className="mobile-menu-bar" />
                        <span className="mobile-menu-bar" />
                        <span className="mobile-menu-bar" />
                      </span>
                      <span className="mobile-menu-label">Menu</span>
                    </button>
                  </div>
                  <div
                    id={mobileMenuPanelId}
                    className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`}
                    aria-hidden={!mobileMenuOpen}
                  >
                    {renderHeaderActions('mobile-menu-actions')}
                  </div>
                  <div className={`mobile-status-panel ${mobileMenuOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="mobile-status-toggle"
                      onClick={() => setMobileChipsVisible((visible) => !visible)}
                    >
                      {mobileChipsVisible ? 'Hide status details' : 'Show status details'}
                    </button>
                  </div>
                  {mobileChipsVisible && renderStatusTray('mobile-visible mobile-status-tray')}
                </>
              ) : (
                <>
                  {renderStatusTray()}
                  {renderHeaderActions()}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {(cheatAutoPlay || typeof restartCountdown === 'number') && (
        <div className="autoplay-banner" role="status" aria-live="polite">
          <span className="autoplay-dot" aria-hidden="true" />
          <span className="autoplay-text">
            Auto-play active{typeof restartCountdown === 'number' ? ` — next game in ${restartCountdown}s` : ''}
          </span>
          <button
            type="button"
            className="ghost autoplay-stop"
            onClick={() => {
              setOption('cheatAutoPlay', false);
              setOption('autoRetryOnFail', false);
            }}
          >
            Stop
          </button>
        </div>
      )}

      {tutorialVariant && activeTutorialSteps && (
        <TutorialOverlay
          steps={activeTutorialSteps}
          onClose={handleCloseTutorial}
          variantLabel={tutorialVariant === 'mobile' ? 'Mobile' : 'Desktop'}
        />
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
