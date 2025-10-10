import { FormEvent } from 'react';
import { SlidersHorizontal, Play } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { GameOptions } from '../types';

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
        <div className="title-with-icon">
          <SlidersHorizontal size={18} aria-hidden />
          <h2>Settings</h2>
        </div>
        <p>Every run uses tiles 1 through 12 — shut them all to win.</p>
      </header>
      <form className="panel-body form-grid" onSubmit={handleSubmit}>
        <div className="field readout">
          <span>Tile range</span>
          <strong>1 – {options.maxTile}</strong>
        </div>

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

        <button type="submit" className="primary icon-button" disabled={phase === 'inProgress'}>
          <Play size={16} />
          {phase === 'setup' ? 'Start Game' : 'Start New Round'}
        </button>
      </form>
    </section>
  );
}

export default SettingsPanel;
