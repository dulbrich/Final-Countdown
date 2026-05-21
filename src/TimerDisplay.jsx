const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  EXPIRED: 'expired',
};

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatOvertime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getStatus(timerState, remainingSeconds, overtimeSeconds) {
  if (timerState === TIMER_STATES.EXPIRED) {
    if (overtimeSeconds >= 60) {
      return 'Please conclude your remarks';
    }
    return 'Please wrap up';
  }

  if (timerState === TIMER_STATES.RUNNING && remainingSeconds <= 10) {
    return 'Final Seconds';
  }

  if (timerState === TIMER_STATES.PAUSED) {
    return 'Paused';
  }

  return 'Speaker Time Remaining';
}

export default function TimerDisplay({ remainingSeconds, overtimeSeconds, timerState }) {
  const expired = timerState === TIMER_STATES.EXPIRED;
  const status = getStatus(timerState, remainingSeconds, overtimeSeconds);
  const primaryTime = expired ? formatOvertime(overtimeSeconds) : formatClock(remainingSeconds);

  return (
    <section className={`display ${expired ? 'display--expired' : ''}`}>
      <p className="display__eyebrow">{status}</p>
      <div className="display__time" aria-live="polite">{primaryTime}</div>
      <div className="display__subline">
        {expired ? 'Over Time' : 'City Council Speaker Timer'}
      </div>
    </section>
  );
}
