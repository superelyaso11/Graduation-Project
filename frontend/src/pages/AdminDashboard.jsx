import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Trash2,
  Users,
  FileSearch,
  Package,
  Link2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import ReputationBadge from '../components/ReputationBadge';

const ROLES = ['STUDENT', 'SECURITY', 'ADMIN'];
const ROLE_COLOR = {
  STUDENT: '#10B981',
  SECURITY: '#F59E0B',
  ADMIN: '#EF4444',
};
const STATUS_COLOR = {
  ACTIVE: '#10B981',
  MATCHED: '#F59E0B',
  RESOLVED: '#22D3EE',
  EXPIRED: '#94A3B8',
  DONATED: '#8B5CF6',
};

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [roleModal, setRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const modalBg = isDark ? '#0C1118' : '#FFFFFF';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
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
      const [statsRes, usersRes, reportsRes, expiredRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/reports'),
        api.get('/admin/expired'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLostItems(reportsRes.data.lostItems);
      setFoundItems(reportsRes.data.foundItems);
      setExpiredItems(expiredRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const showMsg = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleRoleChange = (user, role) => {
    setSelectedUser(user);
    setNewRole(role);
    setRoleModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    try {
      const { data } = await api.patch(`/admin/users/${selectedUser.id}/role`, {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: data.role || newRole } : u
        )
      );
      setRoleModal(false);
      showMsg(`✅ ${selectedUser.name}'s role updated to ${newRole}`);
    } catch (err) {
      showMsg('❌ ' + (err.response?.data?.message || 'Failed to update role'));
      setRoleModal(false);
    }
  };

  const handleDeleteLost = async (id) => {
    if (!window.confirm('Delete this lost item permanently?')) return;
    try {
      await api.delete(`/admin/lost/${id}`);
      setLostItems((prev) => prev.filter((i) => i.id !== id));
      showMsg('🗑️ Lost item deleted.');
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleDeleteFound = async (id) => {
    if (!window.confirm('Delete this found item report permanently?')) return;
    try {
      await api.delete(`/admin/found/${id}`);
      setFoundItems((prev) => prev.filter((i) => i.id !== id));
      showMsg('🗑️ Found item deleted.');
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleDonate = async (id) => {
    if (!window.confirm('Mark this item as donated?')) return;
    try {
      await api.patch(`/admin/lost/${id}/donate`);
      setExpiredItems((prev) => prev.filter((i) => i.id !== id));
      showMsg('✅ Item marked as donated.');
    } catch (err) {
      console.error('Failed to donate', err);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'users', label: `Users (${users.length})`, icon: '👥' },
    { key: 'lost', label: `Lost (${lostItems.length})`, icon: '📋' },
    { key: 'found', label: `Found (${foundItems.length})`, icon: '📦' },
    { key: 'expired', label: `Expired (${expiredItems.length})`, icon: '⏰' },
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
              marginTop: '1rem',
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
                <ShieldCheck size={13} style={{ color: cyan }} />
                <span
                  style={{
                    color: cyan,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                  }}
                >
                  ADMIN
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
                System Overview
              </h1>
              <p style={{ color: textMut, fontSize: 13, marginTop: 4 }}>
                Platform analytics and moderation tools
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
                <CheckCircle size={16} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {successMsg}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
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
                <span>{tab.icon}</span> {tab.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Overview */}
            {!loading && activeTab === 'overview' && stats && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                }}
              >
                {[
                  {
                    label: 'Total Users',
                    value: stats.totalUsers,
                    icon: Users,
                    color: cyan,
                  },
                  {
                    label: 'Lost Reports',
                    value: stats.totalLostItems,
                    icon: FileSearch,
                    color: orange,
                  },
                  {
                    label: 'Found Reports',
                    value: stats.totalFoundItems,
                    icon: Package,
                    color: '#10B981',
                  },
                  {
                    label: 'Total Matches',
                    value: stats.totalMatches,
                    icon: Link2,
                    color: '#8B5CF6',
                  },
                  {
                    label: 'Resolved Items',
                    value: stats.resolvedItems,
                    icon: CheckCircle,
                    color: '#10B981',
                  },
                  {
                    label: 'Active Reports',
                    value: stats.activeItems,
                    icon: Clock,
                    color: orange,
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      style={{
                        borderRadius: 20,
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        backgroundColor: cardBg,
                        border: `1px solid ${border}`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -2 }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                        }}
                      />
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          backgroundColor: `${stat.color}18`,
                          color: stat.color,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <p
                          style={{
                            color: textPri,
                            fontSize: 28,
                            fontWeight: 800,
                            margin: 0,
                            lineHeight: 1,
                          }}
                        >
                          {stat.value}
                        </p>
                        <p
                          style={{
                            color: textMut,
                            fontSize: 12,
                            margin: '4px 0 0',
                          }}
                        >
                          {stat.label}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Users */}
            {!loading && activeTab === 'users' && (
              <motion.div
                key="users"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {users.map((user, i) => (
                  <motion.div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 20,
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: btnGrad,
                        color: btnText,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            color: textPri,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {user.name}
                        </span>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: 8,
                            backgroundColor: `${ROLE_COLOR[user.role]}18`,
                            color: ROLE_COLOR[user.role],
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <p style={{ color: textMut, fontSize: 12, margin: 0 }}>
                          {user.email} · ⭐ {user.points} pts · 📦{' '}
                          {user._count?.lostItems ?? 0} lost · 🔍{' '}
                          {user._count?.foundItems ?? 0} found · Joined{' '}
                          {fmt(user.createdAt)}
                        </p>
                        <ReputationBadge
                          points={user.points}
                          showPoints={true}
                          size="small"
                        />
                      </div>
                    </div>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 10,
                        outline: 'none',
                        backgroundColor: inputBg,
                        border: `1px solid ${border}`,
                        color: textPri,
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {ROLES.map((r) => (
                        <option
                          key={r}
                          value={r}
                          style={{ backgroundColor: cardBg }}
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Lost items */}
            {!loading && activeTab === 'lost' && (
              <motion.div
                key="lost"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {lostItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 20,
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
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
                        📋
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
                            backgroundColor: `${STATUS_COLOR[item.status]}18`,
                            color: STATUS_COLOR[item.status],
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p
                        style={{
                          color: textMut,
                          fontSize: 12,
                          margin: '0 0 2px',
                        }}
                      >
                        📍 {item.location} · 📅 {fmt(item.dateLost)}
                      </p>
                      <p style={{ color: textMut, fontSize: 12, margin: 0 }}>
                        👤 {item.user?.name} · ✉️ {item.user?.email}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleDeleteLost(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0.5rem 1rem',
                        borderRadius: 10,
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#EF4444',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Trash2 size={13} /> Delete
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Found items */}
            {!loading && activeTab === 'found' && (
              <motion.div
                key="found"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {foundItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 20,
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
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
                        📦
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
                            backgroundColor: `${STATUS_COLOR[item.status]}18`,
                            color: STATUS_COLOR[item.status],
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p
                        style={{
                          color: textMut,
                          fontSize: 12,
                          margin: '0 0 2px',
                        }}
                      >
                        📍 {item.location} · 📅 {fmt(item.dateFound)}
                      </p>
                      <p style={{ color: textMut, fontSize: 12, margin: 0 }}>
                        👤 {item.user?.name} · ✉️ {item.user?.email}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleDeleteFound(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0.5rem 1rem',
                        borderRadius: 10,
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#EF4444',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Trash2 size={13} /> Delete
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Expired items */}
            {!loading && activeTab === 'expired' && (
              <motion.div
                key="expired"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {expiredItems.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4rem 0',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        backgroundColor: cyanBg,
                      }}
                    >
                      ✅
                    </div>
                    <p
                      style={{
                        color: textPri,
                        fontSize: 15,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      No expired items pending
                    </p>
                  </div>
                )}
                {expiredItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 20,
                      backgroundColor: cardBg,
                      border: `1px solid ${isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)'}`,
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '1.25rem',
                        backgroundColor: 'rgba(139,92,246,0.12)',
                      }}
                    >
                      ⏰
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: textPri,
                          fontSize: 14,
                          fontWeight: 700,
                          margin: '0 0 3px',
                        }}
                      >
                        {item.title}
                      </p>
                      <p
                        style={{
                          color: textMut,
                          fontSize: 12,
                          margin: '0 0 2px',
                        }}
                      >
                        📍 {item.location} · 📅 {fmt(item.dateLost)}
                      </p>
                      <p style={{ color: textMut, fontSize: 12, margin: 0 }}>
                        👤 {item.user?.name} · ✉️ {item.user?.email}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleDonate(item.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 10,
                        backgroundColor: 'rgba(139,92,246,0.1)',
                        border: '1px solid #8B5CF6',
                        color: '#8B5CF6',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      🎁 Approve Donation
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Role change modal */}
      <AnimatePresence>
        {roleModal && (
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
            onClick={() => setRoleModal(false)}
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
                <ShieldCheck size={20} style={{ color: cyan }} />
              </div>
              <h2
                style={{
                  color: textPri,
                  fontSize: 17,
                  fontWeight: 700,
                  margin: '0 0 10px',
                }}
              >
                Confirm Role Change
              </h2>
              <p
                style={{
                  color: textMut,
                  fontSize: 13,
                  margin: '0 0 24px',
                  lineHeight: 1.6,
                }}
              >
                Change{' '}
                <strong style={{ color: textPri }}>{selectedUser?.name}</strong>
                's role from{' '}
                <strong style={{ color: ROLE_COLOR[selectedUser?.role] }}>
                  {selectedUser?.role}
                </strong>{' '}
                to{' '}
                <strong style={{ color: ROLE_COLOR[newRole] }}>
                  {newRole}
                </strong>
                ?
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end',
                }}
              >
                <motion.button
                  onClick={() => setRoleModal(false)}
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
                  onClick={confirmRoleChange}
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
                  Yes, Change Role
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
