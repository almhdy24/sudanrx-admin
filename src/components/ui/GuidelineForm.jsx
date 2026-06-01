import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import ImageUploader from './ImageUploader';

const SECTION_TYPES = ['overview', 'diagnosis', 'management', 'complications', 'red_flags', 'dosing', 'references'];

const emptySection = () => ({ section_type: 'overview', title: '', content: '' });

export default function GuidelineForm({ categories, initialData, onSave, onCancel, guidelineId }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [sections, setSections] = useState(
    initialData?.sections?.length
      ? initialData.sections.map(s => ({
          section_type: s.section_type,
          title: s.title || '',
          content: s.content || '',
        }))
      : [emptySection()]
  );

  const addSection = () => setSections([...sections, emptySection()]);
  const removeSection = (idx) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== idx));
  };
  const updateSection = (idx, field, value) => {
    const updated = [...sections];
    updated[idx][field] = value;
    setSections(updated);
  };
  const moveSection = (idx, direction) => {
    const newSections = [...sections];
    const [moved] = newSections.splice(idx, 1);
    newSections.splice(idx + direction, 0, moved);
    setSections(newSections);
  };

  // Insert text (e.g., Markdown image) at end of content
  const insertAtEnd = (idx, text) => {
    const updated = [...sections];
    updated[idx].content = (updated[idx].content || '') + '\n' + text;
    setSections(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, category_id: categoryId, status, sections });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Title, Category, Status fields (same as before) */}
      <div className="field">
        <label className="label">Title</label>
        <div className="control">
          <input className="input" required value={title} onChange={e => setTitle(e.target.value)} />
        </div>
      </div>

      <div className="columns">
        <div className="column">
          <div className="field">
            <label className="label">Category</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label className="label">Status</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr />
      <div className="level">
        <div className="level-left">
          <h4 className="title is-5 mb-2">Content Sections</h4>
        </div>
        <div className="level-right">
          <button type="button" className="button is-primary is-small" onClick={addSection}>
            <span className="icon"><i className="fas fa-plus"></i></span>
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {sections.map((sec, idx) => (
        <div key={idx} className="box mb-4">
          <div className="level mb-2">
            <div className="level-left">
              <div className="field is-horizontal mb-0">
                <div className="field-label is-normal">
                  <label className="label">Type</label>
                </div>
                <div className="field-body">
                  <div className="field">
                    <div className="control">
                      <div className="select">
                        <select
                          value={sec.section_type}
                          onChange={e => updateSection(idx, 'section_type', e.target.value)}
                        >
                          {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="custom">custom</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="level-right">
              <div className="buttons">
                <button type="button" className="button is-small" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                  <span className="icon"><i className="fas fa-arrow-up"></i></span>
                </button>
                <button type="button" className="button is-small" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>
                  <span className="icon"><i className="fas fa-arrow-down"></i></span>
                </button>
                <button type="button" className="button is-small is-danger" onClick={() => removeSection(idx)} disabled={sections.length <= 1}>
                  <span className="icon"><i className="fas fa-trash"></i></span>
                </button>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="label">Section Title (optional)</label>
            <div className="control">
              <input
                className="input"
                placeholder="e.g. Overview, First-line Treatment"
                value={sec.title}
                onChange={e => updateSection(idx, 'title', e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Content (Markdown)</label>
            <div className="control">
              <MDEditor
                value={sec.content}
                onChange={value => updateSection(idx, 'content', value || '')}
                height={300}
              />
            </div>
          </div>

          {/* Image upload for this section */}
          <ImageUploader onInsert={(markdown) => insertAtEnd(idx, markdown)} guidelineId={guidelineId} />
        </div>
      ))}

      <div className="field is-grouped mt-4">
        <div className="control">
          <button type="submit" className="button is-success">
            <span className="icon"><i className="fas fa-save"></i></span>
            <span>Save Guideline</span>
          </button>
        </div>
        <div className="control">
          <button type="button" className="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </form>
  );
}
