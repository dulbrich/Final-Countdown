const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  EXPIRED: 'expired',
};

function formatPreset(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

export default function TimerControls({
  minutesInput,
  secondsInput,
  onMinutesChange,
  onSecondsChange,
  onApplyCustomTime,
  presets,
  onApplyPreset,
  onStart,
  onPause,
  onResume,
  onReset,
  onStop,
  onAddFiveSeconds,
  timerState,
  soundEnabled,
  onToggleSound,
}) {
  return (
    <aside className="controls">
      <div className="panel">
        <h1>Final Countdown</h1>
        <p className="panel__intro">
          Set the speaker time, run the countdown, and keep the public display clean and readable.
        </p>

        <div className="time-entry">
          <label>
            Minutes
            <input
              type="number"
              min="0"
              value={minutesInput}
              onChange={(event) => onMinutesChange(event.target.value)}
            />
          </label>
          <label>
            Seconds
            <input
              type="number"
              min="0"
              max="59"
              value={secondsInput}
              onChange={(event) => onSecondsChange(event.target.value)}
            />
          </label>
          <button className="button button--secondary" onClick={onApplyCustomTime}>
            Apply Time
          </button>
        </div>

        <div className="preset-grid">
          {presets.map((preset) => (
            <button
              key={preset}
              className="button button--ghost"
              onClick={() => onApplyPreset(preset)}
            >
              {formatPreset(preset)}
            </button>
          ))}
        </div>

        <div className="action-grid">
          <button className="button" onClick={onStart} disabled={timerState === TIMER_STATES.RUNNING}>
            Start
          </button>
          <button
            className="button button--secondary"
            onClick={onPause}
            disabled={timerState !== TIMER_STATES.RUNNING}
          >
            Pause
          </button>
          <button
            className="button button--secondary"
            onClick={onResume}
            disabled={timerState !== TIMER_STATES.PAUSED}
          >
            Resume
          </button>
          <button className="button button--secondary" onClick={onReset}>
            Reset
          </button>
          <button className="button button--secondary" onClick={onAddFiveSeconds}>
            +5 sec
          </button>
          <button className="button button--danger" onClick={onStop}>
            Stop
          </button>
        </div>

        <label className="toggle-row">
          <input type="checkbox" checked={soundEnabled} onChange={onToggleSound} />
          <span>Enable subtle chimes</span>
        </label>

        <div className="shortcuts">
          <span>Space: start / pause / resume</span>
          <span>R: reset</span>
          <span>S: stop</span>
        </div>
      </div>
    </aside>
  );
}
