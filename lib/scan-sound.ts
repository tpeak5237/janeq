let audioContext: AudioContext | null = null;

interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const AudioContextConstructor =
    window.AudioContext ??
    (window as WindowWithWebkitAudioContext).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  audioContext = new AudioContextConstructor();
  return audioContext;
}

/** Prime audio during the user's camera/upload gesture for autoplay-safe playback. */
export function primeScanSuccessSound(): void {
  const context = getAudioContext();
  if (context?.state === "suspended") void context.resume().catch(() => undefined);
}

/** Play a short, quiet two-note confirmation without loading or sending audio data. */
export function playScanSuccessSound(): void {
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    gain.connect(context.destination);

    const firstNote = context.createOscillator();
    firstNote.type = "sine";
    firstNote.frequency.setValueAtTime(1046.5, now);
    firstNote.connect(gain);
    firstNote.start(now);
    firstNote.stop(now + 0.16);

    const secondNote = context.createOscillator();
    secondNote.type = "sine";
    secondNote.frequency.setValueAtTime(1568, now + 0.08);
    secondNote.connect(gain);
    secondNote.start(now + 0.08);
    secondNote.stop(now + 0.32);
  };

  if (context.state === "suspended") {
    void context.resume().then(play).catch(() => undefined);
  } else {
    play();
  }
}
