import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';  // added
import { fetchGuidelines, createGuideline, updateGuideline, deleteGuideline } from '../services/guidelineService';
import { fetchCategories } from '../services/categoryService';
import GuidelineForm from '../components/ui/GuidelineForm';
import VersionsModal from '../components/ui/VersionsModal';
import { useAuth } from '../hooks/useAuth';

const canWrite = (role) => role === 'contributor' || role === 'admin' || role === 'editor';
const PAGE_SIZE = 10;

export default function Guidelines() {
  const [guidelines, setGuidelines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState(null);
  const { profile, session } = useAuth();

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const loadGuidelines = async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchGuidelines({
        search,
        categoryId: filterCat || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setGuidelines(data);
      setTotalCount(count);
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
  useEffect(() => { setPage(1); }, [search, filterCat]);
  useEffect(() => { loadGuidelines(); }, [page, search, filterCat]);

  const openCreate = () => {
    if (!canWrite(profile?.role)) return;
    setEditData(null);
    setShowModal(true);
  };

  const openEdit = (guideline) => {
    if (!canWrite(profile?.role)) return;
    const cleanGuideline = {
      id: guideline.id,
      title: guideline.title || '',
      category_id: guideline.category_id || '',
      status: guideline.status || 'draft',
      sections: (guideline.sections || []).map(s => ({
        section_type: s.section_type || 'overview',
        title: s.title || '',
        content: s.content || '',
      })),
    };
    setEditData(cleanGuideline);
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
    try {
      await updateGuideline(version.guideline_id, {
        title: version.title,
        category_id: version.category_id,
        status: version.status,
        sections: version.sections,
      }, session.user.id);
      setSelectedGuidelineId(null);
      loadGuidelines();
    } catch (err) {
      alert('Restore failed: ' + err.message);
    }
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i}>
          <button
            className={`pagination-link ${i === page ? 'is-current' : ''}`}
            aria-label={`Page ${i}`}
            onClick={() => goToPage(i)}
          >
            {i}
          </button>
        </li>
      );
    }
    return pages;
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
        <>
          {/* Desktop table */}
          <div className="is-hidden-mobile">
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
                        <Link to={`/guidelines/${g.id}`} className="button is-small is-primary">
                          <span className="icon"><i className="fas fa-eye"></i></span>
                          <span>View</span>
                        </Link>
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
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="is-hidden-tablet">
            {guidelines.map((g) => (
              <div key={g.id} className="card mb-3">
                <div className="card-content">
                  <p className="title is-5">{g.title}</p>
                  <p className="subtitle is-6">
                    <span className="tag is-info is-light">{g.category?.name || 'No category'}</span>
                    <span className={`tag ml-2 ${g.status === 'published' ? 'is-success' : 'is-warning'}`}>
                      {g.status}
                    </span>
                  </p>
                  <p><strong>Sections:</strong> {g.sections?.length || 0}</p>
                  <div className="buttons mt-3">
                    <Link to={`/guidelines/${g.id}`} className="button is-small is-primary">
                      <span className="icon"><i className="fas fa-eye"></i></span>
                      <span>View</span>
                    </Link>
                    {canWrite(profile?.role) && (
                      <>
                        <button className="button is-info is-small" onClick={() => openEdit(g)}>
                          <span className="icon"><i className="fas fa-edit"></i></span> <span>Edit</span>
                        </button>
                        <button className="button is-danger is-small" onClick={() => handleDelete(g.id)}>
                          <span className="icon"><i className="fas fa-trash"></i></span> <span>Delete</span>
                        </button>
                      </>
                    )}
                    <button className="button is-light is-small" onClick={() => setSelectedGuidelineId(g.id)}>
                      <span className="icon"><i className="fas fa-history"></i></span> <span>History</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="pagination is-centered mt-4" role="navigation" aria-label="pagination">
              <button
                className="pagination-previous"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >Previous</button>
              <button
                className="pagination-next"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >Next</button>
              <ul className="pagination-list">
                {renderPageNumbers()}
              </ul>
            </nav>
          )}

          <p className="has-text-centered mt-2">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} guidelines
          </p>
        </>
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
              key={editData ? editData.id : 'new'}
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
