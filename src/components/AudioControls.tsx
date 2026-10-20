import { useState, type ChangeEvent, type FC } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AmbientAudioEngine } from '../audio/ambient';

interface AudioControlsProps {
  audioEngine: AmbientAudioEngine;
}

export const AudioControls: FC<AudioControlsProps> = ({ audioEngine }) => {
  const [isPlaying, setIsPlaying] = useState(audioEngine.getIsPlaying());
  const [volume, setVolume] = useState(audioEngine.getVolume());
  const [showSlider, setShowSlider] = useState(false);

  const toggleSound = () => {
    const newState = audioEngine.toggle();
    setIsPlaying(newState);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
    if (!isPlaying && val > 0) {
      audioEngine.start();
      setIsPlaying(true);
    }
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
      style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}
    >
      <button
        onClick={toggleSound}
        className={`desk-btn desk-btn-icon ${isPlaying ? 'text-brass' : 'text-ink-faded'}`}
        title={isPlaying ? 'Mute ambient soundscape' : 'Enable ambient singing bowl soundscape'}
        aria-label="Toggle ambient sound"
        style={{
          border: '1px solid var(--vellum-border)',
          background: isPlaying ? 'var(--vellum-card-solid)' : 'var(--vellum-card)',
          color: isPlaying ? 'var(--brass-hover)' : 'var(--ink-faded)',
        }}
      >
        {isPlaying && volume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </button>

      {showSlider && (
        <div
          className="manuscript-card animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '115%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.6rem 0.8rem',
            width: '120px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-faded)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <span>Tone</span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Sound volume"
          />
        </div>
      )}
    </div>
  );
};
