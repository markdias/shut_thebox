import { FormEvent } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameOptions } from '../types';

const tileOptions: GameOptions['maxTile'][] = [9, 10, 12];

function SettingsPanel() {
  const options = useGameStore((state) => state.options);
  const setOption = useGameStore((state) => state.setOption);
  const phase = useGameStore((state) => state.phase);
  const startGame = useGameStore((state) => state.startGame);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    startGame();
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Settings</h2>
        <p>Choose your variant and launch a new round at any time.</p>
      </header>
      <form className="panel-body form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Highest tile</span>
          <select
            value={options.maxTile}
            onChange={(event) =>
              setOption('maxTile', Number(event.target.value) as GameOptions['maxTile'])
            }
          >
            {tileOptions.map((value) => (
              <option key={value} value={value}>
                1 – {value}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>One die rule</span>
          <select
            value={options.oneDieRule}
            onChange={(event) =>
              setOption('oneDieRule', event.target.value as GameOptions['oneDieRule'])
            }
          >
            <option value="after789">Allowed after top tiles shut</option>
            <option value="totalUnder6">Allowed when remainder &lt; 6</option>
            <option value="never">Never</option>
          </select>
        </label>

        <label className="field">
          <span>Scoring</span>
          <select
            value={options.scoring}
            onChange={(event) =>
              setOption('scoring', event.target.value as GameOptions['scoring'])
            }
          >
            <option value="lowest">Lowest single-round remainder</option>
            <option value="target">Cumulative to target</option>
            <option value="instant">Instant win on shut</option>
          </select>
        </label>

        {options.scoring === 'target' && (
          <label className="field">
            <span>Target score</span>
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
            checked={options.instantWinOnShut}
            onChange={(event) => setOption('instantWinOnShut', event.target.checked)}
            disabled={options.scoring === 'instant'}
          />
          <span>Instant win when all tiles are shut</span>
        </label>

        <button type="submit" className="primary" disabled={phase === 'inProgress'}>
          {phase === 'setup' ? 'Start Game' : 'Start New Round'}
        </button>
      </form>
    </section>
  );
}

export default SettingsPanel;
