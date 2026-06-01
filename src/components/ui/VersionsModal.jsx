import { useEffect, useState } from 'react';
import { fetchVersions } from '../../services/versionService';

export default function VersionsModal({ guidelineId, guidelineTitle, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchVersions(guidelineId);
        setVersions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [guidelineId]);

  const handleRestore = (version) => {
    if (window.confirm('Restore this version? This will create a new version with the old content.')) {
      onRestore(version);
    }
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{ width: '90%', maxWidth: '800px' }}>
        <header className="modal-card-head">
          <p className="modal-card-title">Version History – {guidelineTitle}</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {loading ? (
            <progress className="progress is-primary" max="100">Loading...</progress>
          ) : (
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>Ver #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map(v => (
                  <tr key={v.id}>
                    <td>{v.version_number}</td>
                    <td>{new Date(v.created_at).toLocaleString()}</td>
                    <td><span className={`tag ${v.status === 'published' ? 'is-success' : 'is-warning'}`}>{v.status}</span></td>
                    <td>
                      <div className="buttons">
                        <button className="button is-small is-info" onClick={() => setExpandedVersion(expandedVersion === v.id ? null : v.id)}>
                          <span className="icon"><i className="fas fa-eye"></i></span>
                          <span>{expandedVersion === v.id ? 'Hide' : 'View'}</span>
                        </button>
                        <button className="button is-small is-warning" onClick={() => handleRestore(v)}>
                          <span className="icon"><i className="fas fa-undo"></i></span>
                          <span>Restore</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {expandedVersion && (
            <div className="box mt-4">
              <h5 className="title is-6">Version #{versions.find(v => v.id === expandedVersion)?.version_number} content</h5>
              <div className="content">
                {versions.find(v => v.id === expandedVersion)?.sections?.map((s, i) => (
                  <div key={i} className="mb-3">
                    <strong>{s.title || s.section_type}</strong>
                    <div dangerouslySetInnerHTML={{ __html: s.content }} />  {/* Markdown would be rendered by parent, here we just show raw */}
                  </div>
                ))}
              </div>
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
