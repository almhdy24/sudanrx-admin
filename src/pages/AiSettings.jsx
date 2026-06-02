import { useState } from 'react';
import { getAiSettings, updateAiSettings } from '../services/aiService';

const MODEL_OPTIONS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-pro-latest',
  'gemini-flash-latest',
];

export default function AiSettings() {
  const [settings, setSettings] = useState(getAiSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateAiSettings({
      primaryModel: settings.primaryModel,
      fallbackModel: settings.fallbackModel,
      dailyLimit: settings.dailyLimit,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="title">AI Settings</h1>

      <div className="box" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave}>
          <div className="field">
            <label className="label">Primary Model</label>
            <div className="select is-fullwidth">
              <select
                value={settings.primaryModel}
                onChange={(e) => setSettings({ ...settings, primaryModel: e.target.value })}
              >
                {MODEL_OPTIONS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <p className="help">Used for all AI requests until the daily limit is reached.</p>
          </div>

          <div className="field">
            <label className="label">Fallback Model (after limit)</label>
            <div className="select is-fullwidth">
              <select
                value={settings.fallbackModel}
                onChange={(e) => setSettings({ ...settings, fallbackModel: e.target.value })}
              >
                {MODEL_OPTIONS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <p className="help">Automatically used when the daily request limit is exceeded.</p>
          </div>

          <div className="field">
            <label className="label">Daily Request Limit</label>
            <input
              className="input"
              type="number"
              min="1"
              max="100"
              value={settings.dailyLimit}
              onChange={(e) => setSettings({ ...settings, dailyLimit: parseInt(e.target.value) || 10 })}
            />
            <p className="help">Number of AI calls allowed per day before switching models. Resets at midnight.</p>
          </div>

          <div className="notification is-info is-light">
            <p><strong>Current usage today:</strong> {settings.requestCount} requests</p>
          </div>

          <div className="field is-grouped">
            <div className="control">
              <button type="submit" className="button is-primary">
                <span className="icon"><i className="fas fa-save"></i></span>
                <span>Save</span>
              </button>
            </div>
            {saved && <span className="tag is-success is-light ml-2">Saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
