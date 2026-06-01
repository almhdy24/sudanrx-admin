import { useEffect, useState } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCategory(newName);
    setNewName('');
    load();
  };

  const handleUpdate = async (id) => {
    await updateCategory(id, editName);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category?')) {
      await deleteCategory(id);
      load();
    }
  };

  return (
    <>
      <h1 className="title">Categories</h1>

      <form onSubmit={handleCreate} className="field has-addons mb-5">
        <div className="control is-expanded">
          <input
            className="input"
            type="text"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </div>
        <div className="control">
          <button className="button is-primary">
            <span className="icon"><i className="fas fa-plus"></i></span>
            <span>Add</span>
          </button>
        </div>
      </form>

      {loading ? (
        <progress className="progress is-primary" max="100">Loading...</progress>
      ) : (
        <table className="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>
                  {editing === cat.id ? (
                    <input
                      className="input is-small"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td>
                  {editing === cat.id ? (
                    <div className="buttons">
                      <button className="button is-success is-small" onClick={() => handleUpdate(cat.id)}>
                        <span className="icon"><i className="fas fa-save"></i></span>
                      </button>
                      <button className="button is-light is-small" onClick={() => setEditing(null)}>
                        <span className="icon"><i className="fas fa-times"></i></span>
                      </button>
                    </div>
                  ) : (
                    <div className="buttons">
                      <button className="button is-info is-small" onClick={() => { setEditing(cat.id); setEditName(cat.name); }}>
                        <span className="icon"><i className="fas fa-edit"></i></span>
                      </button>
                      <button className="button is-danger is-small" onClick={() => handleDelete(cat.id)}>
                        <span className="icon"><i className="fas fa-trash"></i></span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
