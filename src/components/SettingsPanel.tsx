import { useGameStore } from '../store/gameStore';
import { GameOptions } from '../types';
import DropdownSelect from './ui/DropdownSelect';

const tileOptions: GameOptions['maxTile'][] = [9, 10, 12];

function SettingsPanel() {
  const options = useGameStore((state) => state.options);
  const setOption = useGameStore((state) => state.setOption);

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Settings</h2>
        <p>Choose your variant and launch a new round at any time.</p>
      </header>
      <div className="panel-body form-grid">
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
            checked={options.instantWinOnShut}
            onChange={(event) => setOption('instantWinOnShut', event.target.checked)}
            disabled={options.scoring === 'instant'}
          />
          <span className="checkbox-label">Instant win when all tiles are shut</span>
        </label>
      </div>
    </section>
  );
}

export default SettingsPanel;
