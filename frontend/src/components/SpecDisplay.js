import React, { useState } from 'react';
import { FileText, CheckSquare, TrendingUp, AlertTriangle, Download } from 'lucide-react';

const PRIORITY_COLORS = { P0: '#ff3b5c', P1: '#ff6b35', P2: '#00e5ff', P3: '#7b5ea7' };
const TYPE_COLORS = {
  feature: '#00e5ff',
  integration: '#00ff88',
  infra: '#7b5ea7',
  testing: '#ff6b35',
};

export default function SpecDisplay({ spec, onExport }) {
  const [activeTab, setActiveTab] = useState('tickets');

  if (!spec) return null;

  const tabs = [
    { id: 'tickets', label: 'TICKETS', count: spec.tickets?.length },
    { id: 'rollout', label: 'ROLLOUT', count: spec.rollout_phases?.length },
    { id: 'metrics', label: 'METRICS', count: spec.success_metrics?.length },
    { id: 'risks', label: 'RISKS', count: spec.risks?.length },
  ];

  return (
    <div style={styles.container}>
      {/* Spec header */}
      <div style={styles.header}>
        <div>
          <div style={styles.specLabel}>IMPLEMENTATION SPEC</div>
          <div style={styles.specTitle}>{spec.spec_title}</div>
          <div style={styles.execSummary}>{spec.executive_summary}</div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.estimateBadge}>
            <span style={styles.estimateDays}>{spec.total_estimate_days}</span>
            <span style={styles.estimateLabel}>DAYS</span>
          </div>
          <button style={styles.exportBtn} onClick={onExport}>
            <Download size={12} />
            EXPORT
          </button>
        </div>
      </div>

      {/* First step callout */}
      {spec.recommended_first_step && (
        <div style={styles.firstStep}>
          <span style={styles.firstStepLabel}>RECOMMENDED FIRST STEP →</span>
          <span style={styles.firstStepText}>{spec.recommended_first_step}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              borderBottomColor: activeTab === tab.id ? '#00e5ff' : 'transparent',
              color: activeTab === tab.id ? '#00e5ff' : 'var(--text-muted)',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                ...styles.tabCount,
                background: activeTab === tab.id ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={styles.tabContent}>
        {activeTab === 'tickets' && (
          <div style={styles.ticketList}>
            {spec.tickets?.map((ticket, i) => (
              <div key={i} style={styles.ticket}>
                <div style={styles.ticketHeader}>
                  <span style={styles.ticketId}>{ticket.id}</span>
                  <span style={{
                    ...styles.ticketPriority,
                    color: PRIORITY_COLORS[ticket.priority] || '#00e5ff',
                    borderColor: `${PRIORITY_COLORS[ticket.priority] || '#00e5ff'}40`,
                  }}>
                    {ticket.priority}
                  </span>
                  <span style={{
                    ...styles.ticketType,
                    color: TYPE_COLORS[ticket.type] || '#00e5ff',
                  }}>
                    {ticket.type}
                  </span>
                  <span style={styles.ticketEst}>{ticket.estimate_days}d</span>
                </div>
                <div style={styles.ticketTitle}>{ticket.title}</div>
                <div style={styles.ticketDesc}>{ticket.description}</div>
                {ticket.acceptance_criteria?.length > 0 && (
                  <div style={styles.criteriaList}>
                    {ticket.acceptance_criteria.map((c, j) => (
                      <div key={j} style={styles.criterion}>
                        <CheckSquare size={10} color="#00ff88" />
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rollout' && (
          <div style={styles.phaseList}>
            {spec.rollout_phases?.map((phase, i) => (
              <div key={i} style={styles.phase}>
                <div style={styles.phaseHeader}>
                  <div style={styles.phaseNum}>Phase {phase.phase}</div>
                  <div style={styles.phaseName}>{phase.name}</div>
                  <div style={styles.phaseDuration}>{phase.duration_days} days</div>
                </div>
                <div style={styles.phaseBody}>
                  <div style={styles.phaseSection}>
                    <div style={styles.phaseSectionLabel}>GOALS</div>
                    {phase.goals?.map((g, j) => <div key={j} style={styles.phaseItem}>→ {g}</div>)}
                  </div>
                  <div style={styles.phaseSection}>
                    <div style={styles.phaseSectionLabel}>DELIVERABLES</div>
                    {phase.deliverables?.map((d, j) => <div key={j} style={styles.phaseItem}>✓ {d}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div style={styles.metricsList}>
            {spec.success_metrics?.map((m, i) => (
              <div key={i} style={styles.metric}>
                <div style={styles.metricName}>{m.metric}</div>
                <div style={styles.metricRow}>
                  <div style={styles.metricBox}>
                    <div style={styles.metricBoxLabel}>BASELINE</div>
                    <div style={styles.metricBoxValue}>{m.baseline}</div>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>→</div>
                  <div style={{ ...styles.metricBox, borderColor: 'rgba(0,255,136,0.2)' }}>
                    <div style={styles.metricBoxLabel}>TARGET</div>
                    <div style={{ ...styles.metricBoxValue, color: '#00ff88' }}>{m.target}</div>
                  </div>
                </div>
                <div style={styles.metricMeasure}>Measured by: {m.measurement}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'risks' && (
          <div style={styles.riskList}>
            {spec.risks?.map((r, i) => (
              <div key={i} style={styles.risk}>
                <div style={styles.riskHeader}>
                  <AlertTriangle size={12} color={
                    r.likelihood === 'high' ? '#ff3b5c'
                      : r.likelihood === 'medium' ? '#ff6b35'
                      : '#7b5ea7'
                  } />
                  <span style={styles.riskLikelihood}>{r.likelihood?.toUpperCase()}</span>
                </div>
                <div style={styles.riskText}>{r.risk}</div>
                <div style={styles.riskMitigation}>↳ {r.mitigation}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    animation: 'fade-up 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 18px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
  specLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#ff6b35',
    letterSpacing: '0.15em',
    marginBottom: 4,
  },
  specTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  execSummary: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    maxWidth: 500,
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  estimateBadge: {
    textAlign: 'center',
  },
  estimateDays: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 800,
    color: '#ff6b35',
  },
  estimateLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    color: 'var(--text-muted)',
    letterSpacing: '0.15em',
    display: 'block',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    background: 'rgba(0,229,255,0.08)',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: 5,
    color: '#00e5ff',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    cursor: 'pointer',
    letterSpacing: '0.1em',
  },
  firstStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'rgba(0,229,255,0.05)',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: 6,
  },
  firstStepLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#00e5ff',
    letterSpacing: '0.1em',
    flexShrink: 0,
  },
  firstStepText: {
    fontSize: 12,
    color: 'var(--text-primary)',
  },
  tabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid var(--border)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    transition: 'all 0.2s ease',
  },
  tabCount: {
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: 9,
  },
  tabContent: {
    minHeight: 200,
  },
  ticketList: { display: 'flex', flexDirection: 'column', gap: 8 },
  ticket: {
    padding: '12px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
  },
  ticketHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ticketId: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-secondary)',
  },
  ticketPriority: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    padding: '1px 5px',
    border: '1px solid',
    borderRadius: 3,
  },
  ticketType: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.05em',
  },
  ticketEst: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  },
  ticketTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  criteriaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  criterion: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  phaseList: { display: 'flex', flexDirection: 'column', gap: 10 },
  phase: {
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  phaseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
  },
  phaseNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#7b5ea7',
    letterSpacing: '0.1em',
  },
  phaseName: {
    fontFamily: 'var(--font-display)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    flex: 1,
  },
  phaseDuration: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: '#ff6b35',
  },
  phaseBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    padding: '12px 14px',
    gap: 16,
    background: 'var(--bg-card)',
  },
  phaseSection: {},
  phaseSectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    color: 'var(--text-muted)',
    letterSpacing: '0.15em',
    marginBottom: 6,
  },
  phaseItem: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginBottom: 4,
  },
  metricsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  metric: {
    padding: '12px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
  },
  metricName: {
    fontFamily: 'var(--font-display)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 10,
  },
  metricRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  metricBox: {
    padding: '6px 12px',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 4,
    background: 'var(--bg-card)',
  },
  metricBoxLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    marginBottom: 2,
  },
  metricBoxValue: {
    fontSize: 12,
    color: 'var(--text-primary)',
  },
  metricMeasure: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  riskList: { display: 'flex', flexDirection: 'column', gap: 8 },
  risk: {
    padding: '10px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
  },
  riskHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  riskLikelihood: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
  },
  riskText: {
    fontSize: 12,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  riskMitigation: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
};
