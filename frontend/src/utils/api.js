const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
  async analyzeText(text, context = '') {
    const res = await fetch(`${BASE_URL}/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async transcribeAudio(audioBlob) {
    const form = new FormData();
    form.append('file', audioBlob, 'recording.webm');
    const res = await fetch(`${BASE_URL}/transcribe`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(`Transcription error: ${res.status}`);
    return res.json();
  },

  async designAgent(workflow) {
    const res = await fetch(`${BASE_URL}/design-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow }),
    });
    if (!res.ok) throw new Error(`Agent design error: ${res.status}`);
    return res.json();
  },

  async generateSpec(workflow, agentDesign) {
    const res = await fetch(`${BASE_URL}/generate-spec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow, agent_design: agentDesign }),
    });
    if (!res.ok) throw new Error(`Spec generation error: ${res.status}`);
    return res.json();
  },
};

export const WS_URL = BASE_URL.replace('http', 'ws') + '/ws/live';
