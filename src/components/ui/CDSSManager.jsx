import { useEffect, useState } from 'react';
import { fetchRules, createRule, updateRule, deleteRule } from '../../services/cdssService';
import CDSSFlowViewer from './CDSSFlowViewer';

const PARAMETERS = ['temperature', 'heart_rate', 'respiratory_rate', 'systolic_bp', 'diastolic_bp',
  'oxygen_saturation', 'age', 'rdt_result', 'blood_smear', 'hb', 'platelets', 'creatinine', 'gcs'];
const OPERATORS = ['>', '<', '>=', '<=', '==', '!=', 'contains'];

const emptyRule = () => ({
  name: '',
  description: '',
  condition: { parameter: 'temperature', operator: '>=', value: '' },
  action: { type: 'recommend', message: '' },
  priority: 0,
  status: 'active',
});

export default function CDSSManager({ guidelineId, onClose }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyRule());
  const [showFlow, setShowFlow] = useState(false);

  const load = async () => {
    try {
      const data = await fetchRules(guidelineId);
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [guidelineId]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, guideline_id: guidelineId };
      if (editId) {
        await updateRule(editId, payload);
      } else {
        await createRule(payload);
      }
      setEditId(null);
      setForm(emptyRule());
      load();
    } catch (err) {
      alert('Error saving rule: ' + err.message);
    }
  };

  const handleEdit = (rule) => {
    setEditId(rule.id);
    setForm({ name: rule.name, description: rule.description, condition: rule.condition, action: rule.action, priority: rule.priority, status: rule.status });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this rule?')) {
      await deleteRule(id);
      load();
    }
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{ width: '95%', maxWidth: '700px' }}>
        <header className="modal-card-head">
          <p className="modal-card-title">CDSS Rules Manager</p>
          <button className="delete" onClick={onClose}></button>
        </header>

        <section className="modal-card-body">
          <form onSubmit={handleSave} className="mb-5">
            <div className="field">
              <label className="label">Rule Name</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Description (optional)</label>
              <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="label">Parameter</label>
                  <div className="select is-fullwidth">
                    <select value={form.condition.parameter} onChange={e => setForm({ ...form, condition: { ...form.condition, parameter: e.target.value } })}>
                      {PARAMETERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="field">
                  <label className="label">Operator</label>
                  <div className="select is-fullwidth">
                    <select value={form.condition.operator} onChange={e => setForm({ ...form, condition: { ...form.condition, operator: e.target.value } })}>
                      {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="field">
                  <label className="label">Value</label>
                  <input className="input" type="text" value={form.condition.value} onChange={e => setForm({ ...form, condition: { ...form.condition, value: e.target.value } })} />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Action Message</label>
              <textarea className="textarea" rows="2" value={form.action.message} onChange={e => setForm({ ...form, action: { ...form.action, message: e.target.value } })} />
            </div>

            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="label">Priority</label>
                  <input className="input" type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="column">
                <div className="field">
                  <label className="label">Status</label>
                  <div className="select is-fullwidth">
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="button is-primary">{editId ? 'Update' : 'Add'} Rule</button>
            {editId && <button type="button" className="button ml-2" onClick={() => { setEditId(null); setForm(emptyRule()); }}>Cancel</button>}
          </form>

          {/* View Flowchart Button */}
          {rules.length > 0 && (
            <button className="button is-info is-outlined is-small mb-3" onClick={() => setShowFlow(true)}>
              <span className="icon"><i className="fas fa-project-diagram"></i></span>
              <span>View Flowchart</span>
            </button>
          )}

          {showFlow && (
            <div className="mb-5">
              <CDSSFlowViewer rules={rules} />
              <button className="button is-small mt-2" onClick={() => setShowFlow(false)}>Hide Flowchart</button>
            </div>
          )}

          {loading ? <progress className="progress is-primary" max="100">Loading...</progress> : (
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr><th>Name</th><th>Condition</th><th>Action</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.condition.parameter} {r.condition.operator} {r.condition.value}</td>
                    <td>{r.action.message?.substring(0, 40)}</td>
                    <td><span className={`tag ${r.status === 'active' ? 'is-success' : 'is-warning'}`}>{r.status}</span></td>
                    <td>
                      <div className="buttons">
                        <button className="button is-info is-small" onClick={() => handleEdit(r)}><i className="fas fa-edit"></i></button>
                        <button className="button is-danger is-small" onClick={() => handleDelete(r.id)}><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="modal-card-foot">
          <button className="button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
