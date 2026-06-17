import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, Package, Search, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';

const HELD_AT_OPTIONS = [
  'Security Office',
  'Library Front Desk',
  'Student Union Reception',
  'Admin Building Reception',
  'I have it with me',
  'Other',
];

const STATUS_META = {
  ACTIVE: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Active' },
  MATCHED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Matched' },
  RESOLVED: {
    color: '#22D3EE',
    bg: 'rgba(34,211,238,0.12)',
    label: 'Resolved',
  },
};

const CATEGORY_EMOJI = {
  ELECTRONICS: '💻',
  CLOTHING: '👕',
  ACCESSORIES: '🔑',
  STATIONERY: '📚',
  ID_CARDS: '🪪',
  SPORTS: '⚽',
  OTHER: '📦',
};

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const SecurityDashboard = () => {
  const { isDark } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [holdModal, setHoldModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [heldAtChoice, setHeldAtChoice] = useState('');
  const [heldAtCustom, setHeldAtCustom] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const modalBg = isDark ? '#0C1118' : '#FFFFFF';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
  const textSub = isDark ? '#334155' : '#94A3B8';
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
      const { data } = await api.get('/security/items');
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const showMsg = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const openHoldModal = (item) => {
    setSelectedItem(item);
    const existing = item.heldAt || '';
    if (HELD_AT_OPTIONS.includes(existing)) {
      setHeldAtChoice(existing);
      setHeldAtCustom('');
    } else if (existing) {
      setHeldAtChoice('Other');
      setHeldAtCustom(existing);
    } else {
      setHeldAtChoice('');
      setHeldAtCustom('');
    }
    setHoldModal(true);
  };

  const handleHold = async (e) => {
    e.preventDefault();
    const finalHeldAt = heldAtChoice === 'Other' ? heldAtCustom : heldAtChoice;
    if (!finalHeldAt) return;
    try {
      await api.patch(`/security/items/${selectedItem.id}/hold`, {
        heldAt: finalHeldAt,
      });
      await fetchItems();
      setHoldModal(false);
      showMsg('Item location updated.');
    } catch (err) {
      console.error('Failed to update hold location', err);
    }
  };

  const handleResolve = async (itemId) => {
    if (!window.confirm('Confirm that the owner has collected this item?'))
      return;
    try {
      await api.patch(`/security/items/${itemId}/resolve`);
      await fetchItems();
      showMsg('Item marked as resolved.');
    } catch (err) {
      console.error('Failed to resolve item', err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'held') return !!item.heldAt;
    if (activeTab === 'matched') return item.status === 'MATCHED';
    if (activeTab === 'resolved') return item.status === 'RESOLVED';
    return true;
  });

  const stats = [
    { label: 'Total Items', value: items.length, icon: Package, color: cyan },
    {
      label: 'Held at',
      value: items.filter((i) => i.heldAt).length,
      icon: MapPin,
      color: '#F59E0B',
    },
    {
      label: 'Matched',
      value: items.filter((i) => i.status === 'MATCHED').length,
      icon: Search,
      color: '#8B5CF6',
    },
    {
      label: 'Resolved',
      value: items.filter((i) => i.status === 'RESOLVED').length,
      icon: CheckCircle2,
      color: '#10B981',
    },
  ];

  const tabs = [
    { key: 'all', label: 'All Items' },
    { key: 'held', label: 'Held' },
    { key: 'matched', label: 'Matched' },
    { key: 'resolved', label: 'Resolved' },
  ];

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
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* Hero */}
          <motion.div
            style={{
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: heroBg,
              border: `1px solid ${border}`,
              minHeight: 110,
              marginBottom: '1.25rem',
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
                top: '-40%',
                right: '8%',
                width: 260,
                height: 260,
                background: `radial-gradient(circle,${isDark ? 'rgba(34,211,238,0.07)' : 'rgba(8,145,178,0.06)'} 0%,transparent 70%)`,
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
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Shield size={13} style={{ color: cyan }} />
                <span
                  style={{
                    color: cyan,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                  }}
                >
                  CAMPUS SECURITY
                </span>
              </div>
              <h1
                style={{
                  color: textPri,
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  margin: 0,
                }}
              >
                Security Dashboard
              </h1>
              <p style={{ color: textMut, fontSize: 13, marginTop: 4 }}>
                Manage held lost and found items
              </p>
            </div>
          </motion.div>

          {/* Success toast */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.875rem 1.25rem',
                  borderRadius: 12,
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: '#34D399',
                  marginBottom: '1rem',
                }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <CheckCircle2 size={16} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {successMsg}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  style={{
                    borderRadius: 16,
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${stat.color}18`,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p
                      style={{
                        color: textPri,
                        fontSize: 24,
                        fontWeight: 800,
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      {loading ? '—' : stat.value}
                    </p>
                    <p
                      style={{
                        color: textMut,
                        fontSize: 11,
                        margin: '3px 0 0',
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
            }}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 12,
                  backgroundColor: activeTab === tab.key ? cyanBg : cardBg,
                  border: `1px solid ${activeTab === tab.key ? `${cyan}35` : border}`,
                  color: activeTab === tab.key ? cyan : textMut,
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Items */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {!loading && filteredItems.length === 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 0',
                    borderRadius: 20,
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
                  <p
                    style={{
                      color: textPri,
                      fontSize: 15,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    No items found
                  </p>
                </div>
              )}

              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: 20,
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                    alignItems: 'flex-start',
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '1.5rem',
                        backgroundColor: inputBg,
                      }}
                    >
                      {CATEGORY_EMOJI[item.category] ?? '📦'}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: textPri,
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: STATUS_META[item.status]?.bg,
                          color: STATUS_META[item.status]?.color,
                        }}
                      >
                        {STATUS_META[item.status]?.label || item.status}
                      </span>
                    </div>
                    <p
                      style={{
                        color: textMut,
                        fontSize: 12,
                        margin: '0 0 2px',
                      }}
                    >
                      {CATEGORY_EMOJI[item.category]}{' '}
                      {item.category.replace('_', ' ')} · 📍 {item.location} ·
                      📅 {fmt(item.dateFound)}
                    </p>
                    <p
                      style={{
                        color: textMut,
                        fontSize: 12,
                        margin: '0 0 2px',
                      }}
                    >
                      {item.description}
                    </p>
                    <p style={{ color: cyan, fontSize: 12, margin: '0 0 2px' }}>
                      👤 Reported by: {item.user?.name} · {item.user?.email}
                    </p>
                    {item.heldAt && (
                      <p
                        style={{
                          color: '#10B981',
                          fontSize: 12,
                          margin: '4px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MapPin size={11} /> Currently held at: {item.heldAt}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    {item.status !== 'RESOLVED' && (
                      <motion.button
                        onClick={() => openHoldModal(item)}
                        style={{
                          padding: '0.5rem 0.875rem',
                          borderRadius: 10,
                          backgroundColor: cyanBg,
                          border: `1px solid ${cyan}30`,
                          color: cyan,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        🏢 {item.heldAt ? 'Update Location' : 'Mark as Held'}
                      </motion.button>
                    )}
                    {item.status !== 'RESOLVED' &&
                      (item.heldAt || item.status === 'MATCHED') && (
                        <motion.button
                          onClick={() => handleResolve(item.id)}
                          style={{
                            padding: '0.5rem 0.875rem',
                            borderRadius: 10,
                            backgroundColor: 'rgba(16,185,129,0.1)',
                            border: '1px solid #10B981',
                            color: '#10B981',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontFamily: 'inherit',
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          ✅ Owner Collected
                        </motion.button>
                      )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Hold modal */}
      <AnimatePresence>
        {holdModal && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHoldModal(false)}
          >
            <motion.div
              style={{
                borderRadius: 20,
                padding: '1.5rem',
                width: '100%',
                maxWidth: 440,
                backgroundColor: modalBg,
                border: `1px solid ${border}`,
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  backgroundColor: cyanBg,
                }}
              >
                <Shield size={20} style={{ color: cyan }} />
              </div>
              <h2
                style={{
                  color: textPri,
                  fontSize: 17,
                  fontWeight: 700,
                  margin: '0 0 6px',
                }}
              >
                Mark as Held
              </h2>
              <p style={{ color: textMut, fontSize: 13, margin: '0 0 20px' }}>
                Item:{' '}
                <strong style={{ color: textPri }}>
                  {selectedItem?.title}
                </strong>
              </p>

              <form
                onSubmit={handleHold}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
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
                    LOCATION
                  </label>
                  <select
                    value={heldAtChoice}
                    onChange={(e) => setHeldAtChoice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      outline: 'none',
                      backgroundColor: inputBg,
                      border: `1px solid ${border}`,
                      color: textPri,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option
                      value=""
                      style={{ backgroundColor: cardBg, color: textPri }}
                    >
                      Select a location…
                    </option>
                    {HELD_AT_OPTIONS.map((opt) => (
                      <option
                        key={opt}
                        value={opt}
                        style={{ backgroundColor: cardBg, color: textPri }}
                      >
                        {opt}
                      </option>
                    ))}
                  </select>
                  {heldAtChoice === 'Other' && (
                    <input
                      type="text"
                      placeholder="Describe where it's held"
                      value={heldAtCustom}
                      onChange={(e) => setHeldAtCustom(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        outline: 'none',
                        backgroundColor: inputBg,
                        border: `1px solid ${border}`,
                        color: textPri,
                        fontSize: 14,
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
                  }}
                >
                  <motion.button
                    type="button"
                    onClick={() => setHoldModal(false)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: 12,
                      backgroundColor: 'transparent',
                      border: `1px solid ${border}`,
                      color: textMut,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: 12,
                      background: btnGrad,
                      border: 'none',
                      color: btnText,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Confirm
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

export default SecurityDashboard;
