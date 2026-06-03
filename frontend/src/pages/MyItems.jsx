import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ArrowUpRight,
  X,
  ShieldCheck,
  ShieldX,
  FileQuestion,
  Tag,
  Trash2,
  Scan,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';

const STATUS_META = {
  ACTIVE: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Active' },
  MATCHED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Matched' },
  RESOLVED: {
    color: '#22D3EE',
    bg: 'rgba(34,211,238,0.12)',
    label: 'Resolved',
  },
  EXPIRED: { color: '#64748B', bg: 'rgba(100,116,139,0.12)', label: 'Expired' },
  DONATED: { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'Donated' },
  PENDING: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  APPROVED: {
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    label: 'Approved',
  },
  REJECTED: { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', label: 'Rejected' },
};

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] ?? {
    color: '#64748B',
    bg: 'rgba(100,116,139,0.12)',
    label: status,
  };
  return (
    <span
      style={{
        padding: '0.25rem 0.625rem',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: m.bg,
        color: m.color,
      }}
    >
      {m.label}
    </span>
  );
};

const MyItems = () => {
  const { user, refreshUser } = useAuth();
  const { isDark } = useTheme();
  const { socket } = useSocket();

  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [incomingClaims, setIncomingClaims] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost');
  const [claimModal, setClaimModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [claimData, setClaimData] = useState({ question: '', answer: '' });
  const [claimError, setClaimError] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const rowBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const rowHover = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const modalBg = isDark ? '#0C1118' : '#FFFFFF';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
  const textSub = isDark ? '#334155' : '#94A3B8';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const cyanBg = isDark ? 'rgba(34,211,238,0.1)' : 'rgba(8,145,178,0.1)';
  const orange = isDark ? '#F97316' : '#EA580C';
  const btnGrad = isDark
    ? 'linear-gradient(135deg,#22D3EE,#0EA5E9)'
    : 'linear-gradient(135deg,#0891B2,#0369A1)';
  const btnText = isDark ? '#050709' : '#fff';
  const gridLine = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lost, found, incoming, mine] = await Promise.all([
        api.get('/lost-items/my'),
        api.get('/found-items/my'),
        api.get('/claims/incoming'),
        api.get('/claims/my'),
      ]);
      setLostItems(lost.data);
      setFoundItems(found.data);
      setIncomingClaims(incoming.data);
      setMyClaims(mine.data);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchAll();
    socket.on('new_notification', handler);
    return () => socket.off('new_notification', handler);
  }, [socket, fetchAll]);

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleClaim = async (item) => {
    const { data: lostItem } = await api.get(`/lost-items/${item.id}`);
    setSelectedMatch({ ...item, matches: lostItem.matches });
    setClaimData({ question: '', answer: '' });
    setClaimError('');
    setClaimModal(true);
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimData.question || !claimData.answer) {
      setClaimError('Both fields are required');
      return;
    }
    setClaimLoading(true);
    try {
      const foundItemId = selectedMatch?.matches?.[0]?.foundItemId || null;
      if (!foundItemId) {
        setClaimError('No match found for this item yet');
        setClaimLoading(false);
        return;
      }
      await api.post('/claims', {
        lostItemId: selectedMatch.id,
        foundItemId,
        question: claimData.question,
        answer: claimData.answer,
      });
      setClaimModal(false);
      flash('Claim submitted! The finder will review it.');
      fetchAll();
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleApprove = async (claimId) => {
    try {
      await api.patch(`/claims/${claimId}/approve`);
      setIncomingClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: 'APPROVED' } : c))
      );
      await refreshUser();
      flash('Claim approved! Item marked as resolved.');
    } catch (err) {
      console.error('Failed to approve claim', err);
    }
  };

  const handleReject = async (claimId) => {
    try {
      await api.patch(`/claims/${claimId}/reject`);
      setIncomingClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: 'REJECTED' } : c))
      );
      flash('Claim rejected.');
    } catch (err) {
      console.error('Failed to reject claim', err);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/lost-items/${itemId}`);
      setLostItems((prev) => prev.filter((i) => i.id !== itemId));
      flash('Report deleted successfully.');
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const tabs = [
    {
      key: 'lost',
      label: 'Lost Items',
      count: lostItems.length,
      icon: AlertCircle,
    },
    {
      key: 'found',
      label: 'Found Reports',
      count: foundItems.length,
      icon: CheckCircle2,
    },
    {
      key: 'incoming',
      label: 'Incoming Claims',
      count: incomingClaims.length,
      icon: FileQuestion,
    },
    { key: 'myclaims', label: 'My Claims', count: myClaims.length, icon: Tag },
  ];

  const EmptyState = ({ label }) => (
    <motion.div
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
      <p style={{ color: textMut, fontSize: 14, margin: 0 }}>{label}</p>
    </motion.div>
  );

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
            {/* Hero */}
            <motion.div
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: heroBg,
                border: `1px solid ${border}`,
                minHeight: 100,
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                  right: '10%',
                  width: 280,
                  height: 280,
                  background: `radial-gradient(circle,${isDark ? 'rgba(34,211,238,0.07)' : 'rgba(8,145,178,0.06)'} 0%,transparent 70%)`,
                  filter: 'blur(50px)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.5rem 2rem',
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
                    <Package size={14} style={{ color: cyan }} />
                    <span
                      style={{
                        color: cyan,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                      }}
                    >
                      MY ITEMS
                    </span>
                  </div>
                  <h1
                    style={{
                      color: textPri,
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      margin: 0,
                    }}
                  >
                    Manage your reports
                  </h1>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <motion.button
                    onClick={() => (window.location.href = '/report-lost')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.625rem 1rem',
                      borderRadius: 12,
                      background: btnGrad,
                      color: btnText,
                      fontSize: 13,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    whileHover={{ scale: 1.03, opacity: 0.9 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <AlertCircle size={14} /> Report Lost
                  </motion.button>
                  <motion.button
                    onClick={() => (window.location.href = '/report-found')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.625rem 1rem',
                      borderRadius: 12,
                      backgroundColor: isDark
                        ? 'rgba(249,115,22,0.1)'
                        : 'rgba(234,88,12,0.08)',
                      border: `1px solid ${orange}30`,
                      color: orange,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Scan size={14} /> Report Found
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Success Toast */}
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
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                >
                  <CheckCircle2 size={16} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {successMsg}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <motion.div
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <motion.button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.625rem 1rem',
                      borderRadius: 12,
                      backgroundColor: isActive ? cyanBg : cardBg,
                      border: `1px solid ${isActive ? `${cyan}35` : border}`,
                      color: isActive ? cyan : textMut,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon size={14} />
                    {tab.label}
                    <span
                      style={{
                        marginLeft: 2,
                        padding: '0.1rem 0.4rem',
                        borderRadius: 6,
                        backgroundColor: isActive
                          ? `${cyan}25`
                          : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.06)',
                        color: isActive ? cyan : textMut,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {tab.count}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Lost Items */}
                {activeTab === 'lost' && (
                  <>
                    {lostItems.length === 0 && !loading && (
                      <EmptyState label="No lost item reports yet." />
                    )}
                    {lostItems.map((item, i) => (
                      <motion.div
                        key={item.id}
                        style={{
                          borderRadius: 20,
                          padding: '1.25rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          backgroundColor: rowBg,
                          border: `1px solid ${border}`,
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ backgroundColor: rowHover }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor:
                              STATUS_META[item.status]?.bg ?? cyanBg,
                          }}
                        >
                          <AlertCircle
                            size={16}
                            style={{
                              color: STATUS_META[item.status]?.color ?? cyan,
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: textPri,
                              fontSize: 15,
                              fontWeight: 700,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginTop: 4,
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
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                color: textMut,
                                fontSize: 12,
                              }}
                            >
                              <Clock size={11} />
                              {fmt(item.dateLost)}
                            </span>
                          </div>
                          <p
                            style={{
                              color: textMut,
                              fontSize: 13,
                              marginTop: 6,
                              lineHeight: 1.5,
                              margin: '6px 0 0',
                            }}
                          >
                            {item.description}
                          </p>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          <StatusBadge status={item.status} />
                          {item.status === 'MATCHED' && (
                            <motion.button
                              onClick={() => handleClaim(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '0.375rem 0.75rem',
                                borderRadius: 10,
                                background: btnGrad,
                                color: btnText,
                                fontSize: 12,
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                              whileHover={{ scale: 1.04, opacity: 0.9 }}
                              whileTap={{ scale: 0.96 }}
                            >
                              <ShieldCheck size={13} /> Submit Claim
                            </motion.button>
                          )}
                          {item.status === 'ACTIVE' && (
                            <motion.button
                              onClick={() => handleDelete(item.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '0.375rem 0.75rem',
                                borderRadius: 10,
                                backgroundColor: 'rgba(244,63,94,0.08)',
                                border: '1px solid rgba(244,63,94,0.25)',
                                color: '#F43F5E',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                              whileHover={{
                                backgroundColor: 'rgba(244,63,94,0.15)',
                              }}
                              whileTap={{ scale: 0.96 }}
                            >
                              <Trash2 size={13} /> Delete
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}

                {/* Found Reports */}
                {activeTab === 'found' && (
                  <>
                    {foundItems.length === 0 && !loading && (
                      <EmptyState label="No found item reports yet." />
                    )}
                    {foundItems.map((item, i) => (
                      <motion.div
                        key={item.id}
                        style={{
                          borderRadius: 20,
                          padding: '1.25rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          backgroundColor: rowBg,
                          border: `1px solid ${border}`,
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ backgroundColor: rowHover }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor:
                              STATUS_META[item.status]?.bg ?? cyanBg,
                          }}
                        >
                          <CheckCircle2
                            size={16}
                            style={{
                              color: STATUS_META[item.status]?.color ?? cyan,
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: textPri,
                              fontSize: 15,
                              fontWeight: 700,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginTop: 4,
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
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                color: textMut,
                                fontSize: 12,
                              }}
                            >
                              <Clock size={11} />
                              {fmt(item.dateFound)}
                            </span>
                          </div>
                          <p
                            style={{
                              color: textMut,
                              fontSize: 13,
                              marginTop: 6,
                              lineHeight: 1.5,
                              margin: '6px 0 0',
                            }}
                          >
                            {item.description}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </motion.div>
                    ))}
                  </>
                )}

                {/* Incoming Claims */}
                {activeTab === 'incoming' && (
                  <>
                    {incomingClaims.length === 0 && !loading && (
                      <EmptyState label="No incoming claims yet." />
                    )}
                    {incomingClaims.map((claim, i) => (
                      <motion.div
                        key={claim.id}
                        style={{
                          borderRadius: 20,
                          padding: '1.25rem',
                          backgroundColor: rowBg,
                          border: `1px solid ${border}`,
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '1rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '1rem',
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                backgroundColor: cyanBg,
                              }}
                            >
                              <FileQuestion size={16} style={{ color: cyan }} />
                            </div>
                            <div>
                              <div
                                style={{
                                  color: textPri,
                                  fontSize: 15,
                                  fontWeight: 700,
                                }}
                              >
                                Claim for: {claim.foundItem?.title}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginTop: 4,
                                }}
                              >
                                <span style={{ color: textMut, fontSize: 13 }}>
                                  👤 {claim.claimant?.name}
                                </span>
                                <span
                                  style={{
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    backgroundColor: cyanBg,
                                    color: cyan,
                                  }}
                                >
                                  {claim.claimant?.points} pts
                                </span>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                  marginTop: 12,
                                }}
                              >
                                <div
                                  style={{
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: 12,
                                    backgroundColor: isDark
                                      ? 'rgba(255,255,255,0.03)'
                                      : 'rgba(0,0,0,0.03)',
                                    border: `1px solid ${border}`,
                                  }}
                                >
                                  <span
                                    style={{
                                      color: textSub,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    QUESTION
                                  </span>
                                  <p
                                    style={{
                                      color: textMut,
                                      fontSize: 13,
                                      marginTop: 2,
                                      margin: '2px 0 0',
                                    }}
                                  >
                                    {claim.question}
                                  </p>
                                </div>
                                <div
                                  style={{
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: 12,
                                    backgroundColor: isDark
                                      ? 'rgba(255,255,255,0.03)'
                                      : 'rgba(0,0,0,0.03)',
                                    border: `1px solid ${border}`,
                                  }}
                                >
                                  <span
                                    style={{
                                      color: textSub,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    THEIR ANSWER
                                  </span>
                                  <p
                                    style={{
                                      color: textPri,
                                      fontSize: 13,
                                      fontWeight: 600,
                                      marginTop: 2,
                                      margin: '2px 0 0',
                                    }}
                                  >
                                    {claim.answer}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: 8,
                              flexShrink: 0,
                            }}
                          >
                            <StatusBadge status={claim.status} />
                            {claim.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <motion.button
                                  onClick={() => handleApprove(claim.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: 10,
                                    backgroundColor: 'rgba(16,185,129,0.1)',
                                    border: '1px solid rgba(16,185,129,0.25)',
                                    color: '#10B981',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                  whileHover={{
                                    backgroundColor: 'rgba(16,185,129,0.18)',
                                  }}
                                  whileTap={{ scale: 0.96 }}
                                >
                                  <ShieldCheck size={13} /> Approve
                                </motion.button>
                                <motion.button
                                  onClick={() => handleReject(claim.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: 10,
                                    backgroundColor: 'rgba(244,63,94,0.08)',
                                    border: '1px solid rgba(244,63,94,0.25)',
                                    color: '#F43F5E',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                  whileHover={{
                                    backgroundColor: 'rgba(244,63,94,0.15)',
                                  }}
                                  whileTap={{ scale: 0.96 }}
                                >
                                  <ShieldX size={13} /> Reject
                                </motion.button>
                              </div>
                            )}
                            {claim.status === 'APPROVED' && (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#10B981',
                                }}
                              >
                                📧 {claim.claimant?.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}

                {/* My Claims */}
                {activeTab === 'myclaims' && (
                  <>
                    {myClaims.length === 0 && !loading && (
                      <EmptyState label="No claims submitted yet." />
                    )}
                    {myClaims.map((claim, i) => (
                      <motion.div
                        key={claim.id}
                        style={{
                          borderRadius: 20,
                          padding: '1.25rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          backgroundColor: rowBg,
                          border: `1px solid ${border}`,
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ backgroundColor: rowHover }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor:
                              STATUS_META[claim.status]?.bg ?? cyanBg,
                          }}
                        >
                          <Tag
                            size={16}
                            style={{
                              color: STATUS_META[claim.status]?.color ?? cyan,
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: textPri,
                              fontSize: 15,
                              fontWeight: 700,
                            }}
                          >
                            {claim.foundItem?.title ??
                              claim.lostItem?.title ??
                              'Unknown item'}
                          </div>
                          <div
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: 10,
                              marginTop: 8,
                              display: 'inline-block',
                              backgroundColor: isDark
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(0,0,0,0.03)',
                              border: `1px solid ${border}`,
                            }}
                          >
                            <span
                              style={{
                                color: textSub,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                              }}
                            >
                              YOUR ANSWER
                            </span>
                            <p
                              style={{
                                color: textMut,
                                fontSize: 13,
                                marginTop: 2,
                                margin: '2px 0 0',
                              }}
                            >
                              {claim.answer}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={claim.status} />
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {claimModal && (
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
            onClick={() => setClaimModal(false)}
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
                  <h2
                    style={{
                      color: textPri,
                      fontSize: 18,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      margin: '0 0 4px',
                    }}
                  >
                    Submit a Claim
                  </h2>
                  <p style={{ color: textMut, fontSize: 13, margin: 0 }}>
                    Claiming:{' '}
                    <strong style={{ color: cyan }}>
                      {selectedMatch?.title}
                    </strong>
                  </p>
                </div>
                <motion.button
                  onClick={() => setClaimModal(false)}
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

              {/* Hint */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '0.875rem',
                  borderRadius: 12,
                  marginBottom: '1.25rem',
                  backgroundColor: isDark
                    ? 'rgba(34,211,238,0.06)'
                    : 'rgba(8,145,178,0.06)',
                  border: `1px solid ${cyan}20`,
                }}
              >
                <span style={{ fontSize: 14 }}>💡</span>
                <p
                  style={{
                    color: textMut,
                    fontSize: 12,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Set a verification question only you'd know the answer to —
                  e.g. <em>"What sticker is on the laptop?"</em>
                </p>
              </div>

              <AnimatePresence>
                {claimError && (
                  <motion.div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '0.75rem 1rem',
                      borderRadius: 10,
                      marginBottom: '1rem',
                      backgroundColor: 'rgba(244,63,94,0.08)',
                      border: '1px solid rgba(244,63,94,0.25)',
                      color: '#F43F5E',
                    }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertCircle size={14} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {claimError}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handleClaimSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {[
                  {
                    label: 'VERIFICATION QUESTION',
                    key: 'question',
                    placeholder: 'e.g. What sticker is on the laptop?',
                  },
                  {
                    label: 'YOUR ANSWER',
                    key: 'answer',
                    placeholder: 'e.g. A blue dinosaur sticker',
                  },
                ].map(({ label, key, placeholder }) => (
                  <div
                    key={key}
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
                      {label}
                    </label>
                    <input
                      type="text"
                      value={claimData[key]}
                      onChange={(e) =>
                        setClaimData({ ...claimData, [key]: e.target.value })
                      }
                      placeholder={placeholder}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        backgroundColor: inputBg,
                        border: `1px solid ${border}`,
                        color: textPri,
                        fontSize: 14,
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = `${cyan}60`)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = border)
                      }
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: 8 }}>
                  <motion.button
                    type="button"
                    onClick={() => setClaimModal(false)}
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
                    whileHover={{
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.08)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={claimLoading}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '0.75rem',
                      borderRadius: 12,
                      background: claimLoading ? '#334155' : btnGrad,
                      color: claimLoading ? textMut : btnText,
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: claimLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                    whileHover={
                      claimLoading ? {} : { opacity: 0.9, scale: 1.01 }
                    }
                    whileTap={claimLoading ? {} : { scale: 0.98 }}
                  >
                    {claimLoading ? (
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
                        <ArrowUpRight size={15} /> Submit Claim
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

export default MyItems;
