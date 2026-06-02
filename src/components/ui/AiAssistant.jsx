import { useState } from 'react';
import { generateFromPrompt, generateFromPDF } from '../../services/aiService';

const defaultSections = [
  { section_type: 'overview', title: 'Overview', content: '' },
  { section_type: 'diagnosis', title: 'Diagnosis', content: '' },
  { section_type: 'management', title: 'Management', content: '' },
];

export default function AiAssistant({ onInsert, onClose }) {
  const [tab, setTab] = useState('describe'); // 'describe' or 'pdf'
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);  // { title, sections[] }
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      let data;
      if (tab === 'describe') {
        if (!prompt.trim()) throw new Error('Please enter a description.');
        data = await generateFromPrompt(prompt);
      } else {
        if (!file) throw new Error('Please select a PDF file.');
        data = await generateFromPDF(file);
      }
      setGenerated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (generated) {
      onInsert(generated);
      onClose();
    }
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{ width: '90%', maxWidth: '600px' }}>
        <header className="modal-card-head">
          <p className="modal-card-title">AI Assistant</p>
          <button className="delete" onClick={onClose}></button>
        </header>

        <section className="modal-card-body">
          {/* Tabs */}
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

          {/* Describe tab */}
          {tab === 'describe' && (
            <div className="field">
              <label className="label">Describe the guideline</label>
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="E.g., Malaria case management in Sudan, including first-line treatment and severe malaria criteria..."
                  rows="6"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* PDF tab */}
          {tab === 'pdf' && (
            <div className="field">
              <label className="label">Upload PDF</label>
              <div className="file has-name is-fullwidth">
                <label className="file-label">
                  <input
                    className="file-input"
                    type="file"
                    accept="application/pdf"
                    onChange={e => setFile(e.target.files[0])}
                  />
                  <span className="file-cta">
                    <span className="file-icon"><i className="fas fa-upload"></i></span>
                    <span className="file-label">Choose file…</span>
                  </span>
                  {file && <span className="file-name">{file.name}</span>}
                </label>
              </div>
            </div>
          )}

          {error && <div className="notification is-danger mt-3">{error}</div>}

          {/* Generate button */}
          <button
            className={`button is-primary is-fullwidth mt-3 ${loading ? 'is-loading' : ''}`}
            onClick={handleGenerate}
            disabled={loading}
          >
            Generate
          </button>

          {/* Generated preview */}
          {generated && (
            <div className="box mt-4">
              <h5 className="title is-6">{generated.title}</h5>
              {generated.sections.map((sec, i) => (
                <div key={i} className="mb-2">
                  <strong>{sec.title || sec.section_type}</strong>
                  <p className="is-size-7">{sec.content.substring(0, 200)}...</p>
                </div>
              ))}
              <button className="button is-success" onClick={handleInsert}>
                Insert into Editor
              </button>
            </div>
          )}
        </section>

        <footer className="modal-card-foot">
          <button className="button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
