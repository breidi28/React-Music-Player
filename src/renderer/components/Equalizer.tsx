import React, { useState, useEffect } from 'react';
import './Equalizer.css';

interface EqualizerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  destinationNode: AudioNode | null;
  isOpen: boolean;
  onClose: () => void;
}

const BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const PRESETS: { [key: string]: number[] } = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Audiophile': [2, 1, 0, 1, 2, 1, 0, 1, 2, 3],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'Treble Boost': [0, 0, 0, 0, 0, 0, 2, 4, 5, 6],
  'Classical': [3, 2, 0, 0, 0, 0, 0, 2, 3, 4],
  'Rock': [4, 3, 1, 0, -1, 0, 1, 3, 4, 4],
  'Jazz': [3, 2, 1, 0, 0, 0, 1, 2, 3, 4],
  'Electronic': [4, 3, 2, 0, -1, 1, 2, 3, 4, 5],
};

const Equalizer: React.FC<EqualizerProps> = ({
  audioContext,
  sourceNode,
  destinationNode,
  isOpen,
  onClose
}) => {
  const [gains, setGains] = useState<number[]>(Array(10).fill(0));
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('Flat');
  const [isEnabled, setIsEnabled] = useState(true);

  // Initialize EQ filters
  useEffect(() => {
    if (!audioContext || !sourceNode || !destinationNode) return;

    // Create filter chain
    const newFilters = BANDS.map((freq, index) => {
      const filter = audioContext.createBiquadFilter();
      
      if (index === 0) {
        filter.type = 'lowshelf';
      } else if (index === BANDS.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.0;
      }
      
      filter.frequency.value = freq;
      filter.gain.value = 0;
      
      return filter;
    });

    setFilters(newFilters);

    // Connect filter chain initially
    try {
      sourceNode.disconnect();
    } catch (e) {
      // Ignore if already disconnected
    }

    if (isEnabled) {
      newFilters.reduce((prev, curr) => {
        prev.connect(curr);
        return curr;
      }, sourceNode as AudioNode).connect(destinationNode);
    } else {
      sourceNode.connect(destinationNode);
    }

    return () => {
      // Cleanup on unmount
      newFilters.forEach(f => {
        try {
          f.disconnect();
        } catch (e) {
          // Ignore
        }
      });
      try {
        sourceNode.disconnect();
        sourceNode.connect(destinationNode);
      } catch (e) {
        // Ignore
      }
    };
  }, [audioContext, sourceNode, destinationNode]);

  // Update filter bypass when enabled state changes
  useEffect(() => {
    if (!sourceNode || !destinationNode || filters.length === 0) return;

    try {
      sourceNode.disconnect();
    } catch (e) {
      // Ignore if already disconnected
    }
    
    if (isEnabled) {
      filters.reduce((prev, curr) => {
        prev.connect(curr);
        return curr;
      }, sourceNode as AudioNode).connect(destinationNode);
    } else {
      sourceNode.connect(destinationNode);
    }
  }, [isEnabled]);

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    setSelectedPreset('Custom');

    if (filters[index]) {
      filters[index].gain.value = value;
    }
  };

  const applyPreset = (presetName: string) => {
    const presetGains = PRESETS[presetName] || PRESETS['Flat'];
    setGains(presetGains);
    setSelectedPreset(presetName);

    presetGains.forEach((gain, index) => {
      if (filters[index]) {
        filters[index].gain.value = gain;
      }
    });
  };

  const resetEQ = () => {
    applyPreset('Flat');
  };

  const formatFreq = (freq: number) => {
    if (freq >= 1000) {
      return `${freq / 1000}k`;
    }
    return freq.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="equalizer-overlay" onClick={onClose}>
      <div className="equalizer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="equalizer-header">
          <h2>Equalizer</h2>
          <div className="equalizer-controls">
            <label className="equalizer-toggle">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
              <span>Enabled</span>
            </label>
            <button className="eq-reset-button" onClick={resetEQ} title="Reset to Flat">
              Reset
            </button>
          </div>
          <button className="equalizer-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="equalizer-presets">
          {Object.keys(PRESETS).map(preset => (
            <button
              key={preset}
              className={`preset-button ${selectedPreset === preset ? 'active' : ''}`}
              onClick={() => applyPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="equalizer-bands">
          {BANDS.map((freq, index) => (
            <div key={freq} className="eq-band">
              <div className="eq-slider-container">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={gains[index]}
                  onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                  className="eq-slider"
                  orient="vertical"
                  disabled={!isEnabled}
                />
                <div className="eq-value">{gains[index] > 0 ? '+' : ''}{gains[index].toFixed(1)} dB</div>
              </div>
              <div className="eq-label">{formatFreq(freq)}</div>
            </div>
          ))}
        </div>

        <div className="equalizer-info">
          <p className="eq-info-text">
            Adjust frequency bands to customize your sound. Presets provide optimized settings for different music genres.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Equalizer;
