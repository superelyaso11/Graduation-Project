import { use, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'CLOTHING', label: 'Clothing & Bags' },
  { value: 'ACCESSORIES', label: 'Accessories' },
  { value: 'STATIONERY', label: 'Stationary' },
  { value: 'ID_CARDS', label: 'ID Cards' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'OTHER', label: 'Others' },
];

const ReportFound = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    dateFound: '',
    imageUrl: '',
    heldAt: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.location ||
      !formData.dateFound
    ) {
      setError('All fields except image and held at are required');
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
      await api.post('/found-items', formData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report found item');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e) => (e.target.style.borderColor = '#2563EB');
  const blurStyle = (e) => (e.target.style.borderColor = '#334155');

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <Navbar
          title="Report Found Item"
          subtitle="Fill in the details of the item you found"
        />

        <div style={s.formWrap}>
          <div style={s.card}>
            {success && (
              <div style={s.successBox}>
                ✅ Report submitted! We will notify you if a match is found.
                Redirecting...
              </div>
            )}

            {error && <div style={s.errorBox}>⚠️ {error}</div>}

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Item Title</label>
                <input
                  style={s.input}
                  type="text"
                  name="title"
                  placeholder="e.g. Blue Water Bottle"
                  value={formData.title}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Category</label>
                  <select
                    style={{ ...s.input, cursor: 'pointer' }}
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Location Found</label>
                  <input
                    style={s.input}
                    type="text"
                    name="location"
                    placeholder="e.g. Cafeteria, 2nd Floor"
                    value={formData.location}
                    onChange={handleChange}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
              </div>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Date Found</label>
                  <input
                    style={s.input}
                    type="date"
                    name="dateFound"
                    value={formData.dateFound}
                    onChange={handleChange}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>
                    Currently Held At{' '}
                    <span style={{ color: '#94A3B8', fontWeight: '400' }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    style={s.input}
                    type="text"
                    name="heldAt"
                    placeholder="e.g. Security Office, I have it with me"
                    value={formData.heldAt}
                    onChange={handleChange}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea
                  style={{ ...s.input, height: '100px', resize: 'vertical' }}
                  name="description"
                  placeholder="Describe the item — color, brand, any unique features..."
                  value={formData.description}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>
                  Image URL{' '}
                  <span style={{ color: '#94A3B8', fontWeight: '400' }}>
                    (optional)
                  </span>
                </label>
                <input
                  style={s.input}
                  type="text"
                  name="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

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
};

export default ReportFound;
