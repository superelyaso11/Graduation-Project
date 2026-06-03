import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Package,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ReputationBadge from '../components/ReputationBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeLostItems: 0,
    activeFoundItems: 0,
    matchesFound: 0,
    resolvedItems: 0,
    totalAcyiveReports: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(user?.points || 0);

  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
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

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
      setRecentNotifications(data.recentNotifications);
      setUserPoints(data.userPoints);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  //refresh dashboard when new notification arrives
  useEffect(() => {
    if (!socket) return;
    socket.on('new_notifications', () => {
      fetchDashboard; //refresh stats on new event
    });
    return () => socket.off('new_notification');
  }, [socket, fetchDashboard]);

  const formatTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const statusMeta = {
    ACTIVE: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Active' },
    MATCHED: {
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      label: 'Matched',
    },
    RESOLVED: {
      color: '#22D3EE',
      bg: 'rgba(34,211,238,0.12)',
      label: 'Resolved',
    },
    EXPIRED: {
      color: '#64748B',
      bg: 'rgba(100,116,139,0.12)',
      label: 'Expired',
    },
  };

  const categoryEmoji = {
    ELECTRONICS: '💻',
    CLOTHING: '👕',
    ACCESSORIES: '🔑',
    STATIONERY: '📚',
    ID_CARDS: '🪪',
    SPORTS: '⚽',
    OTHER: '📦',
  };

  const statCards = [
    {
      label: 'Active Reports',
      value: stats.totalActiveReports,
      delta: '',
      icon: '⊙',
      accentColor: orange,
      bg: `rgba(249,115,22,0.08)`,
    },
    {
      label: 'Matches Found',
      value: stats.matchesFound,
      delta: '',
      icon: '🔍',
      accentColor: '#10B981',
      bg: 'rgba(16,185,129,0.08)',
    },
    {
      label: 'Items Resolved',
      value: stats.resolvedItems,
      delta: '',
      icon: '✅',
      accentColor: cyan,
      bg: isDark ? 'rgba(34,211,238,0.08)' : 'rgba(8,145,178,0.08)',
    },
  ];

  const getNotificationIcon = (message) => {
    if (message.includes('match')) return '🔍';
    if (message.includes('approved')) return '✅';
    if (message.includes('rejected')) return '❌';
    if (message.includes('claim')) return '📋';
    if (message.includes('expired')) return '⏰';
    return '🔔';
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
          <Navbar />

          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* User card */}
            <motion.div
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: btnGrad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: btnText,
                  flexShrink: 0,
                }}
              >
                {user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: textPri,
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '0.25rem',
                  }}
                >
                  {user?.name}
                </div>
                <ReputationBadge
                  points={userPoints}
                  showPoints={true}
                  size="small"
                />
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: isDark
                    ? 'rgba(34,211,238,0.1)'
                    : 'rgba(8,145,178,0.1)',
                  color: cyan,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                {user?.role}
              </span>
            </motion.div>

            {/* Stat cards */}
            <motion.div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
              }}
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                },
              }}
            >
              {statCards.map((s) => (
                <motion.div
                  key={s.label}
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 20,
                    padding: '1.5rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 120,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background-color 0.3s',
                  }}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  whileHover={{ y: -4, boxShadow: `0 16px 48px ${s.bg}` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  {/* Accent top strip */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      borderRadius: '20px 20px 0 0',
                      backgroundColor: s.accentColor,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      delay: 0.4,
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                  {/* Glow */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      background: `radial-gradient(circle,${s.bg} 0%,transparent 70%)`,
                      filter: 'blur(16px)',
                      transform: 'translate(30%,30%)',
                      pointerEvents: 'none',
                    }}
                  />

                  <span
                    style={{
                      color: textMut,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {s.label.toUpperCase()}
                  </span>
                  <div>
                    <motion.div
                      style={{
                        color: textPri,
                        fontSize: 48,
                        fontWeight: 800,
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                      }}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.3,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {loading ? '—' : s.value}
                    </motion.div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginTop: 8,
                      }}
                    >
                      <TrendingUp size={12} style={{ color: s.accentColor }} />
                      <span
                        style={{
                          color: s.accentColor,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Live
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Bottom grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
              }}
            >
              {/* Recent Activity */}
              <motion.div
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 20,
                  padding: '1.5rem',
                  transition: 'background-color 0.3s',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <h2
                      style={{
                        color: textPri,
                        fontSize: 16,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Recent Activity
                    </h2>
                    <p style={{ color: textMut, fontSize: 12, marginTop: 2 }}>
                      Your reports and matches
                    </p>
                  </div>
                  <motion.button
                    onClick={() => navigate('/my-items')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0.375rem 0.75rem',
                      borderRadius: 10,
                      backgroundColor: cyanBg,
                      border: `1px solid ${cyan}30`,
                      color: cyan,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    View all <ArrowUpRight size={12} />
                  </motion.button>
                </div>

                {loading && (
                  <p
                    style={{
                      color: textMut,
                      textAlign: 'center',
                      padding: '2rem',
                      margin: 0,
                    }}
                  >
                    Loading...
                  </p>
                )}

                {!loading && recentActivity.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '2rem',
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>📋</span>
                    <p style={{ color: textMut, fontSize: 14, margin: 0 }}>
                      No activity yet
                    </p>
                    <motion.button
                      onClick={() => navigate('/report-lost')}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        background: btnGrad,
                        color: btnText,
                        fontSize: 13,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Report a Lost Item
                    </motion.button>
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  {recentActivity.map((item, i) => {
                    const meta = statusMeta[item.status] || statusMeta.ACTIVE;
                    return (
                      <motion.div
                        key={item.id}
                        style={{
                          borderRadius: 12,
                          padding: '1rem',
                          display: 'flex',
                          gap: '0.75rem',
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${border}`,
                          cursor: 'pointer',
                        }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.07 }}
                        whileHover={{
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.04)',
                          y: -2,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: meta.bg,
                            border: `1px solid ${meta.color}25`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: '1rem',
                          }}
                        >
                          {categoryEmoji[item.category] || '📦'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                color: textPri,
                                fontSize: 13,
                                fontWeight: 600,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                padding: '0.1rem 0.4rem',
                                borderRadius: 6,
                                backgroundColor: meta.bg,
                                color: meta.color,
                                fontSize: 10,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginTop: 6,
                            }}
                          >
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
                              {formatTime(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Right column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Quick Actions */}
                <motion.div
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 20,
                    padding: '1.25rem',
                    transition: 'background-color 0.3s',
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.35,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <Zap size={14} style={{ color: cyan }} />
                    <span
                      style={{ color: textPri, fontSize: 14, fontWeight: 700 }}
                    >
                      Quick Actions
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.625rem',
                    }}
                  >
                    <motion.button
                      onClick={() => navigate('/report-lost')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: 12,
                        background: btnGrad,
                        color: btnText,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ scale: 1.02, opacity: 0.93 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <AlertCircle size={16} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        Report Lost Item
                      </span>
                      <ArrowUpRight size={14} style={{ marginLeft: 'auto' }} />
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/report-found')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: 12,
                        backgroundColor: isDark
                          ? 'rgba(249,115,22,0.1)'
                          : 'rgba(234,88,12,0.08)',
                        border: `1px solid ${orange}30`,
                        color: orange,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <CheckCircle2 size={16} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        Report Found Item
                      </span>
                      <ArrowUpRight size={14} style={{ marginLeft: 'auto' }} />
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/browse-items')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: 12,
                        backgroundColor: isDark
                          ? 'rgba(167,139,250,0.08)'
                          : 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(167,139,250,0.2)',
                        color: '#A78BFA',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Package size={16} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        Browse Lost Items
                      </span>
                      <ArrowUpRight size={14} style={{ marginLeft: 'auto' }} />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Recent Notifications */}
                <motion.div
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                    borderRadius: 20,
                    padding: '1.25rem',
                    flex: 1,
                    transition: 'background-color 0.3s',
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.42,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span
                      style={{ color: textPri, fontSize: 14, fontWeight: 700 }}
                    >
                      Notifications
                    </span>
                    <motion.button
                      onClick={() => navigate('/notifications')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: cyan,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ scale: 1.04 }}
                    >
                      View all <ArrowUpRight size={12} />
                    </motion.button>
                  </div>

                  {recentNotifications.length === 0 && (
                    <p
                      style={{
                        color: textMut,
                        fontSize: 13,
                        textAlign: 'center',
                        padding: '1.5rem 0',
                        margin: 0,
                      }}
                    >
                      No notifications yet
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    {recentNotifications.map((n, i) => (
                      <motion.div
                        key={n.id || i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.625rem 0',
                          borderBottom: `1px solid ${border}`,
                        }}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: cyanBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: '0.875rem',
                          }}
                        >
                          {n.message.includes('match')
                            ? '🔍'
                            : n.message.includes('approved')
                              ? '✅'
                              : '🔔'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              color: textPri,
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              margin: '0 0 0.15rem',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {n.message}
                          </p>
                          <p
                            style={{
                              color: textMut,
                              fontSize: '0.7rem',
                              margin: 0,
                            }}
                          >
                            {formatTime(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: cyan,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
