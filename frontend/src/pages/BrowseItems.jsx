import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Clock,
  X,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import ReputationBadge from '../components/ReputationBadge';

const CATEGORIES = [
  { value: '', label: 'All', emoji: '✨' },
  { value: 'ELECTRONICS', label: 'Electronics', emoji: '💻' },
  { value: 'CLOTHING', label: 'Clothing', emoji: '👕' },
  { value: 'ACCESSORIES', label: 'Accessories', emoji: '🔑' },
  { value: 'STATIONERY', label: 'Stationery', emoji: '📚' },
  { value: 'ID_CARDS', label: 'ID Cards', emoji: '🪪' },
  { value: 'SPORTS', label: 'Sports', emoji: '⚽' },
  { value: 'OTHER', label: 'Other', emoji: '📦' },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const BrowseItems = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { socket } = useSocket();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    location: '',
    dateFound: '',
    heldAt: '',
  });
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const today = new Date().toISOString().split('T')[0];

  // Figma Style Tokens
  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const modalBg = isDark ? '#0C1118' : '#FFFFFF';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
  const textSub = isDark ? '#475569' : '#94A3B8';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const cyanBg = isDark ? 'rgba(34,211,238,0.1)' : 'rgba(8,145,178,0.1)';
  const btnGrad = isDark
    ? 'linear-gradient(135deg,#22D3EE,#0EA5E9)'
    : 'linear-gradient(135deg,#0891B2,#0369A1)';
  const btnText = isDark ? '#050709' : '#fff';
  const gridLine = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      const { data } = await api.get('/lost-items', { params });
      setItems(data.filter((item) => item.status === 'ACTIVE'));
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchItems();
    socket.on('new_notification', handler);
    return () => socket.off('new_notification', handler);
  }, [socket, fetchItems]);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const openModal = (item) => {
    setSelectedItem(item);
    setModalData({ location: '', dateFound: '', heldAt: '' });
    setModalError('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalData.location || !modalData.dateFound) {
      setModalError('Location and date are required');
      return;
    }
    setModalLoading(true);
    try {
      await api.post(`/found-items/match/${selectedItem.id}`, modalData);
      setModalOpen(false);
      setSuccessMsg(
        `Thank you! The owner of "${selectedItem.title}" has been notified.`
      );
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchItems();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setModalLoading(false);
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
            }}
          >
            {/* Banner Search Card */}
            <motion.div
              style={{
                position: 'relative',
                backgroundColor: heroBg,
                border: `1px solid ${border}`,
                borderRadius: 16,
                overflow: 'hidden',
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
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '1.5rem 2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <Search size={13} style={{ color: cyan }} />
                    <span
                      style={{
                        color: cyan,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.07em',
                      }}
                    >
                      BROWSE LOST ITEMS
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
                    Found something?
                  </h1>
                </div>
                <div style={{ position: 'relative', width: 320 }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: textMut,
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search title, location, description…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: 38,
                      paddingRight: 16,
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      borderRadius: 12,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${border}`,
                      color: textPri,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = `${cyan}50`)}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Success toast */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    borderRadius: 12,
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    color: '#34D399',
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <CheckCircle2 size={16} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {successMsg}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Figma Category Pills Navigation */}
            <motion.div
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.value;
                return (
                  <motion.button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 12,
                      backgroundColor: isActive ? cyanBg : cardBg,
                      border: `1px solid ${isActive ? `${cyan}35` : border}`,
                      color: isActive ? cyan : textMut,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      fontFamily: 'inherit',
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </motion.button>
                );
              })}
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 12,
                  backgroundColor: cardBg,
                  border: `1px solid ${border}`,
                  color: textMut,
                  fontSize: 13,
                }}
              >
                <SlidersHorizontal size={13} />
                <span>
                  {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <motion.div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5rem 0',
                  borderRadius: 20,
                  backgroundColor: cardBg,
                  border: `1px solid ${border}`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ color: textPri, fontSize: 16, fontWeight: 700 }}>
                  No matching items
                </div>
                <p style={{ color: textMut, fontSize: 14, marginTop: 4 }}>
                  Try a different search term or category.
                </p>
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <div
                style={{ textAlign: 'center', color: textMut, padding: '3rem' }}
              >
                Loading items...
              </div>
            )}

            {/* Grid */}
            <motion.div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {filtered.map((item) => {
                const currentCat = CATEGORIES.find(
                  (c) => c.value === item.category
                ) || { emoji: '📦', label: 'Other' };
                return (
                  <motion.div
                    key={item.id}
                    style={{
                      borderRadius: 20,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
                      transition: 'background-color 0.3s',
                    }}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                    whileHover={{
                      y: -4,
                      boxShadow: isDark
                        ? '0 16px 48px rgba(0,0,0,0.4)'
                        : '0 12px 40px rgba(0,0,0,0.1)',
                    }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: 144,
                          objectFit: 'cover',
                          borderRadius: 12,
                          marginBottom: '1rem',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: 144,
                          borderRadius: 12,
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: inputBg,
                          border: `1px solid ${border}`,
                        }}
                      >
                        <span style={{ fontSize: 36 }}>{currentCat.emoji}</span>
                      </div>
                    )}

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
                          backgroundColor: cyanBg,
                          color: cyan,
                        }}
                      >
                        {currentCat.emoji} {currentCat.label}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          color: textSub,
                          fontSize: 11,
                        }}
                      >
                        <Clock size={10} />
                        Lost {formatDate(item.dateLost)}
                      </span>
                    </div>

                    <div
                      style={{
                        color: textPri,
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <p
                      style={{
                        color: textMut,
                        fontSize: 12,
                        lineHeight: 1.5,
                        marginBottom: 10,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: '0 0 10px',
                      }}
                    >
                      {item.description}
                    </p>

                    <div
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: textMut,
                            fontSize: 12,
                          }}
                        >
                          <MapPin size={11} />
                          {item.location}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: textMut, fontSize: 12 }}>
                          👤 {item.user?.name}
                        </span>
                        <ReputationBadge
                          points={item.user?.points || 0}
                          showPoints={false}
                          size="small"
                        />
                      </div>

                      {item.userId !== user?.id ? (
                        <motion.button
                          onClick={() => openModal(item)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '0.625rem',
                            borderRadius: 12,
                            background: btnGrad,
                            color: btnText,
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                          whileHover={{ opacity: 0.9, scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          ✋ I Found This <ArrowRight size={13} />
                        </motion.button>
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '0.625rem',
                            borderRadius: 12,
                            backgroundColor: inputBg,
                            border: `1px solid ${border}`,
                            color: textMut,
                            fontSize: 13,
                          }}
                        >
                          📌 Your report
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 50,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              style={{
                width: '100%',
                maxWidth: 440,
                borderRadius: 20,
                padding: '1.75rem',
                backgroundColor: modalBg,
                border: `1px solid ${border}`,
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
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
                    <CheckCircle2 size={15} style={{ color: '#10B981' }} />
                    <span
                      style={{
                        color: '#10B981',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                      }}
                    >
                      I FOUND THIS
                    </span>
                  </div>
                  <h2
                    style={{
                      color: textPri,
                      fontSize: 18,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      margin: '0 0 4px',
                    }}
                  >
                    Confirm your find
                  </h2>
                  <p style={{ color: textMut, fontSize: 13, margin: 0 }}>
                    You're reporting:{' '}
                    <strong style={{ color: cyan }}>
                      {selectedItem?.title}
                    </strong>
                  </p>
                </div>
                <motion.button
                  onClick={() => setModalOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: inputBg,
                    border: 'none',
                    color: textMut,
                    cursor: 'pointer',
                  }}
                  whileHover={{
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.1)',
                  }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              {modalError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    marginBottom: '1rem',
                    backgroundColor: 'rgba(244,63,94,0.08)',
                    border: '1px solid rgba(244,63,94,0.2)',
                    color: '#F43F5E',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    ⚠️ {modalError}
                  </span>
                </div>
              )}

              <form
                onSubmit={handleModalSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Styled Native Location Input */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <label
                    style={{
                      color: textSub,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}
                  >
                    WHERE DID YOU FIND IT?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering Building A, Main Library..."
                    value={modalData.location}
                    onChange={(e) =>
                      setModalData((p) => ({ ...p, location: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      ...inputStyle,
                    }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>

                {/* Date */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <label
                    style={{
                      color: textSub,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}
                  >
                    WHEN DID YOU FIND IT?
                  </label>
                  <input
                    type="date"
                    max={today}
                    value={modalData.dateFound}
                    onChange={(e) =>
                      setModalData((p) => ({ ...p, dateFound: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      colorScheme: isDark ? 'dark' : 'light',
                      ...inputStyle,
                    }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>

                {/* Held at */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <label
                    style={{
                      color: textSub,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}
                  >
                    WHERE IS IT NOW?{' '}
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
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Security Office, I have it with me"
                    value={modalData.heldAt}
                    onChange={(e) =>
                      setModalData((p) => ({ ...p, heldAt: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      ...inputStyle,
                    }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: 4 }}>
                  <motion.button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
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
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={modalLoading}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '0.75rem',
                      borderRadius: 12,
                      background: modalLoading
                        ? isDark
                          ? '#1E293B'
                          : '#CBD5E1'
                        : btnGrad,
                      color: modalLoading ? textMut : btnText,
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: modalLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                    whileHover={
                      modalLoading ? {} : { opacity: 0.9, scale: 1.01 }
                    }
                    whileTap={modalLoading ? {} : { scale: 0.98 }}
                  >
                    {modalLoading ? (
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
                    ) : (
                      <>
                        Confirm Found <ArrowRight size={14} />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowseItems;
