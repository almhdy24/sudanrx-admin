import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import ImageUploader from './ImageUploader';
import AiAssistant from './AiAssistant';
import CDSSManager from './CDSSManager';
import { formatSectionContent, suggestCDSSRules } from '../../services/aiService';
import { createRule } from '../../services/cdssService';

const SECTION_TYPES = ['overview', 'diagnosis', 'management', 'complications', 'red_flags', 'dosing', 'references'];
const emptySection = () => ({ section_type: 'overview', title: '', content: '' });

export default function GuidelineForm({ categories, initialData, onSave, onCancel, guidelineId }) {
  const safeSections = initialData?.sections?.length
    ? initialData.sections.map(s => ({
        section_type: s.section_type || 'overview',
        title: s.title || '',
        content: s.content || '',
      }))
    : [emptySection()];

  const [title, setTitle] = useState(initialData?.title || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [sections, setSections] = useState(safeSections);
  const [showAI, setShowAI] = useState(false);
  const [showCDSS, setShowCDSS] = useState(false);
  const [formattingIdx, setFormattingIdx] = useState(null);
  const [suggestingRules, setSuggestingRules] = useState(false);
  const [suggestedRules, setSuggestedRules] = useState([]);
  const [selectedRules, setSelectedRules] = useState({});

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
  const insertAtEnd = (idx, text) => {
    const updated = [...sections];
    updated[idx].content = (updated[idx].content || '') + '\n' + text;
    setSections(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, category_id: categoryId, status, sections });
  };

  const handleAiInsert = (data) => {
    if (data.title) setTitle(data.title);
    const newSections = data.sections.map(s => ({
      section_type: s.section_type || 'overview',
      title: s.title || '',
      content: s.content || '',
    }));
    setSections(newSections);
  };

  const handleFormatSection = async (idx) => {
    const sec = sections[idx];
    if (!sec.content.trim()) return;
    setFormattingIdx(idx);
    try {
      const improved = await formatSectionContent(sec.section_type, sec.content);
      updateSection(idx, 'content', improved);
    } catch (err) {
      alert('Formatting failed: ' + err.message);
    } finally {
      setFormattingIdx(null);
    }
  };

  // AI Rule Suggestion
  const handleSuggestRules = async () => {
    setSuggestingRules(true);
    try {
      const rules = await suggestCDSSRules(sections);
      setSuggestedRules(rules);
      setSelectedRules({}); // reset selection
    } catch (err) {
      alert('Rule suggestion failed: ' + err.message);
    } finally {
      setSuggestingRules(false);
    }
  };

  const toggleRuleSelection = (idx) => {
    setSelectedRules(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const importSelectedRules = async () => {
    if (!guidelineId) {
      alert('Save the guideline first to assign an ID before importing rules.');
      return;
    }
    try {
      const toImport = suggestedRules.filter((_, idx) => selectedRules[idx]);
      for (const rule of toImport) {
        await createRule({ ...rule, guideline_id: guidelineId, status: 'active' });
      }
      alert(`${toImport.length} rules imported successfully.`);
      setSuggestedRules([]);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Title, Category, Status */}
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

      {/* AI Assist & CDSS buttons */}
      <div className="buttons">
        <button type="button" className="button is-info is-outlined" onClick={() => setShowAI(true)}>
          <span className="icon"><i className="fas fa-robot"></i></span>
          <span>AI Assist</span>
        </button>
        {guidelineId && (
          <button type="button" className="button is-warning is-outlined" onClick={() => setShowCDSS(true)}>
            <span className="icon"><i className="fas fa-microchip"></i></span>
            <span>CDSS Rules</span>
          </button>
        )}
        {sections.length > 0 && (
          <button
            type="button"
            className={`button is-success is-outlined ${suggestingRules ? 'is-loading' : ''}`}
            onClick={handleSuggestRules}
            disabled={suggestingRules}
          >
            <span className="icon"><i className="fas fa-lightbulb"></i></span>
            <span>Suggest Rules</span>
          </button>
        )}
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
                        <select value={sec.section_type} onChange={e => updateSection(idx, 'section_type', e.target.value)}>
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
                <button type="button" className={`button is-small is-warning ${formattingIdx === idx ? 'is-loading' : ''}`}
                  title="AI format this section" onClick={() => handleFormatSection(idx)} disabled={formattingIdx === idx || !sec.content.trim()}>
                  <span className="icon"><i className="fas fa-magic"></i></span>
                  <span>AI Format</span>
                </button>
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
              <input className="input" placeholder="e.g. Overview, First-line Treatment" value={sec.title}
                onChange={e => updateSection(idx, 'title', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="label">Content (Markdown)</label>
            <div className="control">
              <MDEditor value={sec.content} onChange={value => updateSection(idx, 'content', value || '')} height={300} />
            </div>
          </div>

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

      {/* AI Assistant Modal */}
      {showAI && <AiAssistant onInsert={handleAiInsert} onClose={() => setShowAI(false)} />}

      {/* CDSS Manager Modal */}
      {showCDSS && <CDSSManager guidelineId={guidelineId} onClose={() => setShowCDSS(false)} />}

      {/* Suggested Rules Import Modal */}
      {suggestedRules.length > 0 && (
        <div className="modal is-active">
          <div className="modal-background" onClick={() => setSuggestedRules([])}></div>
          <div className="modal-card" style={{ width: '90%', maxWidth: '600px' }}>
            <header className="modal-card-head">
              <p className="modal-card-title">Suggested CDSS Rules</p>
              <button className="delete" onClick={() => setSuggestedRules([])}></button>
            </header>
            <section className="modal-card-body">
              {suggestedRules.map((rule, idx) => (
                <div key={idx} className="box mb-2">
                  <label className="checkbox">
                    <input type="checkbox" checked={!!selectedRules[idx]} onChange={() => toggleRuleSelection(idx)} />
                    <strong>{rule.name}</strong>
                  </label>
                  <p className="is-size-7">Condition: {rule.condition?.parameter} {rule.condition?.operator} {rule.condition?.value}</p>
                  <p className="is-size-7">Action: {rule.action?.message}</p>
                </div>
              ))}
              <button className="button is-primary" onClick={importSelectedRules} disabled={!Object.values(selectedRules).some(Boolean)}>
                Import Selected Rules
              </button>
            </section>
          </div>
        </div>
      )}
    </form>
  );
}
