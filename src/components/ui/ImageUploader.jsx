import { useState } from 'react';
import { uploadImage } from '../../services/imageService';
import { useAuth } from '../../hooks/useAuth';

export default function ImageUploader({ onInsert, guidelineId }) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const publicUrl = await uploadImage(file, session.user.id, guidelineId);
      // Insert Markdown image syntax into editor
      const markdown = `![${file.name}](${publicUrl})`;
      onInsert(markdown);
      e.target.value = ''; // reset input
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="field">
      <div className="file is-small">
        <label className="file-label">
          <input
            className="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <span className="file-cta">
            <span className="file-icon">
              <i className="fas fa-upload"></i>
            </span>
            <span className="file-label">
              {uploading ? 'Uploading...' : 'Upload image'}
            </span>
          </span>
        </label>
      </div>
      {error && <p className="help is-danger">{error}</p>}
      <p className="help">Accepted: JPG, PNG, GIF. Max 5MB.</p>
    </div>
  );
}
