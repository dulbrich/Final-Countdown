import { SOUND_OPTIONS } from './sounds';

export default function SettingsPage({
  soundEnabled,
  onToggleSound,
  volume,
  onVolumeChange,
  keepAliveEnabled,
  onToggleKeepAlive,
  cueSettings,
  onCueSettingChange,
  selectedSounds,
  onSoundSelectionChange,
  onPreviewSound,
  onBack,
}) {
  const volumePercent = Math.round(volume * 100);
  return (
    <section className="settings-page">
      <div className="settings-card">
        <div className="settings-header">
          <div>
            <h1>Timer Settings</h1>
            <p>Choose when sounds fire and what each cue should sound like.</p>
          </div>
          <button className="button button--ghost" onClick={onBack}>
            Back to Timer
          </button>
        </div>

        <div className="settings-grid">
          <div className="settings-section">
            <h2>Sound Behavior</h2>
            <label className="toggle-row">
              <input type="checkbox" checked={soundEnabled} onChange={onToggleSound} />
              <span>Enable sounds by default</span>
            </label>

            <label className="volume-row">
              <span>Volume <span className="volume-row__value">{volumePercent}%</span></span>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={volumePercent}
                onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
              />
            </label>

            <label className="toggle-row toggle-row--stacked">
              <span className="toggle-row__main">
                <input type="checkbox" checked={keepAliveEnabled} onChange={onToggleKeepAlive} />
                <span>Keep speakers awake</span>
              </span>
              <span className="toggle-row__hint">
                Plays a silent low tone so power-saving speakers don't fade in the first chime.
              </span>
            </label>

            <div className="cue-grid">
              <label>
                Final warning cue (seconds remaining)
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={cueSettings.warningSeconds}
                  onChange={(event) => onCueSettingChange('warningSeconds', event.target.value)}
                />
              </label>
              <label>
                Overtime cue (seconds over)
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={cueSettings.overtimeCueSeconds}
                  onChange={(event) => onCueSettingChange('overtimeCueSeconds', event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2>Sound Selection</h2>
            <div className="sound-setting">
              <label>
                Final warning sound
                <select
                  value={selectedSounds.warning}
                  onChange={(event) => onSoundSelectionChange('warning', event.target.value)}
                >
                  {SOUND_OPTIONS.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button--secondary" onClick={() => onPreviewSound(selectedSounds.warning)}>
                Preview
              </button>
            </div>

            <div className="sound-setting">
              <label>
                Time up sound
                <select
                  value={selectedSounds.expired}
                  onChange={(event) => onSoundSelectionChange('expired', event.target.value)}
                >
                  {SOUND_OPTIONS.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button--secondary" onClick={() => onPreviewSound(selectedSounds.expired)}>
                Preview
              </button>
            </div>

            <div className="sound-setting">
              <label>
                Overtime sound
                <select
                  value={selectedSounds.overtime}
                  onChange={(event) => onSoundSelectionChange('overtime', event.target.value)}
                >
                  {SOUND_OPTIONS.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button--secondary" onClick={() => onPreviewSound(selectedSounds.overtime)}>
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
