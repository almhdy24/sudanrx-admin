import { useEffect, useState } from 'react';
import { fetchGuidelines, createGuideline, updateGuideline, deleteGuideline } from '../services/guidelineService';
import { fetchCategories } from '../services/categoryService';
import GuidelineForm from '../components/ui/GuidelineForm';
import VersionsModal from '../components/ui/VersionsModal';
import { useAuth } from '../hooks/useAuth';

const canWrite = (role) => role === 'contributor' || role === 'admin' || role === 'editor';

export default function Guidelines() {
  const [guidelines, setGuidelines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState(null); // for version history modal
  const { profile, session } = useAuth();

  const loadGuidelines = async () => {
    setLoading(true);
    try {
      const data = await fetchGuidelines({ search, categoryId: filterCat || undefined });
      setGuidelines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(await fetchCategories());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadGuidelines(); }, [search, filterCat]);

  const openCreate = () => {
    if (!canWrite(profile?.role)) return;
    setEditData(null);
    setShowModal(true);
  };

  const openEdit = (guideline) => {
    if (!canWrite(profile?.role)) return;
    setEditData(guideline);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editData) {
        await updateGuideline(editData.id, formData, session.user.id);
      } else {
        await createGuideline(formData, session.user.id);
      }
      setShowModal(false);
      loadGuidelines();
    } catch (err) {
      alert('Error saving guideline: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!canWrite(profile?.role)) return;
    if (window.confirm('Delete this guideline?')) {
      await deleteGuideline(id);
      loadGuidelines();
    }
  };

  const handleRestoreVersion = async (version) => {
    // version contains title, category_id, status, sections (JSON array)
    // We'll simply edit the guideline with that data (this will create a new version as well)
    try {
      await updateGuideline(version.guideline_id, {
        title: version.title,
        category_id: version.category_id,
        status: version.status,
        sections: version.sections,
      }, session.user.id);
      setSelectedGuidelineId(null); // close modal
      loadGuidelines();
    } catch (err) {
      alert('Restore failed: ' + err.message);
    }
  };

  return (
    <>
      <div className="level">
        <div className="level-left">
          <h1 className="title">Guidelines</h1>
        </div>
        <div className="level-right">
          {canWrite(profile?.role) && (
            <button className="button is-primary" onClick={openCreate}>
              <span className="icon"><i className="fas fa-plus"></i></span>
              <span>New Guideline</span>
            </button>
          )}
        </div>
      </div>

      <div className="field is-grouped mb-4">
        <p className="control is-expanded">
          <input
            className="input"
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </p>
        <p className="control">
          <span className="select">
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </span>
        </p>
      </div>

      {loading ? (
        <progress className="progress is-primary" max="100">Loading...</progress>
      ) : (
        <table className="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Sections</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guidelines.map((g) => (
              <tr key={g.id}>
                <td>{g.title}</td>
                <td>{g.category?.name || '-'}</td>
                <td>{g.sections?.length || 0}</td>
                <td>
                  <span className={`tag ${g.status === 'published' ? 'is-success' : 'is-warning'}`}>
                    {g.status}
                  </span>
                </td>
                <td>
                  <div className="buttons">
                    {canWrite(profile?.role) && (
                      <>
                        <button className="button is-info is-small" onClick={() => openEdit(g)}>
                          <span className="icon"><i className="fas fa-edit"></i></span>
                        </button>
                        <button className="button is-danger is-small" onClick={() => handleDelete(g.id)}>
                          <span className="icon"><i className="fas fa-trash"></i></span>
                        </button>
                      </>
                    )}
                    <button className="button is-light is-small" onClick={() => setSelectedGuidelineId(g.id)}>
                      <span className="icon"><i className="fas fa-history"></i></span>
                      <span>History</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Editor Modal */}
      <div className={`modal ${showModal ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setShowModal(false)}></div>
        <div className="modal-card" style={{ width: '95%', maxWidth: '900px' }}>
          <header className="modal-card-head">
            <p className="modal-card-title">{editData ? 'Edit Guideline' : 'New Guideline'}</p>
            <button className="delete" aria-label="close" onClick={() => setShowModal(false)}></button>
          </header>
          <section className="modal-card-body">
            <GuidelineForm
              categories={categories}
              initialData={editData}
              onSave={handleSave}
              onCancel={() => setShowModal(false)}
              guidelineId={editData?.id || null}
            />
          </section>
        </div>
      </div>

      {/* Version History Modal */}
      {selectedGuidelineId && (
        <VersionsModal
          guidelineId={selectedGuidelineId}
          guidelineTitle={guidelines.find(g => g.id === selectedGuidelineId)?.title}
          onClose={() => setSelectedGuidelineId(null)}
          onRestore={handleRestoreVersion}
        />
      )}
    </>
  );
}
