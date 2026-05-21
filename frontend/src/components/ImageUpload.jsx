import { useState } from 'react';
import api from '../api/axios';

const ImageUpload = ({ onUpload, onAnalysis, currentImage }) => {
  const [preview, setPreview] = useState(currentImage || null); //image preview URL
  const [uploading, setUploading] = useState(false); //upload loading state
  const [analyzing, setAnalyzing] = useState(false); //analysis state
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    //validate file size on frontend too
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setPreview(URL.createObjectURL(file)); //show local preview immediately
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file); //attach file to form data

      //step 1 - upload image to cloudinary
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, //required for file upload
      });

      onUpload(data.url); //pass cloudinary image URL to parent
      setUploading(false);

      //step 2 - analyze with Gemini if onAnalysis callback provided
      if (onAnalysis) {
        setAnalyzing(true);
        try {
          const { data: analysis } = await api.post('/upload/analyze', {
            imageUrl: data.url, //send cloudinary URL for analysis
          });

          if (analysis.success) {
            onAnalysis(analysis); //pass suggestions to parent
          }
        } catch (err) {
          console.error('Analysis failed:', err); //fail silently
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      setPreview(null);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (onAnalysis) onAnalysis(null); //clear suggestions
  };

  return (
    <div style={s.wrap}>
      {/* Show preview if image selected */}
      {preview ? (
        <div style={s.previewWrap}>
          <img src={preview} alt="Preview" style={s.preview} />

          {/* Show analyzing overlay on top of preview */}
          {analyzing && (
            <div style={s.analyzingOverlay}>
              <span style={s.analyzingIcon}>🤖</span>
              <p style={s.analyzingText}>AI is analyzing your image...</p>
            </div>
          )}
          <button type="button" style={s.removeBtn} onClick={handleRemove}>
            ✕ Remove
          </button>
        </div>
      ) : (
        // Upload area
        <label style={s.uploadArea}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={s.hiddenInput} // hide default file input
            disabled={uploading}
          />
          <div style={s.uploadContent}>
            {uploading ? (
              <>
                <span style={s.uploadIcon}>⏳</span>
                <p style={s.uploadText}>Uploading...</p>
              </>
            ) : (
              <>
                <span style={s.uploadIcon}>📷</span>
                <p style={s.uploadText}>Click to upload an image</p>
                <p style={s.uploadSubtext}>JPG, PNG, WEBP up to 5MB</p>
              </>
            )}
          </div>
        </label>
      )}

      {/* Error message */}
      {error && <p style={s.error}>⚠️ {error}</p>}
    </div>
  );
};

const s = {
  wrap: { width: '100%' },
  previewWrap: { position: 'relative', width: '100%' },
  preview: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '1px solid #334155',
  },
  analyzingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  analyzingIcon: { fontSize: '2rem' },
  analyzingText: { fontSize: '0.875rem', color: '#F8FAFC', fontWeight: '500' },
  removeBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.3rem 0.6rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '140px',
    border: '2px dashed #334155',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    backgroundColor: '#0D1B2E',
    boxSizing: 'border-box',
  },
  hiddenInput: { display: 'none' },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1.5rem',
  },
  uploadIcon: { fontSize: '2rem' },
  uploadText: {
    fontSize: '0.9rem',
    color: '#F8FAFC',
    fontWeight: '500',
    margin: 0,
  },
  uploadSubtext: { fontSize: '0.775rem', color: '#94A3B8', margin: 0 },
  error: { color: '#FCA5A5', fontSize: '0.8rem', marginTop: '0.5rem' },
};

export default ImageUpload;
