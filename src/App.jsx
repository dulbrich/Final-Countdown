import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import SettingsPage from './SettingsPage';
import { playNamedSound, startBuzzer, startKeepAlive, stopBuzzer, stopKeepAlive } from './sounds';

const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  EXPIRED: 'expired',
};

const PRESETS = [60, 120, 180, 300, 600];
const THIRTY_SECONDS = 30;
const SIXTY_SECONDS = 60;

export default function App() {
  const [allottedTimeSeconds, setAllottedTimeSeconds] = useState(180);
  const [remainingSeconds, setRemainingSeconds] = useState(180);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [timerState, setTimerState] = useState(TIMER_STATES.IDLE);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(1);
  const [keepAliveEnabled, setKeepAliveEnabled] = useState(false);
  const [minutesInput, setMinutesInput] = useState('3');
  const [secondsInput, setSecondsInput] = useState('00');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cueSettings, setCueSettings] = useState({
    warningSeconds: 10,
    overtimeCueSeconds: 30,
  });
  const [selectedSounds, setSelectedSounds] = useState({
    warning: 'ding-clear',
    expired: 'bell-door',
    overtime: 'alert-formal',
  });

  const appRef = useRef(null);
  const deadlineRef = useRef(null);
  const intervalRef = useRef(null);
  const warningPlayedRef = useRef(false);
  const expiredRef = useRef(false);
  const overtimeCuePlayedRef = useRef(false);
  const buzzerActiveRef = useRef(false);

  const syncInputs = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    setMinutesInput(String(minutes));
    setSecondsInput(String(seconds).padStart(2, '0'));
  }, []);

  const playCue = useCallback(
    (cueType) => {
      if (!soundEnabled) return;
      const soundId = selectedSounds[cueType];
      if (soundId) playNamedSound(soundId, volume);
    },
    [selectedSounds, soundEnabled, volume]
  );

  const previewSound = useCallback((soundId) => playNamedSound(soundId, volume), [volume]);

  const toggleKeepAlive = useCallback(async () => {
    if (keepAliveEnabled) {
      stopKeepAlive();
      setKeepAliveEnabled(false);
      return;
    }
    const started = await startKeepAlive();
    setKeepAliveEnabled(started);
  }, [keepAliveEnabled]);

  useEffect(() => () => stopKeepAlive(), []);

  useEffect(() => () => stopBuzzer(), []);

  const clearTicker = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetMilestones = useCallback(() => {
    warningPlayedRef.current = false;
    expiredRef.current = false;
    overtimeCuePlayedRef.current = false;
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

      if (safeRemaining <= cueSettings.warningSeconds && !warningPlayedRef.current) {
        warningPlayedRef.current = true;
        playCue('warning');
      }
      return;
    }

    const overtime = Math.max(0, Math.floor(-diffMs / 1000));
    setRemainingSeconds(0);
    setOvertimeSeconds(overtime);
    setTimerState(TIMER_STATES.EXPIRED);

    if (!expiredRef.current) {
      expiredRef.current = true;
      playCue('expired');
    }

    if (overtime >= cueSettings.overtimeCueSeconds && !overtimeCuePlayedRef.current) {
      overtimeCuePlayedRef.current = true;
      playCue('overtime');
    }
  }, [cueSettings.overtimeCueSeconds, cueSettings.warningSeconds, playCue]);

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
    const nextAllotted = allottedTimeSeconds + increment;

    setAllottedTimeSeconds(nextAllotted);
    syncInputs(nextAllotted);

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
      overtimeCuePlayedRef.current = false;
      warningPlayedRef.current = rollover <= cueSettings.warningSeconds;
    }
  }, [allottedTimeSeconds, cueSettings.warningSeconds, overtimeSeconds, syncInputs, tick, timerState]);

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

  const updateCueSetting = useCallback((key, value) => {
    const parsed = Math.max(1, Number.parseInt(value, 10) || 1);
    setCueSettings((current) => ({ ...current, [key]: parsed }));
  }, []);

  const updateSoundSelection = useCallback((key, value) => {
    setSelectedSounds((current) => ({ ...current, [key]: value }));
  }, []);

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
      const isTyping = tagName === 'input' || tagName === 'select';

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

      if (!isTyping && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        setShowSettings((current) => !current);
      }

      if (!isTyping && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        playCue('expired');
      }

      if (!isTyping && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        if (event.repeat) return;
        if (!soundEnabled) return;
        if (buzzerActiveRef.current) return;
        buzzerActiveRef.current = true;
        startBuzzer(volume);
      }

      if (event.key === 'Escape' && document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key.toLowerCase() === 'b' && buzzerActiveRef.current) {
        buzzerActiveRef.current = false;
        stopBuzzer();
      }
    };

    const handleBlur = () => {
      if (buzzerActiveRef.current) {
        buzzerActiveRef.current = false;
        stopBuzzer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [addFiveSeconds, pauseTimer, playCue, requestFullscreen, resetTimer, resumeTimer, soundEnabled, startTimer, stopTimer, timerState, volume]);

  const displayMode = useMemo(() => {
    if (timerState === TIMER_STATES.EXPIRED) {
      if (overtimeSeconds >= SIXTY_SECONDS) return 'overtime-severe';
      if (overtimeSeconds >= THIRTY_SECONDS) return 'overtime-pulse';
      return 'overtime';
    }

    if (remainingSeconds <= cueSettings.warningSeconds && timerState === TIMER_STATES.RUNNING) {
      return 'warning';
    }

    return 'normal';
  }, [cueSettings.warningSeconds, overtimeSeconds, remainingSeconds, timerState]);

  if (showSettings && !isFullscreen) {
    return (
      <div ref={appRef} className="app app--settings">
        <SettingsPage
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((value) => !value)}
          volume={volume}
          onVolumeChange={setVolume}
          keepAliveEnabled={keepAliveEnabled}
          onToggleKeepAlive={toggleKeepAlive}
          cueSettings={cueSettings}
          onCueSettingChange={updateCueSetting}
          selectedSounds={selectedSounds}
          onSoundSelectionChange={updateSoundSelection}
          onPreviewSound={previewSound}
          onBack={() => setShowSettings(false)}
        />
      </div>
    );
  }

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
            onOpenSettings={() => setShowSettings(true)}
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
