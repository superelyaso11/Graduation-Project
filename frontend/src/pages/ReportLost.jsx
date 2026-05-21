import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import LocationDropdown from '../components/LocationDropdown';
import CategoryDropdown from '../components/CategoryDropdown';
import ImageUpload from '../components/ImageUpload';

const ReportLost = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    dateLost: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [imageUrl, setImageUrl] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null); //store AI suggestions

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.location ||
      !formData.dateLost
    ) {
      setError('All fields except image are required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    try {
      await api.post('/lost-items', { ...formData, imageUrl }); //send to backend
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500); //redirect after 1.5s
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = (analysis) => {
    if (!analysis) {
      setAiSuggestion(null);
      return;
    }
    setAiSuggestion(analysis); //store suggestions

    //auto-fill category and description if empty
    setFormData((prev) => ({
      ...prev,
      category: prev.category || analysis.category, //only fill if not already set
      description: prev.description || analysis.description,
    }));
  };

  const focusStyle = (e) => (e.target.style.borderColor = '#2563EB');
  const blurStyle = (e) => (e.target.style.borderColor = '#334155');

  return (
    <div style={s.layout}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main style={s.main}>
        <Navbar
          title="Report Lost Item"
          subtitle="Fill in the details of the item you lost"
        />

        <div style={s.formWrap}>
          <div style={s.card}>
            {/* Success message */}
            {success && (
              <div style={s.successBox}>
                ✅ Report submitted successfully! Redirecting to dashboard...
              </div>
            )}

            {/* Error message */}
            {error && <div style={s.errorBox}>⚠️ {error}</div>}

            <form onSubmit={handleSubmit} style={s.form}>
              {/* Title */}
              <div style={s.field}>
                <label style={s.label}>Item Title</label>
                <input
                  style={s.input}
                  type="text"
                  name="title"
                  placeholder="e.g. Black Nike Backpack"
                  value={formData.title}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Category + Location row */}
              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Category</label>
                  <CategoryDropdown
                    value={formData.category}
                    onChange={(val) =>
                      setFormData({ ...formData, category: val })
                    }
                    placeholder="Select a category"
                  />
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Location Lost</label>
                  <LocationDropdown
                    value={formData.location}
                    onChange={(val) =>
                      setFormData({ ...formData, location: val })
                    }
                    placeholder="Search campus locations..."
                  />
                </div>
              </div>

              {/* Date Lost */}
              <div style={s.field}>
                <label style={s.label}>Date Lost</label>
                <input
                  style={s.input}
                  type="date"
                  name="dateLost"
                  max={today}
                  value={formData.dateLost}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Description */}
              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea
                  style={{ ...s.input, height: '100px', resize: 'vertical' }}
                  name="description"
                  placeholder="Describe the item in detail — color, brand, any unique features..."
                  value={formData.description}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Image Upload */}
              <div style={s.field}>
                <label style={s.label}>
                  Image URL{' '}
                  <span style={{ color: '#94A3B8', fontWeight: '400' }}>
                    (optional)
                  </span>
                </label>
                <ImageUpload
                  onUpload={(url) => setImageUrl(url)} //called when upload completes
                  onAnalysis={handleAnalysis}
                  currentImage={imageUrl}
                />
              </div>

              {/* AI suggestion banner */}
              {aiSuggestion && (
                <div style={s.aiBanner}>
                  <span style={s.aiIcon}>🤖</span>
                  <div style={s.aiContent}>
                    <p style={s.aiTitle}>AI Suggestion</p>
                    <p style={s.aiText}>
                      Category: <strong>{aiSuggestion.category}</strong> ·
                      Description pre-filled based on your image
                    </p>
                  </div>
                  <button
                    type="button"
                    style={s.aiDismiss}
                    onClick={() => setAiSuggestion(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div style={s.btnRow}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={
                    loading
                      ? { ...s.submitBtn, opacity: 0.6, cursor: 'not-allowed' }
                      : s.submitBtn
                  }
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.backgroundColor = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.backgroundColor = '#2563EB';
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

const s = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0F172A' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  formWrap: { padding: '2rem', maxWidth: '700px', width: '100%' },
  card: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '2rem',
  },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#6EE7B7',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#FCA5A5',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  row: { display: 'flex', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: '500', color: '#F8FAFC' },
  input: {
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#F8FAFC',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Sora, sans-serif',
    position: 'relative',
  },
  btnRow: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#94A3B8',
    borderRadius: '10px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'Sora, sans-serif',
  },
  aiBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(37,99,235,0.1)',
    border: '1px solid rgba(37,99,235,0.3)',
    borderRadius: '10px',
    padding: '0.875rem 1rem',
  },
  aiIcon: { fontSize: '1.25rem', flexShrink: 0 },
  aiContent: { flex: 1 },
  aiTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#60A5FA',
    marginBottom: '0.2rem',
  },
  aiText: { fontSize: '0.8rem', color: '#94A3B8' },
  aiDismiss: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
};

export default ReportLost;
