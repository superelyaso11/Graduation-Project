import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  //form state
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // theme tokens
  const bg = isDark ? '#050709' : '#F0F4F8';
  const panelBg = isDark ? '#080C14' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? '#0C1118' : '#F8FAFC';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const focusBorder = isDark ? 'rgba(34,211,238,0.5)' : 'rgba(8,145,178,0.5)';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textMuted = isDark ? '#64748B' : '#64748B';
  const textSubtle = isDark ? '#334155' : '#94A3B8';
  const gridLine = isDark ? 'rgba(34,211,238,0.04)' : 'rgba(8,145,178,0.06)';
  const glow1 = isDark ? 'rgba(34,211,238,0.18)' : 'rgba(8,145,178,0.12)';
  const glow2 = isDark ? 'rgba(249,115,22,0.14)' : 'rgba(234,88,12,0.1)';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const btnGrad = isDark
    ? 'linear-gradient(135deg,#22D3EE,#0EA5E9)'
    : 'linear-gradient(135deg,#0891B2,#0369A1)';
  const btnText = isDark ? '#050709' : '#fff';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email');
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
      const { data } = await api.post('/auth/login', formData);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const liveCards = [
    {
      icon: '✅',
      title: 'Match confirmed',
      sub: 'Black backpack · Engineering A',
      time: '2m ago',
      accent: '#10B981',
    },
    {
      icon: '🔍',
      title: 'New item found',
      sub: 'AirPods case · Library lobby',
      time: '11m ago',
      accent: '#22D3EE',
    },
    {
      icon: '📦',
      title: 'Item claimed',
      sub: 'Student ID card · Security desk',
      time: '34m ago',
      accent: '#A78BFA',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: bg,
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
        transition: 'background-color 0.3s',
      }}
    >
      {/* Left art panel */}
      <motion.div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: panelBg,
        }}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${gridLine} 1px,transparent 1px),linear-gradient(90deg,${gridLine} 1px,transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glows */}
        <motion.div
          style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: 360,
            height: 360,
            background: `radial-gradient(circle,${glow1} 0%,transparent 70%)`,
            filter: 'blur(40px)',
            borderRadius: '50%',
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: 280,
            height: 280,
            background: `radial-gradient(circle,${glow2} 0%,transparent 70%)`,
            filter: 'blur(40px)',
            borderRadius: '50%',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '3rem',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
              <span
                style={{
                  color: textPrimary,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                UniFind
              </span>
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

          <div>
            {/* Badge */}
            <motion.div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                borderRadius: 999,
                backgroundColor: `${cyan}18`,
                border: `1px solid ${cyan}30`,
                marginBottom: '1.5rem',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: cyan,
                  display: 'inline-block',
                }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span
                style={{
                  color: cyan,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                CAMPUS LOST & FOUND
              </span>
            </motion.div>

            <motion.h2
              style={{
                color: textPrimary,
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                maxWidth: 380,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.35,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              Reconnect lost items with their owners.
            </motion.h2>
            <motion.p
              style={{
                color: textMuted,
                fontSize: 16,
                marginTop: 16,
                lineHeight: 1.6,
                maxWidth: 340,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              A smarter way for students and staff to report, track, and recover
              belongings across campus.
            </motion.p>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                marginTop: '2rem',
                marginBottom: '2.5rem',
              }}
            >
              {[
                { value: '2,400+', label: 'Items recovered' },
                { value: '98%', label: 'Match rate' },
                { value: '< 24h', label: 'Avg. response' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.08 }}
                >
                  <div
                    style={{
                      color: cyan,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live cards */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxWidth: 360,
              }}
            >
              {liveCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 12,
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                    backdropFilter: 'blur(12px)',
                  }}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.65 + i * 0.1,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ x: 4 }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: textPrimary,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {card.title}
                    </div>
                    <div style={{ color: textMuted, fontSize: 12 }}>
                      {card.sub}
                    </div>
                  </div>
                  <span style={{ color: textMuted, fontSize: 11 }}>
                    {card.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right form panel */}
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: 480,
          flexShrink: 0,
          padding: '3rem 2rem',
          borderLeft: `1px solid ${border}`,
        }}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            style={{
              color: textPrimary,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            Welcome back
          </motion.h1>
          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            style={{ color: textMuted, fontSize: 14, marginTop: 8 }}
          >
            Sign in to your account to continue.
          </motion.p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '1.25rem',
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
            style={{
              marginTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
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
                  marginTop: 8,
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
                PASSWORD
              </label>
              <div style={{ position: 'relative', marginTop: 8 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••"
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
                }}
                whileHover={{ opacity: 0.9, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={16} />
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
              fontSize: 14,
              marginTop: '1.5rem',
              textAlign: 'center',
            }}
          >
            No account yet?{' '}
            <Link
              to="/register"
              style={{ color: cyan, fontWeight: 600, textDecoration: 'none' }}
            >
              Create one
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
