import React from 'react';
import { Bot, Server, GitBranch, Clock, DollarSign } from 'lucide-react';

export default function AgentDesign({ design }) {
  if (!design) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.agentType}>{design.agent_type?.toUpperCase()}</div>
          <div style={styles.agentName}>{design.agent_name}</div>
          <div style={styles.summary}>{design.architecture_summary}</div>
        </div>
        <div style={styles.meta}>
          <MetaBadge icon={<Clock size={10} />} label={design.build_time_estimate} />
          <MetaBadge icon={<DollarSign size={10} />} label={design.estimated_cost} />
          <ComplexityBadge level={design.complexity} />
        </div>
      </div>

      {/* Agents */}
      {design.agents?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}><Bot size={11} /> AGENTS</div>
          <div style={styles.agentsGrid}>
            {design.agents.map((agent, i) => (
              <div key={i} style={styles.agentCard}>
                <div style={styles.agentCardHeader}>
                  <span style={styles.agentCardName}>{agent.name}</span>
                  <span style={styles.agentModel}>{agent.model_recommendation}</span>
                </div>
                <div style={styles.agentRole}>{agent.role}</div>
                {agent.tools?.length > 0 && (
                  <div style={styles.toolList}>
                    {agent.tools.map((t, j) => <ToolTag key={j}>{t}</ToolTag>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orchestration */}
      {design.orchestration && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}><GitBranch size={11} /> ORCHESTRATION</div>
          <div style={styles.orchestrationBox}>
            <span style={styles.patternBadge}>{design.orchestration.pattern?.toUpperCase()}</span>
            <span style={styles.orchestrationDesc}>{design.orchestration.description}</span>
          </div>
        </div>
      )}

      {/* MCP Servers */}
      {design.mcp_servers_needed?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}><Server size={11} /> MCP SERVERS NEEDED</div>
          <div style={styles.serverList}>
            {design.mcp_servers_needed.map((s, i) => (
              <div key={i} style={styles.serverItem}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* Data flow */}
      {design.data_flow && (
        <div style={styles.dataFlow}>
          <div style={styles.sectionTitle}>DATA FLOW</div>
          <div style={styles.dataFlowText}>{design.data_flow}</div>
        </div>
      )}
    </div>
  );
}

function MetaBadge({ icon, label }) {
  if (!label) return null;
  return (
    <div style={metaStyles.badge}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ComplexityBadge({ level }) {
  const colors = { low: '#00ff88', medium: '#00e5ff', high: '#ff6b35' };
  return (
    <div style={{ ...metaStyles.badge, color: colors[level] || '#00e5ff', borderColor: `${colors[level] || '#00e5ff'}40` }}>
      {level?.toUpperCase()}
    </div>
  );
}

function ToolTag({ children }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      padding: '2px 5px',
      borderRadius: 3,
      border: '1px solid rgba(123,94,167,0.4)',
      color: '#7b5ea7',
    }}>
      {children}
    </span>
  );
}

const metaStyles = {
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-secondary)',
    padding: '3px 8px',
    border: '1px solid var(--border)',
    borderRadius: 4,
  },
};

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
    gap: 16,
    padding: '16px 18px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
  agentType: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#7b5ea7',
    letterSpacing: '0.15em',
    marginBottom: 4,
  },
  agentName: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  summary: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    maxWidth: 500,
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    flexShrink: 0,
  },
  section: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px 16px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.15em',
    color: 'var(--text-secondary)',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  agentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 8,
  },
  agentCard: {
    padding: '10px 12px',
    background: 'var(--bg-card)',
    border: '1px solid rgba(123,94,167,0.2)',
    borderRadius: 6,
  },
  agentCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  agentCardName: {
    fontFamily: 'var(--font-display)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  agentModel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#7b5ea7',
  },
  agentRole: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  toolList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
  },
  orchestrationBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: 'var(--bg-card)',
    borderRadius: 6,
  },
  patternBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    padding: '2px 8px',
    border: '1px solid rgba(0,229,255,0.3)',
    color: '#00e5ff',
    borderRadius: 3,
    flexShrink: 0,
  },
  orchestrationDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  serverList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  serverItem: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    padding: '3px 10px',
    border: '1px solid rgba(0,255,136,0.2)',
    color: '#00ff88',
    borderRadius: 4,
    background: 'rgba(0,255,136,0.04)',
  },
  dataFlow: {
    padding: '12px 16px',
    background: 'rgba(0,229,255,0.03)',
    border: '1px solid rgba(0,229,255,0.1)',
    borderRadius: 8,
  },
  dataFlowText: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontFamily: 'var(--font-mono)',
  },
};
