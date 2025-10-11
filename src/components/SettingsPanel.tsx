import { useGameStore } from '../store/gameStore';
import { useState } from 'react';
import { GameOptions } from '../types';
import DropdownSelect from './ui/DropdownSelect';

const tileOptions: GameOptions['maxTile'][] = [9, 10, 12];

function SettingsPanel() {
  const options = useGameStore((state) => state.options);
  const setOption = useGameStore((state) => state.setOption);
  const startGame = useGameStore((state) => state.startGame);
  const [code, setCode] = useState('');
  const appVersion = import.meta.env.VITE_APP_VERSION ?? __APP_VERSION__ ?? 'dev';
  const rawUpdated = import.meta.env.VITE_LAST_UPDATED ?? (typeof __LAST_UPDATED__ !== 'undefined' ? __LAST_UPDATED__ : undefined);
  const lastUpdated = (() => {
    if (!rawUpdated) return null;
    const d = new Date(String(rawUpdated));
    return isNaN(d.getTime()) ? null : d.toLocaleString();
  })();

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Settings</h2>
        <p>Choose your variant and launch a new round at any time.</p>
      </header>
      <div className="panel-body form-grid">
        {/* Code tools moved to bottom and toggleable */}
        <label className="field">
          <span className="field-label">Theme</span>
          <DropdownSelect
            value={options.theme}
            options={[
              { value: 'neon', label: 'Neon glow' },
              { value: 'matrix', label: 'Matrix grid' }
            ]}
            onChange={(nextValue) => setOption('theme', nextValue as GameOptions['theme'])}
          />
        </label>
        <label className="field static-field version-field">
          <span className="field-label">Version</span>
          <span className="version-value">{appVersion}</span>
        </label>

        <label className="field static-field">
          <span className="field-label">Last updated</span>
          <span className="version-value">{lastUpdated ?? '—'}</span>
        </label>

        <label className="field">
          <span className="field-label">Highest tile</span>
          <DropdownSelect
            value={options.maxTile}
            options={tileOptions.map((value) => ({
              value,
              label: `1 – ${value}`
            }))}
            onChange={(nextValue) =>
              setOption('maxTile', Number(nextValue) as GameOptions['maxTile'])
            }
          />
        </label>

        <label className="field">
          <span className="field-label">One die rule</span>
          <DropdownSelect
            value={options.oneDieRule}
            options={[
              { value: 'after789', label: 'Allowed after top tiles shut' },
              { value: 'totalUnder6', label: 'Allowed when remainder < 6' },
              { value: 'never', label: 'Never' }
            ]}
            onChange={(nextValue) =>
              setOption('oneDieRule', nextValue as GameOptions['oneDieRule'])
            }
          />
        </label>

        <label className="field">
          <span className="field-label">Scoring</span>
          <DropdownSelect
            value={options.scoring}
            options={[
              { value: 'lowest', label: 'Lowest single-round remainder' },
              { value: 'target', label: 'Cumulative to target' },
              { value: 'instant', label: 'Instant win on shut' }
            ]}
            onChange={(nextValue) => setOption('scoring', nextValue as GameOptions['scoring'])}
          />
        </label>

        {options.scoring === 'target' && (
          <label className="field">
            <span className="field-label">Target score</span>
            <input
              type="number"
              min={10}
              value={options.targetScore}
            onChange={(event) => setOption('targetScore', Number(event.target.value))}
          />
        </label>
        )}

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={Boolean(options.showHeaderDetails)}
            onChange={(e) => setOption('showHeaderDetails', e.target.checked)}
          />
          <span className="checkbox-label">Show header details</span>
        </label>

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={options.instantWinOnShut}
            onChange={(event) => setOption('instantWinOnShut', event.target.checked)}
            disabled={options.scoring === 'instant'}
          />
          <span className="checkbox-label">Instant win when all tiles are shut</span>
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={Boolean(options.autoRetryOnFail)}
            onChange={(e) => setOption('autoRetryOnFail', e.target.checked)}
          />
          <span className="checkbox-label">Auto-retry on failure</span>
        </label>

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={Boolean(options.showCodeTools)}
            onChange={(e) => setOption('showCodeTools', e.target.checked)}
          />
          <span className="checkbox-label">Show code tools</span>
        </label>

        {Boolean(options.showCodeTools) && (
          <label className="field">
            <span className="field-label">Code</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter a code"
              />
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const value = code.trim().toLowerCase();
                  if (value === 'full') {
                    setOption('cheatFullWin', true);
                  } else if (value === 'madness') {
                    setOption('maxTile', 56);
                  } else if (value === 'takeover') {
                    // Visible auto-play: do NOT force winnable rolls
                    setOption('cheatAutoPlay', true);
                    setOption('cheatFullWin', false);
                    setOption('autoRetryOnFail', true);
                    // Immediately start (or restart) a game so it runs hands-free
                    startGame();
                  } else {
                    setOption('cheatFullWin', false);
                    setOption('cheatAutoPlay', false);
                    setOption('autoRetryOnFail', false);
                  }
                }}
              >
                Apply
              </button>
            </div>
            <small className="muted">Enter special codes to modify gameplay.</small>
          </label>
        )}
      </div>
    </section>
  );
}

export default SettingsPanel;
