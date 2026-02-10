import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import './SignalPath.css';

interface SignalPathProps {
  track: Track | null;
  audioContext: AudioContext | null;
  isPlaying: boolean;
  onClose: () => void;
}

interface AudioOutputInfo {
  deviceName: string;
  sampleRate: number;
  channelCount: number;
}

const SignalPath: React.FC<SignalPathProps> = ({ track, audioContext, onClose }) => {
  const [outputInfo, setOutputInfo] = useState<AudioOutputInfo | null>(null);

  useEffect(() => {
    const getOutputInfo = async () => {
      if (audioContext) {
        // Get audio output device info
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutput = devices.find(d => d.kind === 'audiooutput' && d.deviceId === 'default');
          
          setOutputInfo({
            deviceName: audioOutput?.label || 'System Default Output',
            sampleRate: audioContext.sampleRate,
            channelCount: audioContext.destination.channelCount,
          });
        } catch {
          setOutputInfo({
            deviceName: 'System Audio Output',
            sampleRate: audioContext.sampleRate,
            channelCount: audioContext.destination.channelCount,
          });
        }
      }
    };

    getOutputInfo();
  }, [audioContext]);

  const getQualityLevel = (): 'lossless' | 'high-quality' | 'enhanced' | 'standard' => {
    if (!track) return 'standard';
    
    if (track.lossless) {
      if (track.sampleRate && track.sampleRate >= 96000) {
        return 'lossless'; // Purple - Hi-Res
      }
      return 'high-quality'; // Blue - Lossless
    }
    
    if (track.bitrate && track.bitrate >= 256000) {
      return 'enhanced'; // Green - High quality lossy
    }
    
    return 'standard'; // White - Standard
  };

  const getQualityColor = (level: string): string => {
    switch (level) {
      case 'lossless': return '#a855f7'; // Purple for Hi-Res
      case 'high-quality': return '#3b82f6'; // Blue for Lossless
      case 'enhanced': return '#22c55e'; // Green for High Quality
      default: return '#94a3b8'; // Gray for Standard
    }
  };

  const getQualityLabel = (): string => {
    const level = getQualityLevel();
    switch (level) {
      case 'lossless': return 'Lossless (Hi-Res)';
      case 'high-quality': return 'Lossless';
      case 'enhanced': return 'High Quality';
      default: return 'Standard';
    }
  };

  const formatSampleRate = (rate: number): string => {
    if (rate >= 1000) {
      return `${(rate / 1000).toFixed(1)} kHz`;
    }
    return `${rate} Hz`;
  };

  const isSignalPathLossless = (): boolean => {
    if (!track || !audioContext) return false;
    
    // Check if the entire path maintains lossless quality
    // Web Audio API typically runs at device sample rate
    const sourceSampleRate = track.sampleRate || 44100;
    const outputSampleRate = audioContext.sampleRate;
    
    // If source is lossless and no sample rate conversion needed (or upsampling)
    return track.lossless === true && sourceSampleRate <= outputSampleRate;
  };

  const qualityLevel = getQualityLevel();
  const qualityColor = getQualityColor(qualityLevel);
  const pathIsLossless = isSignalPathLossless();

  if (!track) {
    return (
      <div className="signal-path-overlay" onClick={onClose}>
        <div className="signal-path-modal" onClick={e => e.stopPropagation()}>
          <div className="signal-path-header">
            <h2>Signal Path</h2>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="signal-path-empty">
            <p>No track loaded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signal-path-overlay" onClick={onClose}>
      <div className="signal-path-modal" onClick={e => e.stopPropagation()}>
        <div className="signal-path-header">
          <h2>Signal Path</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="signal-path-quality">
          <div className="quality-indicator" style={{ backgroundColor: qualityColor }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" 
                    fill="currentColor" />
            </svg>
          </div>
          <div className="quality-text">
            <span className="quality-label">{getQualityLabel()}</span>
            <span className="quality-description">
              {pathIsLossless 
                ? 'Bit-perfect playback' 
                : 'Audio processing applied'}
            </span>
          </div>
        </div>

        <div className="signal-path-chain">
          {/* Source */}
          <div className="signal-node source">
            <div className="node-icon" style={{ borderColor: qualityColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                      stroke={qualityColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" 
                      stroke={qualityColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="node-info">
              <div className="node-title">Source</div>
              <div className="node-subtitle">{track.title}</div>
              <div className="node-specs">
                <span className="spec">{track.format}</span>
                {track.sampleRate && <span className="spec">{formatSampleRate(track.sampleRate)}</span>}
                {track.bitsPerSample && <span className="spec">{track.bitsPerSample}-bit</span>}
                {track.numberOfChannels && (
                  <span className="spec">{track.numberOfChannels === 2 ? 'Stereo' : track.numberOfChannels === 1 ? 'Mono' : `${track.numberOfChannels}ch`}</span>
                )}
              </div>
              {track.bitrate && (
                <div className="node-detail">
                  {Math.round(track.bitrate / 1000)} kbps
                </div>
              )}
            </div>
          </div>

          {/* Connection Line */}
          <div className="signal-connector">
            <div className="connector-line" style={{ backgroundColor: qualityColor }}></div>
            <div className="connector-dot" style={{ backgroundColor: qualityColor }}></div>
          </div>

          {/* Decoder */}
          <div className="signal-node decoder">
            <div className="node-icon" style={{ borderColor: qualityColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" 
                      stroke={qualityColor} strokeWidth="2"/>
                <path d="M9 9l6 3-6 3V9z" fill={qualityColor}/>
              </svg>
            </div>
            <div className="node-info">
              <div className="node-title">{track.format} Decoder</div>
              <div className="node-subtitle">
                {track.lossless ? 'Lossless decoding' : 'Lossy decoding'}
              </div>
              <div className="node-specs">
                <span className="spec">PCM Output</span>
                {track.sampleRate && <span className="spec">{formatSampleRate(track.sampleRate)}</span>}
                <span className="spec">32-bit float</span>
              </div>
            </div>
          </div>

          {/* Connection Line */}
          <div className="signal-connector">
            <div className="connector-line" style={{ backgroundColor: qualityColor }}></div>
            <div className="connector-dot" style={{ backgroundColor: qualityColor }}></div>
          </div>

          {/* Web Audio API */}
          <div className="signal-node processor">
            <div className="node-icon" style={{ borderColor: qualityColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" 
                      stroke={qualityColor} strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" stroke={qualityColor} strokeWidth="2"/>
              </svg>
            </div>
            <div className="node-info">
              <div className="node-title">Audio Engine</div>
              <div className="node-subtitle">Web Audio API</div>
              <div className="node-specs">
                {audioContext && (
                  <>
                    <span className="spec">{formatSampleRate(audioContext.sampleRate)}</span>
                    <span className="spec">32-bit float</span>
                    {track.sampleRate && track.sampleRate !== audioContext.sampleRate && (
                      <span className="spec warning">Resampled</span>
                    )}
                  </>
                )}
              </div>
              <div className="node-detail">
                {track.sampleRate && audioContext && track.sampleRate !== audioContext.sampleRate
                  ? `${formatSampleRate(track.sampleRate)} → ${formatSampleRate(audioContext.sampleRate)}`
                  : 'Bit-perfect passthrough'
                }
              </div>
            </div>
          </div>

          {/* Connection Line */}
          <div className="signal-connector">
            <div className="connector-line" style={{ backgroundColor: qualityColor }}></div>
            <div className="connector-dot" style={{ backgroundColor: qualityColor }}></div>
          </div>

          {/* Output Device */}
          <div className="signal-node output">
            <div className="node-icon" style={{ borderColor: qualityColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 6v12M8 10v4M16 8v8M4 11v2M20 9v6" 
                      stroke={qualityColor} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="node-info">
              <div className="node-title">Output Device</div>
              <div className="node-subtitle">
                {outputInfo?.deviceName || 'Loading...'}
              </div>
              <div className="node-specs">
                {outputInfo && (
                  <>
                    <span className="spec">{formatSampleRate(outputInfo.sampleRate)}</span>
                    <span className="spec">{outputInfo.channelCount === 2 ? 'Stereo' : `${outputInfo.channelCount}ch`}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="signal-path-footer">
          <div className="footer-note">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3M8 10v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>
              {pathIsLossless 
                ? 'Signal path maintains lossless quality from source to output.'
                : track.lossless 
                  ? 'Sample rate conversion applied. Original quality: lossless.'
                  : 'Source is lossy encoded. Maximum quality limited by source.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalPath;
