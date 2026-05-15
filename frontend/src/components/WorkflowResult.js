import React from 'react';
import { Zap, Users, Link, AlertTriangle, Target, CheckCircle } from 'lucide-react';

const PRIORITY_COLORS = {
  critical: '#ff3b5c',
  high: '#ff6b35',
  medium: '#00e5ff',
  low: '#7b5ea7',
};

const SCORE_COLOR = (score) => {
  if (score >= 8) return '#00ff88';
  if (score >= 5) return '#00e5ff';
  if (score >= 3) return '#ff6b35';
  return '#ff3b5c';
};

export default function WorkflowResult({ workflow }) {
  if (!workflow) return null;
  const scoreColor = SCORE_COLOR(workflow.automation_score);
  const priorityColor = PRIORITY_COLORS[workflow.priority] || '#00e5ff';

  return (
    <div style={styles.container}>
      {/* Header strip */}
      <div style={styles.headerStrip}>
        <div>
          <div style={styles.teamLabel}>
            {workflow.customer_team || 'Enterprise Team'}
          </div>
          <div style={styles.summary}>{workflow.summary}</div>
        </div>
        <div style={styles.scoreBlock}>
          <div style={{ ...styles.scoreNum, color: scoreColor }}>
            {workflow.automation_score}
            <span style={styles.scoreOf}>/10</span>
          </div>
          <div style={styles.scoreLabel}>AUTOMATION</div>
          <div style={{
            ...styles.priorityBadge,
            borderColor: priorityColor,
            color: priorityColor,
          }}>
            {workflow.priority?.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Trigger */}
        {workflow.trigger && (
          <Card icon={<Zap size={12} />} title="TRIGGER" accent="#00e5ff">
            <div style={styles.triggerName}>{workflow.trigger.event}</div>
            {workflow.trigger.frequency && (
              <Tag>{workflow.trigger.frequency}</Tag>
            )}
            {workflow.trigger.source_system && (
              <Tag accent>{workflow.trigger.source_system}</Tag>
            )}
          </Card>
        )}

        {/* Stakeholders */}
        {workflow.stakeholders?.length > 0 && (
          <Card icon={<Users size={12} />} title="STAKEHOLDERS" accent="#7b5ea7">
            <div style={styles.tags}>
              {workflow.stakeholders.map((s, i) => (
                <Tag key={i}>{s}</Tag>
              ))}
            </div>
          </Card>
        )}

        {/* Integrations */}
        {workflow.integration_points?.length > 0 && (
          <Card icon={<Link size={12} />} title="INTEGRATIONS" accent="#00ff88" wide>
            <div style={styles.integrationGrid}>
              {workflow.integration_points.map((ip, i) => (
                <div key={i} style={styles.integrationItem}>
                  <span style={styles.integrationName}>{ip.tool}</span>
                  <span style={{
                    ...styles.integrationType,
                    color: ip.type === 'input' ? '#00e5ff'
                      : ip.type === 'output' ? '#00ff88'
                      : '#ff6b35',
                  }}>{ip.type}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pain Points */}
        {workflow.pain_points?.length > 0 && (
          <Card icon={<AlertTriangle size={12} />} title="PAIN POINTS" accent="#ff6b35">
            <ul style={styles.list}>
              {workflow.pain_points.map((p, i) => (
                <li key={i} style={styles.listItem}>
                  <span style={styles.listDot} />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Edge Cases */}
        {workflow.edge_cases?.length > 0 && (
          <Card icon={<AlertTriangle size={12} />} title="EDGE CASES" accent="#ff3b5c">
            <ul style={styles.list}>
              {workflow.edge_cases.map((e, i) => (
                <li key={i} style={styles.listItem}>
                  <span style={{ ...styles.listDot, background: '#ff3b5c' }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', marginBottom: 2 }}>{e.scenario}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>→ {e.handling}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Actions pipeline */}
      {workflow.actions?.length > 0 && (
        <div style={styles.actionsSection}>
          <div style={styles.sectionTitle}>
            <Target size={11} />
            WORKFLOW PIPELINE
          </div>
          <div style={styles.pipeline}>
            {workflow.actions.map((action, i) => (
              <React.Fragment key={i}>
                <div style={{
                  ...styles.pipelineStep,
                  borderColor: action.manual
                    ? 'rgba(255,107,53,0.3)'
                    : 'rgba(0,255,136,0.3)',
                }}>
                  <div style={styles.stepNum}>{action.step}</div>
                  <div style={styles.stepContent}>
                    <div style={styles.stepAction}>{action.action}</div>
                    <div style={styles.stepMeta}>
                      <span style={{ color: 'var(--text-secondary)' }}>{action.actor}</span>
                      {action.tool && <Tag accent>{action.tool}</Tag>}
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: action.manual ? '#ff6b35' : '#00ff88',
                      }}>
                        {action.manual ? 'MANUAL' : 'AUTOMATED'}
                      </span>
                    </div>
                  </div>
                </div>
                {i < workflow.actions.length - 1 && (
                  <div style={styles.pipelineArrow}>↓</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Automation rationale */}
      {workflow.automation_rationale && (
        <div style={styles.rationale}>
          <CheckCircle size={12} color={scoreColor} />
          <span>{workflow.automation_rationale}</span>
        </div>
      )}
    </div>
  );
}

function Card({ icon, title, accent, children, wide }) {
  return (
    <div style={{ ...cardStyles.card, gridColumn: wide ? 'span 2' : 'span 1' }}>
      <div style={{ ...cardStyles.title, color: accent }}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Tag({ children, accent }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      padding: '2px 6px',
      borderRadius: 3,
      border: `1px solid ${accent ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
      color: accent ? '#00e5ff' : 'var(--text-secondary)',
      marginRight: 4,
      marginTop: 4,
    }}>
      {children}
    </span>
  );
}

const cardStyles = {
  card: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 16px',
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.15em',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    animation: 'fade-up 0.3s ease',
  },
  headerStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 20px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
  teamLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#00e5ff',
    letterSpacing: '0.15em',
    marginBottom: 6,
  },
  summary: {
    fontFamily: 'var(--font-display)',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    maxWidth: '70%',
    lineHeight: 1.4,
  },
  scoreBlock: {
    textAlign: 'right',
    flexShrink: 0,
  },
  scoreNum: {
    fontFamily: 'var(--font-display)',
    fontSize: 32,
    fontWeight: 800,
    lineHeight: 1,
  },
  scoreOf: {
    fontSize: 14,
    opacity: 0.5,
  },
  scoreLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    color: 'var(--text-muted)',
    letterSpacing: '0.15em',
    marginTop: 2,
  },
  priorityBadge: {
    display: 'inline-block',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    padding: '2px 8px',
    border: '1px solid',
    borderRadius: 3,
    marginTop: 6,
    letterSpacing: '0.1em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  triggerName: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  integrationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 6,
  },
  integrationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 8px',
    background: 'var(--bg-card)',
    borderRadius: 4,
  },
  integrationName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-primary)',
  },
  integrationType: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.05em',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  listDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#ff6b35',
    flexShrink: 0,
    marginTop: 5,
  },
  actionsSection: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 16px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.15em',
    color: '#7b5ea7',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  pipeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  pipelineStep: {
    display: 'flex',
    gap: 12,
    padding: '10px 12px',
    border: '1px solid',
    borderRadius: 6,
    background: 'var(--bg-card)',
  },
  pipelineArrow: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 12,
    padding: '2px 0',
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(0,229,255,0.1)',
    border: '1px solid rgba(0,229,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: '#00e5ff',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepAction: {
    fontSize: 13,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  stepMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    flexWrap: 'wrap',
  },
  rationale: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '10px 14px',
    background: 'rgba(0,255,136,0.04)',
    border: '1px solid rgba(0,255,136,0.15)',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
};
