import React from 'react';
import { Zap } from 'lucide-react';

export default function Header({ status }) {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <Zap size={16} color="#00e5ff" />
        </div>
        <span style={styles.logoText}>DATALEAP</span>
        <span style={styles.logoSub}>FIELD AGENT</span>
      </div>

      <div style={styles.statusBar}>
        {status && (
          <div style={styles.statusItem}>
            <div style={{
              ...styles.dot,
              background: status === 'ready' ? '#00ff88'
                : status === 'recording' ? '#ff3b5c'
                : status === 'processing' ? '#00e5ff'
                : '#7b5ea7',
              boxShadow: `0 0 8px ${status === 'ready' ? '#00ff88' : '#00e5ff'}`,
              animation: status === 'recording' ? 'pulse-dot 1s infinite' : 'none',
            }} />
            <span style={styles.statusText}>{status.toUpperCase()}</span>
          </div>
        )}
        <div style={styles.badge}>v1.0</div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(8,8,14,0.9)',
    backdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 28,
    height: 28,
    background: 'rgba(0,229,255,0.1)',
    border: '1px solid rgba(0,229,255,0.3)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: '0.15em',
    color: '#f0f0ff',
  },
  logoSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#00e5ff',
    letterSpacing: '0.2em',
    border: '1px solid rgba(0,229,255,0.25)',
    padding: '2px 6px',
    borderRadius: 3,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
  },
  statusText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
  },
  badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
};
