export const SOUND_OPTIONS = [
  { id: 'bell-door', name: 'Door Bell' },
  { id: 'bell-soft', name: 'Soft Bell' },
  { id: 'bell-bright', name: 'Bright Bell' },
  { id: 'bell-double', name: 'Double Bell' },
  { id: 'gong-small', name: 'Small Gong' },
  { id: 'gong-deep', name: 'Deep Gong' },
  { id: 'chime-glass', name: 'Glass Chime' },
  { id: 'chime-civic', name: 'Civic Chime' },
  { id: 'ding-classic', name: 'Classic Ding' },
  { id: 'ding-clear', name: 'Clear Ding' },
  { id: 'ding-warm', name: 'Warm Ding' },
  { id: 'alert-gentle', name: 'Gentle Alert' },
  { id: 'alert-brisk', name: 'Brisk Alert' },
  { id: 'alert-formal', name: 'Formal Alert' },
  { id: 'tone-sine', name: 'Pure Tone' },
  { id: 'tone-triangle', name: 'Triangle Tone' },
  { id: 'tone-square-soft', name: 'Soft Square' },
  { id: 'tone-descend', name: 'Descending Tone' },
  { id: 'tone-ascend', name: 'Ascending Tone' },
  { id: 'tone-triple', name: 'Triple Chime' },
];

function playTone(context, { frequency, duration, volume, type = 'sine', delay = 0 }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + delay;
  const attackEnd = startAt + 0.02;
  const endAt = startAt + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.001), attackEnd);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.001, 0.0001), endAt);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(endAt);
}

function patternForSound(id) {
  switch (id) {
    case 'bell-soft':
      return [
        { frequency: 880, duration: 0.75, volume: 0.05, type: 'triangle' },
        { frequency: 1174, duration: 0.85, volume: 0.035, type: 'sine', delay: 0.05 },
      ];
    case 'bell-bright':
      return [
        { frequency: 1046, duration: 0.95, volume: 0.09, type: 'triangle' },
        { frequency: 1567, duration: 1.05, volume: 0.055, type: 'sine', delay: 0.04 },
      ];
    case 'bell-double':
      return [
        { frequency: 1046, duration: 0.55, volume: 0.085, type: 'triangle' },
        { frequency: 1318, duration: 0.65, volume: 0.055, type: 'sine', delay: 0.06 },
        { frequency: 1046, duration: 0.55, volume: 0.08, type: 'triangle', delay: 0.72 },
        { frequency: 1318, duration: 0.65, volume: 0.05, type: 'sine', delay: 0.78 },
      ];
    case 'gong-small':
      return [
        { frequency: 392, duration: 1.25, volume: 0.12, type: 'sine' },
        { frequency: 588, duration: 1.4, volume: 0.05, type: 'triangle', delay: 0.05 },
      ];
    case 'gong-deep':
      return [
        { frequency: 261, duration: 1.4, volume: 0.14, type: 'sine' },
        { frequency: 392, duration: 1.55, volume: 0.065, type: 'triangle', delay: 0.08 },
      ];
    case 'chime-glass':
      return [
        { frequency: 1318, duration: 0.85, volume: 0.06, type: 'triangle' },
        { frequency: 1760, duration: 1.0, volume: 0.04, type: 'sine', delay: 0.03 },
      ];
    case 'chime-civic':
      return [
        { frequency: 784, duration: 0.5, volume: 0.065, type: 'triangle' },
        { frequency: 988, duration: 0.55, volume: 0.05, type: 'sine', delay: 0.2 },
        { frequency: 1174, duration: 0.8, volume: 0.06, type: 'triangle', delay: 0.45 },
      ];
    case 'ding-classic':
      return [
        { frequency: 1046, duration: 0.4, volume: 0.085, type: 'triangle' },
      ];
    case 'ding-clear':
      return [
        { frequency: 1174, duration: 0.5, volume: 0.08, type: 'sine' },
      ];
    case 'ding-warm':
      return [
        { frequency: 880, duration: 0.6, volume: 0.075, type: 'triangle' },
      ];
    case 'alert-gentle':
      return [
        { frequency: 740, duration: 0.26, volume: 0.05, type: 'sine' },
        { frequency: 880, duration: 0.26, volume: 0.045, type: 'sine', delay: 0.2 },
      ];
    case 'alert-brisk':
      return [
        { frequency: 988, duration: 0.2, volume: 0.07, type: 'square' },
        { frequency: 1318, duration: 0.2, volume: 0.06, type: 'square', delay: 0.18 },
      ];
    case 'alert-formal':
      return [
        { frequency: 784, duration: 0.24, volume: 0.06, type: 'triangle' },
        { frequency: 1046, duration: 0.24, volume: 0.055, type: 'triangle', delay: 0.22 },
        { frequency: 1318, duration: 0.32, volume: 0.06, type: 'triangle', delay: 0.46 },
      ];
    case 'tone-sine':
      return [{ frequency: 880, duration: 0.7, volume: 0.07, type: 'sine' }];
    case 'tone-triangle':
      return [{ frequency: 880, duration: 0.8, volume: 0.07, type: 'triangle' }];
    case 'tone-square-soft':
      return [{ frequency: 784, duration: 0.5, volume: 0.045, type: 'square' }];
    case 'tone-descend':
      return [
        { frequency: 1174, duration: 0.3, volume: 0.06, type: 'triangle' },
        { frequency: 988, duration: 0.3, volume: 0.06, type: 'triangle', delay: 0.2 },
        { frequency: 784, duration: 0.45, volume: 0.07, type: 'triangle', delay: 0.42 },
      ];
    case 'tone-ascend':
      return [
        { frequency: 784, duration: 0.3, volume: 0.06, type: 'triangle' },
        { frequency: 988, duration: 0.3, volume: 0.06, type: 'triangle', delay: 0.2 },
        { frequency: 1174, duration: 0.45, volume: 0.07, type: 'triangle', delay: 0.42 },
      ];
    case 'tone-triple':
      return [
        { frequency: 988, duration: 0.22, volume: 0.06, type: 'triangle' },
        { frequency: 988, duration: 0.22, volume: 0.06, type: 'triangle', delay: 0.26 },
        { frequency: 988, duration: 0.45, volume: 0.07, type: 'triangle', delay: 0.52 },
      ];
    case 'bell-door':
    default:
      return [
        { frequency: 1046, duration: 0.95, volume: 0.1, type: 'triangle' },
        { frequency: 1318, duration: 1.05, volume: 0.08, type: 'sine', delay: 0.09 },
      ];
  }
}

export async function playNamedSound(id) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();

  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      context.close().catch(() => {});
      return null;
    }
  }

  const tones = patternForSound(id);
  tones.forEach((tone) => playTone(context, tone));

  const longest = tones.reduce((max, tone) => Math.max(max, tone.delay + tone.duration), 0);
  window.setTimeout(() => {
    context.close().catch(() => {});
  }, Math.ceil(longest * 1000) + 150);

  return context;
}
