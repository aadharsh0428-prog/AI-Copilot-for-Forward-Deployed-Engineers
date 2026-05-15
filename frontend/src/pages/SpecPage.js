import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ArrowLeft } from 'lucide-react';

export default function SpecPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Header status="ready" />
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto 20px',
            padding: '8px 14px', background: 'none',
            border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={12} /> BACK TO WORKSHOP
        </button>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          Saved specs coming soon. Export JSON from the Workshop view.
        </p>
      </div>
    </div>
  );
}
