import React, { useState, useCallback, useRef } from 'react';
import Header from '../components/Header';
import VoiceInput from '../components/VoiceInput';
import WorkflowResult from '../components/WorkflowResult';
import AgentDesign from '../components/AgentDesign';
import SpecDisplay from '../components/SpecDisplay';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { api } from '../utils/api';
import { Cpu, ChevronRight, RotateCcw, Copy, Check, Loader } from 'lucide-react';

const STEPS = ['input', 'workflow', 'agent', 'spec'];
const STEP_LABELS = {
  input: 'CAPTURE',
  workflow: 'EXTRACT',
  agent: 'DESIGN',
  spec: 'SPEC',
};

const SAMPLE_INPUTS = [
  "Nach jedem Sales Call müssen wir Gong analysieren, mit unserem Notion Playbook vergleichen und dem Sales Rep automatisch Feedback via Slack schicken.",
  "Unser Finance Team prüft jeden Tag manuell alle Ramp-Ausgaben und eskaliert unklare Fälle über Slack an den Manager.",
  "Wir müssen jeden Freitag einen Report aus HubSpot ziehen, in Notion aktualisieren und dem gesamten Sales Team per Email schicken.",
  "Bei jedem neuen Kunden-Onboarding erstellt unser Team manuell Tasks in Asana, schickt eine Welcome-Email und erstellt ein Notion-Dokument.",
];

export default function WorkshopPage() {
  const [step, setStep] = useState('input');
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [agentDesign, setAgentDesign] = useState(null);
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const voice = useVoiceRecorder();

  // Sync voice transcript → input
  React.useEffect(() => {
    if (voice.transcript) {
      setInputText(prev => prev ? prev + ' ' + voice.transcript : voice.transcript);
    }
  }, [voice.transcript]);

  const appStatus = loading ? 'processing'
    : voice.isRecording ? 'recording'
    : step === 'input' ? 'ready'
    : 'ready';

  const runAnalysis = useCallback(async () => {
    if (!inputText.trim()) {
      setError('Please enter or record some meeting content first.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Step 1: Extract workflow
      setLoadingMsg('Extracting workflow structure...');
      setStep('workflow');
      const wf = await api.analyzeText(inputText, context);
      setWorkflow(wf);

      // Step 2: Design agent
      setLoadingMsg('Designing AI agent architecture...');
      setStep('agent');
      const ad = await api.designAgent(wf);
      setAgentDesign(ad);

      // Step 3: Generate spec
      setLoadingMsg('Generating implementation spec...');
      setStep('spec');
      const sp = await api.generateSpec(wf, ad);
      setSpec(sp);

    } catch (err) {
      setError(`Analysis failed: ${err.message}. Make sure the backend is running on port 8000.`);
      setStep('input');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }, [inputText, context]);

  const reset = useCallback(() => {
    setStep('input');
    setInputText('');
    setContext('');
    setWorkflow(null);
    setAgentDesign(null);
    setSpec(null);
    setError(null);
    voice.clearTranscript();
  }, [voice]);

  const exportSpec = useCallback(() => {
    const data = { workflow, agentDesign, spec, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataleap-spec-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflow, agentDesign, spec]);

  const copyOutput = useCallback(() => {
    const text = JSON.stringify({ workflow, agentDesign, spec }, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [workflow, agentDesign, spec]);

  const useSample = (text) => {
    setInputText(text);
    setError(null);
  };

  return (
    <div style={styles.app}>
      <Header status={appStatus} />

      <div style={styles.layout}>
        {/* Left: Input panel */}
        <div style={styles.inputPanel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>WORKSHOP INPUT</span>
            {step !== 'input' && (
              <button style={styles.resetBtn} onClick={reset}>
                <RotateCcw size={11} /> RESET
              </button>
            )}
          </div>

          {/* Context field */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>MEETING CONTEXT (optional)</label>
            <input
              style={styles.contextInput}
              placeholder="e.g. Finance team workshop, DACH enterprise, SAP environment"
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>

          {/* Voice input */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>VOICE CAPTURE — WHISPER</label>
            <VoiceInput
              isRecording={voice.isRecording}
              isTranscribing={voice.isTranscribing}
              audioLevel={voice.audioLevel}
              onStart={voice.startRecording}
              onStop={voice.stopRecording}
              error={voice.error}
            />
          </div>

          {/* Text area */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>
              MEETING NOTES / TRANSCRIPT
              <span style={styles.charCount}>{inputText.length} chars</span>
            </label>
            <textarea
              style={styles.textarea}
              placeholder={"Paste German meeting notes, transcript, or type workflow description...\n\nBeispiel: Nach jedem Sales Call müssen wir Gong analysieren..."}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={8}
            />
          </div>

          {/* Sample inputs */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>QUICK SAMPLES</label>
            <div style={styles.samples}>
              {SAMPLE_INPUTS.map((s, i) => (
                <button key={i} style={styles.sampleBtn} onClick={() => useSample(s)}>
                  <span style={styles.sampleNum}>#{i + 1}</span>
                  <span style={styles.sampleText}>{s.slice(0, 60)}...</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          {/* Analyse button */}
          <button
            style={{
              ...styles.analyseBtn,
              opacity: loading || !inputText.trim() ? 0.5 : 1,
              cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
            }}
            onClick={runAnalysis}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                {loadingMsg || 'ANALYSING...'}
              </>
            ) : (
              <>
                <Cpu size={14} />
                ANALYSE WORKFLOW
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Right: Results panel */}
        <div style={styles.resultsPanel}>
          {/* Progress steps */}
          <div style={styles.stepTrack}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{
                  ...styles.stepItem,
                  opacity: STEPS.indexOf(step) >= i ? 1 : 0.3,
                }}>
                  <div style={{
                    ...styles.stepDot,
                    background: STEPS.indexOf(step) >= i
                      ? (step === s && loading ? '#00e5ff' : '#00ff88')
                      : 'var(--bg-elevated)',
                    borderColor: STEPS.indexOf(step) >= i ? '#00e5ff' : 'var(--border)',
                    boxShadow: step === s && loading ? '0 0 8px #00e5ff' : 'none',
                  }}>
                    {step === s && loading && (
                      <div style={styles.stepLoader} />
                    )}
                  </div>
                  <span style={{
                    ...styles.stepLabel,
                    color: step === s ? '#00e5ff' : 'var(--text-muted)',
                  }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    ...styles.stepLine,
                    background: STEPS.indexOf(step) > i ? '#00e5ff' : 'var(--border)',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Empty state */}
          {step === 'input' && !loading && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Cpu size={32} color="rgba(0,229,255,0.3)" />
              </div>
              <div style={styles.emptyTitle}>Workshop Copilot</div>
              <div style={styles.emptyText}>
                Record or paste German customer discussion.<br />
                AI extracts workflows, designs agents, generates specs.
              </div>
              <div style={styles.emptyTips}>
                <div style={styles.tipItem}>🎙 Record live in the customer meeting</div>
                <div style={styles.tipItem}>📋 Paste from notes or transcript</div>
                <div style={styles.tipItem}>⚡ Get agent spec before you leave the office</div>
              </div>
            </div>
          )}

          {/* Results — scroll container */}
          {step !== 'input' && (
            <div style={styles.resultsScroll}>
              {/* Actions bar */}
              {spec && (
                <div style={styles.actionsBar}>
                  <button style={styles.actionBtn} onClick={copyOutput}>
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'COPIED' : 'COPY ALL'}
                  </button>
                  <button style={styles.actionBtn} onClick={exportSpec}>
                    EXPORT JSON
                  </button>
                </div>
              )}

              {/* Tabs for results */}
              {(workflow || agentDesign || spec) && (
                <ResultsTabs
                  workflow={workflow}
                  agentDesign={agentDesign}
                  spec={spec}
                  onExport={exportSpec}
                  loading={loading}
                  currentStep={step}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsTabs({ workflow, agentDesign, spec, onExport, loading, currentStep }) {
  const [activeResult, setActiveResult] = useState('workflow');

  // Auto-switch to latest completed
  React.useEffect(() => {
    if (spec) setActiveResult('spec');
    else if (agentDesign) setActiveResult('agent');
    else if (workflow) setActiveResult('workflow');
  }, [workflow, agentDesign, spec]);

  const tabs = [
    { id: 'workflow', label: 'WORKFLOW', available: !!workflow },
    { id: 'agent', label: 'AGENT DESIGN', available: !!agentDesign },
    { id: 'spec', label: 'SPEC', available: !!spec },
  ];

  return (
    <div>
      <div style={rStyles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...rStyles.tab,
              opacity: tab.available ? 1 : 0.3,
              borderBottomColor: activeResult === tab.id ? '#00e5ff' : 'transparent',
              color: activeResult === tab.id ? '#00e5ff' : 'var(--text-muted)',
            }}
            onClick={() => tab.available && setActiveResult(tab.id)}
            disabled={!tab.available}
          >
            {tab.label}
            {!tab.available && loading && (
              <Loader size={8} style={{ animation: 'spin 1s linear infinite', marginLeft: 4 }} />
            )}
          </button>
        ))}
      </div>

      <div style={rStyles.content}>
        {activeResult === 'workflow' && <WorkflowResult workflow={workflow} />}
        {activeResult === 'agent' && <AgentDesign design={agentDesign} />}
        {activeResult === 'spec' && <SpecDisplay spec={spec} onExport={onExport} />}
      </div>
    </div>
  );
}

const rStyles = {
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    marginBottom: 16,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
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
  content: {
    minHeight: 200,
  },
};

const styles = {
  app: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    flexDirection: 'column',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    flex: 1,
    height: 'calc(100vh - 53px)',
    overflow: 'hidden',
  },
  inputPanel: {
    borderRight: '1px solid var(--border)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto',
    background: 'var(--bg-surface)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.15em',
    color: 'var(--text-secondary)',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    cursor: 'pointer',
    letterSpacing: '0.1em',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.12em',
    color: 'var(--text-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    color: 'var(--text-muted)',
  },
  contextInput: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  textarea: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    lineHeight: 1.6,
    outline: 'none',
    resize: 'vertical',
    minHeight: 140,
    transition: 'border-color 0.2s ease',
  },
  samples: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sampleBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '7px 10px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.2s ease',
  },
  sampleNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#7b5ea7',
    flexShrink: 0,
    paddingTop: 1,
  },
  sampleText: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  errorBox: {
    padding: '8px 12px',
    background: 'rgba(255,59,92,0.08)',
    border: '1px solid rgba(255,59,92,0.2)',
    borderRadius: 5,
    color: '#ff3b5c',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
  },
  analyseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(123,94,167,0.15))',
    border: '1px solid rgba(0,229,255,0.3)',
    borderRadius: 8,
    color: '#00e5ff',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: 4,
  },
  resultsPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    overflowY: 'auto',
    gap: 16,
  },
  stepTrack: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    marginBottom: 4,
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '1px solid',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLoader: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#00e5ff',
    animation: 'pulse-dot 1s infinite',
  },
  stepLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    letterSpacing: '0.1em',
  },
  stepLine: {
    height: 1,
    flex: 1,
    minWidth: 20,
    marginBottom: 12,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '60px 40px',
    textAlign: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'rgba(0,229,255,0.05)',
    border: '1px solid rgba(0,229,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  emptyText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: 360,
  },
  emptyTips: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 8,
  },
  tipItem: {
    fontSize: 12,
    color: 'var(--text-muted)',
    padding: '5px 14px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 4,
  },
  resultsScroll: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    cursor: 'pointer',
    letterSpacing: '0.1em',
  },
};
