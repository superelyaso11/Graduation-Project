import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = isDark ? '#050709' : '#F0F4F8';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? '#080C14' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const focusBorder = isDark ? 'rgba(34,211,238,0.5)' : 'rgba(8,145,178,0.5)';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textMuted = isDark ? '#64748B' : '#64748B';
  const textSubtle = isDark ? '#64748B' : '#94A3B8';
  const gridLine = isDark ? 'rgba(34,211,238,0.03)' : 'rgba(8,145,178,0.05)';
  const glow1 = isDark ? 'rgba(34,211,238,0.08)' : 'rgba(8,145,178,0.08)';
  const glow2 = isDark ? 'rgba(249,115,22,0.07)' : 'rgba(234,88,12,0.06)';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const btnGrad = isDark
    ? 'linear-gradient(135deg,#22D3EE,#0EA5E9)'
    : 'linear-gradient(135deg,#0891B2,#0369A1)';
  const btnText = isDark ? '#050709' : '#fff';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('All fields are required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      const { data } = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: bg,
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
        transition: 'background-color 0.3s',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${gridLine} 1px,transparent 1px),linear-gradient(90deg,${gridLine} 1px,transparent 1px)`,
          backgroundSize: '56px 56px',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '10%',
          width: 500,
          height: 500,
          background: `radial-gradient(circle,${glow1} 0%,transparent 65%)`,
          filter: 'blur(60px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-5%',
          left: '5%',
          width: 400,
          height: 400,
          background: `radial-gradient(circle,${glow2} 0%,transparent 65%)`,
          filter: 'blur(60px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      <motion.div
        style={{
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          style={{
            borderRadius: 20,
            padding: '2rem',
            backgroundColor: cardBg,
            border: `1px solid ${border}`,
            boxShadow: isDark
              ? '0 24px 80px rgba(0,0,0,0.6)'
              : '0 16px 60px rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: btnGrad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M2 14C4.5 12 9 13 9 13C9 13 13.5 12 16 14V4C13.5 2 9 3 9 3C9 3 4.5 2 2 4V14Z"
                    stroke={btnText}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M9 3V13" stroke={btnText} strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    color: textPrimary,
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                  }}
                >
                  Create your account
                </div>
                <div style={{ color: textMuted, fontSize: 13 }}>
                  Join your campus lost & found network
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '0.4rem',
                cursor: 'pointer',
                color: textMuted,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#FCA5A5',
                fontSize: 14,
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <label
                style={{
                  color: textSubtle,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                FULL NAME
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  backgroundColor: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = focusBorder)}
                onBlur={(e) => (e.target.style.borderColor = inputBorder)}
              />
            </motion.div>

            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <label
                style={{
                  color: textSubtle,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  backgroundColor: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = focusBorder)}
                onBlur={(e) => (e.target.style.borderColor = inputBorder)}
              />
            </motion.div>

            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <label
                style={{
                  color: textSubtle,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                PASSWORD
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    borderRadius: 12,
                    backgroundColor: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: textPrimary,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = focusBorder)}
                  onBlur={(e) => (e.target.style.borderColor = inputBorder)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: textMuted,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <label
                style={{
                  color: textSubtle,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  backgroundColor: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = focusBorder)}
                onBlur={(e) => (e.target.style.borderColor = inputBorder)}
              />
            </motion.div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <motion.button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem',
                  borderRadius: 12,
                  background: btnGrad,
                  color: btnText,
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: 'inherit',
                  marginTop: 4,
                }}
                whileHover={{ opacity: 0.9, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {loading ? 'Creating account...' : 'Create account'}{' '}
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          </form>

          <motion.p
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            style={{
              color: textMuted,
              fontSize: 13,
              marginTop: '1.25rem',
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: cyan, fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
