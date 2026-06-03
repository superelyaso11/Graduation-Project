import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  MapPin,
  Tag,
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import ImageUpload from '../components/ImageUpload';
import LocationDropdown from '../components/LocationDropdown';

const CATEGORIES = [
  { value: 'ELECTRONICS', label: 'Electronics', emoji: '💻' },
  { value: 'CLOTHING', label: 'Clothing', emoji: '👕' },
  { value: 'ACCESSORIES', label: 'Accessories', emoji: '🔑' },
  { value: 'STATIONERY', label: 'Stationery', emoji: '📚' },
  { value: 'ID_CARDS', label: 'ID Cards', emoji: '🪪' },
  { value: 'SPORTS', label: 'Sports', emoji: '⚽' },
  { value: 'OTHER', label: 'Other', emoji: '📦' },
];

const STEPS = [
  { id: 1, label: 'Item Details', icon: Tag },
  { id: 2, label: 'Location & Date', icon: MapPin },
  { id: 3, label: 'Description', icon: FileText },
];

const Field = ({ label, textSub, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label
      style={{
        color: textSub,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const ReportLost = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    dateLost: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Figma System Styling Tokens
  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
  const textSub = isDark ? '#475569' : '#94A3B8';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const cyanBg = isDark ? 'rgba(34,211,238,0.08)' : 'rgba(8,145,178,0.07)';
  const orange = isDark ? '#F97316' : '#EA580C';
  const btnGrad = isDark
    ? 'linear-gradient(135deg,#22D3EE,#0EA5E9)'
    : 'linear-gradient(135deg,#0891B2,#0369A1)';
  const btnText = isDark ? '#050709' : '#fff';
  const gridLine = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAnalysis = (analysis) => {
    if (!analysis) {
      setAiSuggestion(null);
      return;
    }
    setAiSuggestion(analysis);
    setFormData((p) => ({
      ...p,
      category: p.category || analysis.category,
      description: p.description || analysis.description,
    }));
  };

  const validateStep = () => {
    if (step === 1 && (!formData.title || !formData.category)) {
      setError('Title and category are required');
      return false;
    }
    if (step === 2 && (!formData.location || !formData.dateLost)) {
      setError('Location and date are required');
      return false;
    }
    if (step === 3 && !formData.description) {
      setError('Please add a description');
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setError('');
    setStep((s) => s + 1);
  };
  const back = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      await api.post('/lost-items', { ...formData, imageUrl });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: inputBg,
    border: `1px solid ${border}`,
    color: textPri,
    fontSize: 14,
  };
  const focusIn = (e) => (e.currentTarget.style.borderColor = `${cyan}60`);
  const focusOut = (e) => (e.currentTarget.style.borderColor = border);

  // Package theme styles to pass down safely as a configurations prop
  const themeStyles = {
    inputBg,
    border,
    textPri,
    textMut,
    cyan,
    isDark,
    cardBg,
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: bg,
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
        transition: 'background-color 0.3s',
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <main
          style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 1.5rem' }}
        >
          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              maxWidth: 900,
              margin: '1.25rem auto 0',
            }}
          >
            {/* Stepper Header banner */}
            <motion.div
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: heroBg,
                border: `1px solid ${border}`,
                minHeight: 100,
              }}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `linear-gradient(${gridLine} 1px,transparent 1px),linear-gradient(90deg,${gridLine} 1px,transparent 1px)`,
                  backgroundSize: '32px 32px',
                }}
              />
              <motion.div
                style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '8%',
                  width: 260,
                  height: 260,
                  background: `radial-gradient(circle,${isDark ? 'rgba(249,115,22,0.08)' : 'rgba(234,88,12,0.06)'} 0%,transparent 70%)`,
                  filter: 'blur(40px)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 7, repeat: Infinity }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '1.5rem 2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <AlertCircle size={13} style={{ color: orange }} />
                    <span
                      style={{
                        color: orange,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.07em',
                      }}
                    >
                      REPORT LOST ITEM
                    </span>
                  </div>
                  <h1
                    style={{
                      color: textPri,
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      margin: 0,
                    }}
                  >
                    What did you lose?
                  </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const done = step > s.id;
                    const active = step === s.id;
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.375rem 0.75rem',
                            borderRadius: 10,
                            backgroundColor: active
                              ? cyanBg
                              : done
                                ? 'rgba(16,185,129,0.1)'
                                : inputBg,
                            border: `1px solid ${active ? `${cyan}40` : done ? 'rgba(16,185,129,0.2)' : border}`,
                          }}
                        >
                          {done ? (
                            <CheckCircle2
                              size={13}
                              style={{ color: '#10B981' }}
                            />
                          ) : (
                            <Icon
                              size={13}
                              style={{ color: active ? cyan : textMut }}
                            />
                          )}
                          <span
                            style={{
                              color: active ? cyan : done ? '#10B981' : textMut,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            style={{
                              width: 16,
                              height: 1,
                              backgroundColor: border,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {success && (
                <motion.div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 0',
                    borderRadius: 20,
                    gap: '1rem',
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 size={48} style={{ color: '#10B981' }} />
                  </motion.div>
                  <div
                    style={{ color: textPri, fontSize: 20, fontWeight: 800 }}
                  >
                    Report Submitted!
                  </div>
                  <p style={{ color: textMut, fontSize: 14, margin: 0 }}>
                    We'll notify you immediately when a match is found.
                    Redirecting…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr',
                  gap: '1.25rem',
                }}
              >
                {/* Form main panel card layout */}
                <motion.div
                  style={{
                    borderRadius: 20,
                    padding: '1.75rem',
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                    transition: 'background-color 0.3s',
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.form
                      key={step}
                      onSubmit={
                        step === 3
                          ? handleSubmit
                          : (e) => {
                              e.preventDefault();
                              next();
                            }
                      }
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                      }}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div
                        style={{
                          color: textPri,
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {STEPS[step - 1].label}
                      </div>

                      {step === 1 && (
                        <>
                          <Field label="ITEM TITLE" textSub={textSub}>
                            <input
                              name="title"
                              type="text"
                              placeholder="e.g. Black Nike Backpack"
                              value={formData.title}
                              onChange={handleChange}
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 12,
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                ...inputStyle,
                              }}
                              onFocus={focusIn}
                              onBlur={focusOut}
                            />
                          </Field>

                          <Field label="CATEGORY" textSub={textSub}>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: 8,
                              }}
                            >
                              {CATEGORIES.map((cat) => (
                                <motion.button
                                  key={cat.value}
                                  type="button"
                                  onClick={() =>
                                    setFormData((p) => ({
                                      ...p,
                                      category: cat.value,
                                    }))
                                  }
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '0.625rem 0.25rem',
                                    borderRadius: 12,
                                    backgroundColor:
                                      formData.category === cat.value
                                        ? cyanBg
                                        : inputBg,
                                    border: `1px solid ${formData.category === cat.value ? `${cyan}40` : border}`,
                                    color:
                                      formData.category === cat.value
                                        ? cyan
                                        : textMut,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                >
                                  <span style={{ fontSize: 20 }}>
                                    {cat.emoji}
                                  </span>
                                  <span
                                    style={{ fontSize: 10, fontWeight: 600 }}
                                  >
                                    {cat.label}
                                  </span>
                                </motion.button>
                              ))}
                            </div>
                          </Field>

                          <Field
                            label={
                              <span>
                                IMAGE{' '}
                                <span
                                  style={{
                                    color: textSub,
                                    fontWeight: 400,
                                    textTransform: 'none',
                                    letterSpacing: 0,
                                  }}
                                >
                                  (optional)
                                </span>
                              </span>
                            }
                            textSub={textSub}
                          >
                            {/* Passed theme tokens down to maintain figma design */}
                            <ImageUpload
                              onUpload={(url) => setImageUrl(url)}
                              onAnalysis={handleAnalysis}
                              currentImage={imageUrl}
                              customStyles={themeStyles}
                            />
                          </Field>
                        </>
                      )}

                      {step === 2 && (
                        <>
                          <Field
                            label="WHERE DID YOU LOSE IT?"
                            textSub={textSub}
                          >
                            {/* Passed theme tokens down to fix old component styles */}
                            <LocationDropdown
                              value={formData.location}
                              onChange={(val) =>
                                setFormData((p) => ({ ...p, location: val }))
                              }
                              placeholder="Search campus locations..."
                              customStyles={themeStyles}
                            />
                          </Field>

                          <Field label="DATE LOST" textSub={textSub}>
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                cursor: 'pointer',
                              }}
                              onClick={(e) => {
                                const target =
                                  e.currentTarget.querySelector(
                                    'input[type="date"]'
                                  );
                                if (target) target.showPicker?.();
                              }}
                            >
                              <input
                                name="dateLost"
                                type="date"
                                max={today}
                                value={formData.dateLost}
                                onChange={handleChange}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  borderRadius: 12,
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  fontFamily: 'inherit',
                                  colorScheme: isDark ? 'dark' : 'light',
                                  pointerEvents: 'auto',
                                  cursor: 'pointer',
                                  ...inputStyle,
                                }}
                                onFocus={focusIn}
                                onBlur={focusOut}
                              />
                            </div>
                          </Field>
                        </>
                      )}

                      {step === 3 && (
                        <>
                          <Field label="DESCRIPTION" textSub={textSub}>
                            <textarea
                              name="description"
                              rows={5}
                              placeholder="Describe the item in detail — color, brand, size, any unique markings…"
                              value={formData.description}
                              onChange={handleChange}
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 12,
                                outline: 'none',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                ...inputStyle,
                              }}
                              onFocus={focusIn}
                              onBlur={focusOut}
                            />
                          </Field>
                          <div
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: 12,
                              backgroundColor: isDark
                                ? 'rgba(34,211,238,0.06)'
                                : 'rgba(8,145,178,0.06)',
                              border: `1px solid ${cyan}20`,
                            }}
                          >
                            <p
                              style={{
                                color: textMut,
                                fontSize: 12,
                                lineHeight: 1.6,
                                margin: 0,
                              }}
                            >
                              💡 <strong style={{ color: cyan }}>Tip:</strong>{' '}
                              Mention brand names, colors, stickers, or damage —
                              these dramatically improve match accuracy.
                            </p>
                          </div>
                        </>
                      )}

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '0.75rem 1rem',
                              borderRadius: 12,
                              backgroundColor: 'rgba(244,63,94,0.08)',
                              border: '1px solid rgba(244,63,94,0.2)',
                              color: '#F43F5E',
                            }}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <AlertCircle size={14} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {error}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          paddingTop: 4,
                        }}
                      >
                        {step > 1 && (
                          <motion.button
                            type="button"
                            onClick={back}
                            style={{
                              padding: '0.75rem 1.25rem',
                              borderRadius: 12,
                              backgroundColor: inputBg,
                              border: `1px solid ${border}`,
                              color: textMut,
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            Back
                          </motion.button>
                        )}
                        <motion.button
                          type="submit"
                          disabled={loading}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '0.75rem',
                            borderRadius: 12,
                            background: loading
                              ? isDark
                                ? '#1E293B'
                                : '#CBD5E1'
                              : btnGrad,
                            color: loading ? textMut : btnText,
                            fontSize: 14,
                            fontWeight: 700,
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                          whileHover={
                            loading ? {} : { opacity: 0.9, scale: 1.01 }
                          }
                          whileTap={loading ? {} : { scale: 0.98 }}
                        >
                          {loading ? (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              style={{
                                width: 16,
                                height: 16,
                                border: '2px solid currentColor',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                display: 'inline-block',
                              }}
                            />
                          ) : step < 3 ? (
                            <>
                              Next <ArrowRight size={15} />
                            </>
                          ) : (
                            <>
                              Submit Report <ArrowRight size={15} />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.form>
                  </AnimatePresence>
                </motion.div>

                {/* Right Design Sidebar Preview Panel */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {/* Live Card Preview Box */}
                  <motion.div
                    style={{
                      borderRadius: 20,
                      padding: '1.25rem',
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
                      transition: 'background-color 0.3s',
                    }}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18, duration: 0.45 }}
                  >
                    <div
                      style={{
                        color: textMut,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        marginBottom: 12,
                      }}
                    >
                      LIVE PREVIEW
                    </div>
                    <div
                      style={{
                        borderRadius: 12,
                        padding: '1rem',
                        backgroundColor: inputBg,
                        border: `1px solid ${border}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: `${orange}15`,
                            color: orange,
                          }}
                        >
                          {formData.category
                            ? CATEGORIES.find(
                                (c) => c.value === formData.category
                              )?.emoji +
                              ' ' +
                              CATEGORIES.find(
                                (c) => c.value === formData.category
                              )?.label
                            : 'Category'}
                        </span>
                        <span style={{ color: textSub, fontSize: 11 }}>
                          {formData.dateLost || 'Date lost'}
                        </span>
                      </div>
                      <div
                        style={{
                          color: textPri,
                          fontSize: 15,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {formData.title || (
                          <span style={{ color: textSub }}>Item title…</span>
                        )}
                      </div>
                      <p
                        style={{
                          color: textMut,
                          fontSize: 12,
                          lineHeight: 1.5,
                          marginBottom: 8,
                        }}
                      >
                        {formData.description || (
                          <span style={{ color: textSub }}>
                            Description will appear here…
                          </span>
                        )}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: textSub,
                          fontSize: 12,
                        }}
                      >
                        <MapPin size={11} />
                        {formData.location || 'Location not set'}
                      </div>
                    </div>
                  </motion.div>

                  {/* AI Suggestion Content Banner */}
                  <AnimatePresence>
                    {aiSuggestion && (
                      <motion.div
                        style={{
                          borderRadius: 20,
                          padding: '1.25rem',
                          backgroundColor: cardBg,
                          border: `1px solid ${cyan}25`,
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Sparkles size={14} style={{ color: cyan }} />
                            <span
                              style={{
                                color: cyan,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              AI SUGGESTION
                            </span>
                          </div>
                          <motion.button
                            onClick={() => setAiSuggestion(null)}
                            whileHover={{ scale: 1.1 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: textMut,
                              cursor: 'pointer',
                            }}
                          >
                            <X size={14} />
                          </motion.button>
                        </div>
                        <p
                          style={{
                            color: textMut,
                            fontSize: 13,
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          Category auto-set to{' '}
                          <strong style={{ color: textPri }}>
                            {CATEGORIES.find(
                              (c) => c.value === aiSuggestion.category
                            )?.label || aiSuggestion.category}
                          </strong>
                          . Description pre-filled from image analysis.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tips Box */}
                  <motion.div
                    style={{
                      borderRadius: 20,
                      padding: '1.25rem',
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
                      transition: 'background-color 0.3s',
                    }}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.45 }}
                  >
                    <div
                      style={{
                        color: textMut,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        marginBottom: 12,
                      }}
                    >
                      TIPS FOR A FASTER MATCH
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {[
                        {
                          icon: '🎯',
                          text: 'Be specific about colours, brands and sizes',
                        },
                        {
                          icon: '📍',
                          text: 'Narrow the location as much as possible',
                        },
                        {
                          icon: '📅',
                          text: 'Provide the exact or closest date',
                        },
                        {
                          icon: '🖼️',
                          text: 'Adding an image greatly improves match rate',
                        },
                      ].map((tip) => (
                        <div
                          key={tip.text}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{tip.icon}</span>
                          <span
                            style={{
                              color: textMut,
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            {tip.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportLost;
