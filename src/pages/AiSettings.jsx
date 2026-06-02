import { useState } from 'react';
import { getAiSettings, updateAiSettings } from '../services/aiService';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-pro-latest',
  'gemini-flash-latest',
];

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'deepseek-r1-distill-llama-70b',  // available on Groq
];

export default function AiSettings() {
  const [settings, setSettings] = useState(getAiSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateAiSettings({
      primaryModel: settings.primaryModel,
      fallbackModel: settings.fallbackModel,
      groqModel: settings.groqModel,
      dailyLimit: settings.dailyLimit,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const usagePercent = Math.min(100, Math.round((settings.requestCount / settings.dailyLimit) * 100));

  return (
    <div>
      <h1 className="title">AI Settings</h1>

      <div className="box" style={{ maxWidth: 700 }}>
        {/* Status banner */}
        <div className="notification is-info is-light">
          <div className="level mb-2">
            <div className="level-left">
              <span className="icon-text">
                <span className="icon"><i className="fas fa-robot"></i></span>
                <strong>Current provider:</strong> {settings.geminiExhausted ? 'Groq (Gemini limit reached)' : 'Gemini'}
              </span>
            </div>
            <div className="level-right">
              <span className="tag is-medium">
                {settings.requestCount} / {settings.dailyLimit} requests today
              </span>
            </div>
          </div>
          <progress className={`progress ${usagePercent > 80 ? 'is-danger' : 'is-success'}`} value={usagePercent} max="100">{usagePercent}%</progress>
          {settings.geminiExhausted && <p className="has-text-danger">Gemini quota exhausted. Using Groq until tomorrow.</p>}
        </div>

        <form onSubmit={handleSave}>
          {/* Gemini section */}
          <div className="box has-background-light mb-4">
            <h4 className="title is-5"><i className="fas fa-brain"></i> Gemini</h4>
            <div className="field">
              <label className="label">Primary Model</label>
              <div className="select is-fullwidth">
                <select value={settings.primaryModel} onChange={e => setSettings({ ...settings, primaryModel: e.target.value })}>
                  {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <p className="help">Model used for all AI tasks until daily limit is exceeded.</p>
            </div>

            <div className="field">
              <label className="label">Fallback Model (after limit before Groq)</label>
              <div className="select is-fullwidth">
                <select value={settings.fallbackModel} onChange={e => setSettings({ ...settings, fallbackModel: e.target.value })}>
                  {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <p className="help">Tried if primary hits 429, but usually Groq takes over.</p>
            </div>
          </div>

          {/* Groq section */}
          <div className="box has-background-light mb-4">
            <h4 className="title is-5"><i className="fas fa-bolt"></i> Groq (Fallback)</h4>
            <div className="field">
              <label className="label">Groq Model</label>
              <div className="select is-fullwidth">
                <select value={settings.groqModel} onChange={e => setSettings({ ...settings, groqModel: e.target.value })}>
                  {GROQ_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <p className="help">Used automatically when Gemini daily limit is reached.</p>
            </div>
          </div>

          {/* Daily limit */}
          <div className="box has-background-light mb-4">
            <h4 className="title is-5"><i className="fas fa-sliders-h"></i> Rate Limit</h4>
            <div className="field">
              <label className="label">Daily Request Limit (Gemini)</label>
              <input
                className="input"
                type="number"
                min="1"
                max="50"
                value={settings.dailyLimit}
                onChange={e => setSettings({ ...settings, dailyLimit: parseInt(e.target.value) || 18 })}
              />
              <p className="help">Number of Gemini calls allowed per day before automatic switch to Groq.</p>
            </div>
          </div>

          <div className="field is-grouped">
            <div className="control">
              <button type="submit" className="button is-primary is-medium">
                <span className="icon"><i className="fas fa-save"></i></span>
                <span>Save Settings</span>
              </button>
            </div>
            {saved && <span className="tag is-success is-light ml-2">✅ Saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
