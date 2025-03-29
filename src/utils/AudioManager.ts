class AudioManager {
  private static instance: AudioManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};

  private constructor() {
    // Initialize sound effects
    this.sounds = {
      shoot: new Audio('/sounds/shoot.mp3'),
      explosion: new Audio('/sounds/explosion.mp3'),
      hit: new Audio('/sounds/hit.mp3'),
    };

    // Preload all sounds
    Object.values(this.sounds).forEach(audio => {
      audio.load();
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public play(soundName: 'shoot' | 'explosion' | 'hit'): void {
    const sound = this.sounds[soundName];
    if (sound) {
      // Create a new audio instance for overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.5; // Adjust volume to 50%
      clone.play().catch(error => console.warn('Audio playback failed:', error));
    }
  }
}

export const audioManager = AudioManager.getInstance();