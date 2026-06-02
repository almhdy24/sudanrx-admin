import { useState } from 'react';
import { generateFromPrompt, generateFromPDF } from '../../services/aiService';

export default function AiAssistant({ onInsert, onClose }) {
  const [tab, setTab] = useState('describe');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState('');
  const [progressMsg, setProgressMsg] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setGenerated(null);
    setLoading(true);
    setProgressMsg('');

    try {
      let data;
      if (tab === 'describe') {
        if (!prompt.trim()) throw new Error('Please enter a description.');
        setProgressMsg('Generating…');
        data = await generateFromPrompt(prompt);
      } else {
        if (!file) throw new Error('Please select a PDF file.');
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('PDF too large (max 10MB). Use a smaller file or describe manually.');
        }
        setProgressMsg('Extracting text… (this may take a moment)');
        data = await generateFromPDF(file);
      }
      setGenerated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  // إيقاف انتشار الأحداث للأعلى
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div className="modal is-active" style={{ zIndex: 2000 }}>
      <div className="modal-background" onClick={loading ? undefined : onClose}></div>
      <div className="modal-card" style={{ width: '95%', maxWidth: '600px' }} onClick={stopPropagation}>
        <header className="modal-card-head">
          <p className="modal-card-title">AI Assistant</p>
          {!loading && <button className="delete" onClick={onClose}></button>}
        </header>

        <section className="modal-card-body">
          <div className="tabs is-boxed">
            <ul>
              <li className={tab === 'describe' ? 'is-active' : ''}>
                <a onClick={() => setTab('describe')}>Describe</a>
              </li>
              <li className={tab === 'pdf' ? 'is-active' : ''}>
                <a onClick={() => setTab('pdf')}>Upload PDF</a>
              </li>
            </ul>
          </div>

          {tab === 'describe' && (
            <div className="field">
              <label className="label">Describe the guideline</label>
              <textarea className="textarea" rows="6" value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="E.g., Malaria case management in Sudan…" />
            </div>
          )}

          {tab === 'pdf' && (
            <div className="field">
              <label className="label">Upload PDF (max 10MB)</label>
              <div className="file has-name is-fullwidth">
                <label className="file-label">
                  <input className="file-input" type="file" accept="application/pdf"
                    onChange={e => setFile(e.target.files[0])}
                    onClick={stopPropagation} />
                  <span className="file-cta">
                    <span className="file-icon"><i className="fas fa-upload"></i></span>
                    <span className="file-label">Choose file…</span>
                  </span>
                  {file && <span className="file-name">{file.name}</span>}
                </label>
              </div>
              <p className="help">For large files, use the Describe tab instead.</p>
            </div>
          )}

          {progressMsg && <div className="notification is-info is-light mt-3">{progressMsg}</div>}
          {error && <div className="notification is-danger mt-3">{error}</div>}

          <button type="button" className={`button is-primary is-fullwidth mt-3 ${loading ? 'is-loading' : ''}`}
            onClick={handleGenerate} disabled={loading}>
            Generate
          </button>

          {generated && (
            <div className="box mt-4">
              <h5 className="title is-6">{generated.title}</h5>
              {generated.sections.map((sec, i) => (
                <div key={i} className="mb-2">
                  <strong>{sec.title || sec.section_type}</strong>
                  <p className="is-size-7">{sec.content.substring(0, 200)}...</p>
                </div>
              ))}
              <button type="button" className="button is-success" onClick={() => { onInsert(generated); onClose(); }}>
                Insert into Editor
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
