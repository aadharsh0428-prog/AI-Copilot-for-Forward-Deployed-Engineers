import React from 'react';
import { Mic, MicOff, Square, Loader } from 'lucide-react';

export default function VoiceInput({ isRecording, isTranscribing, audioLevel, onStart, onStop, error }) {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const offset = Math.abs(i - 10) / 10;
    const height = isRecording
      ? Math.max(4, audioLevel * (1 - offset * 0.6) * 0.5 + Math.random() * 8)
      : 4;
    return height;
  });

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        {/* Record button */}
        <button
          onClick={isRecording ? onStop : onStart}
          disabled={isTranscribing}
          style={{
            ...styles.btn,
            background: isRecording
              ? 'rgba(255,59,92,0.15)'
              : 'rgba(0,229,255,0.08)',
            borderColor: isRecording
              ? 'rgba(255,59,92,0.4)'
              : 'rgba(0,229,255,0.25)',
            boxShadow: isRecording ? '0 0 20px rgba(255,59,92,0.2)' : 'none',
          }}
        >
          {isTranscribing ? (
            <Loader size={18} color="#00e5ff" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isRecording ? (
            <Square size={18} color="#ff3b5c" fill="#ff3b5c" />
          ) : (
            <Mic size={18} color="#00e5ff" />
          )}
          <span style={{
            ...styles.btnLabel,
            color: isRecording ? '#ff3b5c' : '#00e5ff',
          }}>
            {isTranscribing ? 'TRANSCRIBING...' : isRecording ? 'STOP' : 'RECORD'}
          </span>
        </button>

        {/* Waveform */}
        <div style={styles.waveform}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                ...styles.bar,
                height: `${Math.max(3, h)}px`,
                background: isRecording
                  ? `rgba(0,229,255,${0.3 + (h / 50) * 0.7})`
                  : 'rgba(255,255,255,0.08)',
                transition: isRecording ? 'height 0.08s ease' : 'height 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Status */}
        <div style={styles.statusLabel}>
          {isTranscribing ? (
            <span style={{ color: '#00e5ff', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              PROCESSING AUDIO...
            </span>
          ) : isRecording ? (
            <span style={{ color: '#ff3b5c', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              ● REC — {Math.round(audioLevel)}%
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              WHISPER READY
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.error}>{error}</div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 14px',
    border: '1px solid',
    borderRadius: 6,
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  btnLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    fontWeight: 700,
  },
  waveform: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    height: 32,
  },
  bar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 3,
    maxHeight: 28,
  },
  statusLabel: {
    flexShrink: 0,
    minWidth: 120,
    textAlign: 'right',
  },
  error: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: '#ff6b35',
    padding: '6px 10px',
    background: 'rgba(255,107,53,0.08)',
    border: '1px solid rgba(255,107,53,0.2)',
    borderRadius: 4,
  },
};
