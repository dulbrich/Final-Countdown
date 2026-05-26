import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';

const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  EXPIRED: 'expired',
};

const PRESETS = [60, 120, 180, 300, 600];
const TEN_SECONDS = 10;
const THIRTY_SECONDS = 30;
const SIXTY_SECONDS = 60;

function buildChime(frequency = 880, duration = 0.18, volume = 0.03) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);

  oscillator.onended = () => {
    context.close().catch(() => {});
  };

  return context;
}

export default function App() {
  const [allottedTimeSeconds, setAllottedTimeSeconds] = useState(180);
  const [remainingSeconds, setRemainingSeconds] = useState(180);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [timerState, setTimerState] = useState(TIMER_STATES.IDLE);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [minutesInput, setMinutesInput] = useState('3');
  const [secondsInput, setSecondsInput] = useState('00');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const appRef = useRef(null);
  const deadlineRef = useRef(null);
  const intervalRef = useRef(null);
  const warnedTenRef = useRef(false);
  const expiredRef = useRef(false);
  const overtimeThirtyRef = useRef(false);

  const syncInputs = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    setMinutesInput(String(minutes));
    setSecondsInput(String(seconds).padStart(2, '0'));
  }, []);

  const playChime = useCallback(
    (type) => {
      if (!soundEnabled) return;

      if (type === 'ten') buildChime(880, 0.14, 0.03);
      if (type === 'expired') {
        buildChime(740, 0.24, 0.13);
        setTimeout(() => buildChime(620, 0.24, 0.15), 170);
      }
      if (type === 'overtime30') {
        buildChime(660, 0.14, 0.035);
        setTimeout(() => buildChime(880, 0.14, 0.03), 180);
      }
    },
    [soundEnabled]
  );

  const clearTicker = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetMilestones = useCallback(() => {
    warnedTenRef.current = false;
    expiredRef.current = false;
    overtimeThirtyRef.current = false;
  }, []);

  const stopTimer = useCallback(() => {
    clearTicker();
    deadlineRef.current = null;
    resetMilestones();
    setTimerState(TIMER_STATES.IDLE);
    setRemainingSeconds(allottedTimeSeconds);
    setOvertimeSeconds(0);
  }, [allottedTimeSeconds, clearTicker, resetMilestones]);

  const tick = useCallback(() => {
    if (!deadlineRef.current) return;

    const now = Date.now();
    const diffMs = deadlineRef.current - now;
    const secondsUntilDeadline = Math.ceil(diffMs / 1000);

    if (secondsUntilDeadline > 0) {
      const safeRemaining = Math.max(0, secondsUntilDeadline);
      setRemainingSeconds(safeRemaining);
      setOvertimeSeconds(0);

      if (safeRemaining <= TEN_SECONDS && !warnedTenRef.current) {
        warnedTenRef.current = true;
        playChime('ten');
      }
      return;
    }

    const overtime = Math.abs(Math.floor(diffMs / 1000));
    setRemainingSeconds(0);
    setOvertimeSeconds(overtime);
    setTimerState(TIMER_STATES.EXPIRED);

    if (!expiredRef.current) {
      expiredRef.current = true;
      playChime('expired');
    }

    if (overtime >= THIRTY_SECONDS && !overtimeThirtyRef.current) {
      overtimeThirtyRef.current = true;
      playChime('overtime30');
    }
  }, [playChime]);

  const startInterval = useCallback(() => {
    clearTicker();
    tick();
    intervalRef.current = window.setInterval(tick, 200);
  }, [clearTicker, tick]);

  const applyPreset = useCallback(
    (seconds) => {
      clearTicker();
      deadlineRef.current = null;
      resetMilestones();
      setAllottedTimeSeconds(seconds);
      setRemainingSeconds(seconds);
      setOvertimeSeconds(0);
      setTimerState(TIMER_STATES.IDLE);
      syncInputs(seconds);
    },
    [clearTicker, resetMilestones, syncInputs]
  );

  const applyCustomTime = useCallback(() => {
    const minutes = Number.parseInt(minutesInput, 10) || 0;
    const seconds = Number.parseInt(secondsInput, 10) || 0;
    const normalizedSeconds = Math.min(59, Math.max(0, seconds));
    const total = Math.max(1, minutes * 60 + normalizedSeconds);
    applyPreset(total);
  }, [applyPreset, minutesInput, secondsInput]);

  const requestFullscreen = useCallback(async () => {
    const element = appRef.current;
    if (!element || document.fullscreenElement === element) return;

    try {
      await element.requestFullscreen();
    } catch {
      // Ignore fullscreen failures and keep the timer usable.
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      setIsFullscreen(false);
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // Ignore exit failures and just update local UI state on next event.
    }
  }, []);

  const startTimer = useCallback(() => {
    resetMilestones();
    setRemainingSeconds(allottedTimeSeconds);
    setOvertimeSeconds(0);
    deadlineRef.current = Date.now() + allottedTimeSeconds * 1000;
    setTimerState(TIMER_STATES.RUNNING);
    startInterval();
    requestFullscreen();
  }, [allottedTimeSeconds, requestFullscreen, resetMilestones, startInterval]);

  const pauseTimer = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING) return;

    clearTicker();
    const carrySeconds = remainingSeconds > 0 ? remainingSeconds : 0;
    deadlineRef.current = null;
    setRemainingSeconds(carrySeconds);
    setTimerState(TIMER_STATES.PAUSED);
  }, [clearTicker, remainingSeconds, timerState]);

  const addFiveSeconds = useCallback(() => {
    const increment = 5;

    setAllottedTimeSeconds((current) => current + increment);
    syncInputs(allottedTimeSeconds + increment);

    if (timerState === TIMER_STATES.RUNNING && deadlineRef.current) {
      deadlineRef.current += increment * 1000;
      tick();
      return;
    }

    if (timerState === TIMER_STATES.PAUSED || timerState === TIMER_STATES.IDLE) {
      setRemainingSeconds((current) => current + increment);
      return;
    }

    if (timerState === TIMER_STATES.EXPIRED) {
      if (overtimeSeconds >= increment) {
        setOvertimeSeconds((current) => current - increment);
        return;
      }

      const rollover = increment - overtimeSeconds;
      setOvertimeSeconds(0);
      setRemainingSeconds(rollover);
      setTimerState(TIMER_STATES.PAUSED);
      expiredRef.current = false;
      overtimeThirtyRef.current = false;
      warnedTenRef.current = rollover <= TEN_SECONDS;
    }
  }, [allottedTimeSeconds, overtimeSeconds, syncInputs, tick, timerState]);

  const resumeTimer = useCallback(() => {
    if (timerState !== TIMER_STATES.PAUSED) return;

    deadlineRef.current = Date.now() + remainingSeconds * 1000;
    setTimerState(TIMER_STATES.RUNNING);
    startInterval();
  }, [remainingSeconds, startInterval, timerState]);

  const resetTimer = useCallback(() => {
    clearTicker();
    deadlineRef.current = null;
    resetMilestones();
    setRemainingSeconds(allottedTimeSeconds);
    setOvertimeSeconds(0);
    setTimerState(TIMER_STATES.IDLE);
  }, [allottedTimeSeconds, clearTicker, resetMilestones]);

  useEffect(() => {
    syncInputs(allottedTimeSeconds);
  }, [allottedTimeSeconds, syncInputs]);

  useEffect(() => () => clearTicker(), [clearTicker]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      const isTyping = tagName === 'input';

      if (event.code === 'Space' && !isTyping) {
        event.preventDefault();
        if (timerState === TIMER_STATES.IDLE) startTimer();
        else if (timerState === TIMER_STATES.RUNNING) pauseTimer();
        else if (timerState === TIMER_STATES.PAUSED) resumeTimer();
      }

      if (!isTyping && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetTimer();
      }

      if (!isTyping && event.key.toLowerCase() === 's') {
        event.preventDefault();
        stopTimer();
      }

      if (!isTyping && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        requestFullscreen();
      }

      if (!isTyping && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        addFiveSeconds();
      }

      if (event.key === 'Escape' && document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addFiveSeconds, pauseTimer, requestFullscreen, resetTimer, resumeTimer, startTimer, stopTimer, timerState]);

  const displayMode = useMemo(() => {
    if (timerState === TIMER_STATES.EXPIRED) {
      if (overtimeSeconds >= SIXTY_SECONDS) return 'overtime-severe';
      if (overtimeSeconds >= THIRTY_SECONDS) return 'overtime-pulse';
      return 'overtime';
    }

    if (remainingSeconds <= TEN_SECONDS && timerState === TIMER_STATES.RUNNING) {
      return 'warning';
    }

    return 'normal';
  }, [overtimeSeconds, remainingSeconds, timerState]);

  return (
    <div ref={appRef} className={`app app--${displayMode} ${isFullscreen ? 'app--fullscreen' : ''}`}>
      {isFullscreen && (
        <button className="fullscreen-exit" onClick={exitFullscreen} aria-label="Exit fullscreen timer view">
          ×
        </button>
      )}

      <div className="layout">
        {!isFullscreen && (
          <TimerControls
            minutesInput={minutesInput}
            secondsInput={secondsInput}
            onMinutesChange={setMinutesInput}
            onSecondsChange={setSecondsInput}
            onApplyCustomTime={applyCustomTime}
            presets={PRESETS}
            onApplyPreset={applyPreset}
            onStart={startTimer}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onReset={resetTimer}
            onStop={stopTimer}
            onAddFiveSeconds={addFiveSeconds}
            onEnterFullscreen={requestFullscreen}
            timerState={timerState}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((value) => !value)}
          />
        )}

        <TimerDisplay
          remainingSeconds={remainingSeconds}
          overtimeSeconds={overtimeSeconds}
          timerState={timerState}
          isFullscreen={isFullscreen}
        />
      </div>
    </div>
  );
}
