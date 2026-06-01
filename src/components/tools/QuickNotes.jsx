import { useState, useEffect } from 'react';

const NOTES_KEY = 'sudanrx_admin_notes';

export default function QuickNotes() {
  const [note, setNote] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved) setNote(saved);
  }, []);

  const saveNote = (value) => {
    setNote(value);
    localStorage.setItem(NOTES_KEY, value);
  };

  return (
    <div className="card">
      <div className="card-header"><p className="card-header-title">Quick Notes</p></div>
      <div className="card-content">
        <textarea
          className="textarea"
          placeholder="Jot down ideas, to‑dos…"
          rows="8"
          value={note}
          onChange={e => saveNote(e.target.value)}
        ></textarea>
        <p className="help">Notes are saved locally in your browser.</p>
      </div>
    </div>
  );
}
