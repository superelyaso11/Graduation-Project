import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ReputationBadge from '../components/ReputationBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
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

  const statusColor = {
    ACTIVE: '#10B981',
    MATCHED: '#F59E0B',
    RESOLVED: '#2563EB',
    EXPIRED: '#94A3B8',
    DONATED: '#8B5CF6',
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

  const getNotificationIcon = (message) => {
    if (message.includes('match')) return '🔍';
    if (message.includes('approved')) return '✅';
    if (message.includes('rejected')) return '❌';
    if (message.includes('claim')) return '📋';
    if (message.includes('expired')) return '⏰';
    return '🔔';
  };

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <Navbar
          title="Dashboard"
          subtitle={`Welcome back, ${user?.name?.split(' ')[0]}!`}
        />

        <div style={s.content}>
          {/* User info card with reputation */}
          <div style={s.userCard}>
            <div style={s.userAvatar}>
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div style={s.userInfo}>
              <h2 style={s.userName}>{user?.name}</h2>
              <ReputationBadge
                points={userPoints || 0}
                showPoints={true}
                size="medium"
              />
            </div>
            <div style={s.userRole}>
              <span style={s.roleBadge}>{user?.role}</span>
            </div>
          </div>
          {/* Stat Cards */}
          <div style={s.statsGrid}>
            {[
              {
                label: 'Active Reports',
                value: loading ? '...' : stats.totalActiveReports,
                icon: '📑',
                color: '#2563EB',
                hint: 'Lost and found reports you have active',
              },
              {
                label: 'Matches Found',
                value: loading ? '...' : stats.matchesFound,
                icon: '🔍',
                color: '#F59E0B',
                hint: 'Potential matches for your items',
              },
              {
                label: 'Items Resolved',
                value: loading ? '...' : stats.resolvedItems,
                icon: '✅',
                color: '#10B981',
                hint: 'Items successfully returned',
              },
            ].map((stat) => (
              <div key={stat.label} style={s.statCard}>
                <div style={s.statTop}>
                  <span style={s.statLabel}>{stat.label}</span>
                  <div
                    style={{
                      ...s.statIconWrap,
                      backgroundColor: stat.color + '22',
                    }}
                  >
                    <span style={s.statIcon}>{stat.icon}</span>
                  </div>
                </div>
                <div style={s.statValue}>{stat.value}</div>
                <p style={s.statHint}>{stat.hint}</p>
              </div>
            ))}
          </div>

          <div style={s.bottomGrid}>
            {/* Recent Activity */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>Recent Activity</h2>
                <button style={s.viewAll} onClick={() => navigate('/my-items')}>
                  View All →
                </button>
              </div>

              {loading && <p style={s.empty}>Loading...</p>}

              {!loading && recentActivity.length === 0 && (
                <div style={s.emptyState}>
                  <p style={s.emptyIcon}>📋</p>
                  <p style={s.emptyText}>No activity yet</p>
                  <button
                    style={s.actionBtn}
                    onClick={() => navigate('/report-lost')}
                  >
                    Report a Lost Item
                  </button>
                </div>
              )}

              {recentActivity.map((item) => (
                <div key={item.id} style={s.activityItem}>
                  <div style={s.activityIconWrap}>
                    <span>{categoryEmoji[item.category]}</span>
                  </div>
                  <div style={s.activityInfo}>
                    <p style={s.activityTitle}>{item.title}</p>
                    <p style={s.activityMeta}>{formatTime(item.createdAt)}</p>
                  </div>
                  <span
                    style={{
                      ...s.statusBadge,
                      backgroundColor: statusColor[item.status] + '22',
                      color: statusColor[item.status],
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Recent Notifications */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>Recent Notifications</h2>
                <button
                  style={s.viewAll}
                  onClick={() => navigate('/notifications')}
                >
                  View All →
                </button>
              </div>

              {loading && <p style={s.empty}>Loading...</p>}

              {!loading && recentNotifications.length === 0 && (
                <div style={s.emptyState}>
                  <p style={s.emptyIcon}>🔔</p>
                  <p style={s.emptyText}>No notifications yet</p>
                </div>
              )}

              {recentNotifications.map((n, i) => (
                <div key={n.id || i} style={s.activityItem}>
                  <div style={s.activityIconWrap}>
                    <span>{getNotificationIcon(n.message)}</span>
                  </div>
                  <div style={s.activityInfo}>
                    <p style={s.activityTitle}>{n.message}</p>
                    <p style={s.activityMeta}>{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div style={s.unreadDot} />}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={s.quickActions}>
            <h2 style={s.cardTitle}>Quick Actions</h2>
            <div style={s.actionsRow}>
              {[
                {
                  label: '📋 Report Lost Item',
                  path: '/report-lost',
                  color: '#2563EB',
                },
                {
                  label: '🔍 Report Found Item',
                  path: '/report-found',
                  color: '#10B981',
                },
                {
                  label: '🗂️ Browse Lost Items',
                  path: '/browse-items',
                  color: '#F59E0B',
                },
                { label: '📦 My Items', path: '/my-items', color: '#8B5CF6' },
              ].map((action) => (
                <button
                  key={action.label}
                  style={{
                    ...s.quickBtn,
                    borderColor: action.color,
                    color: action.color,
                  }}
                  onClick={() => navigate(action.path)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = action.color + '22';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const s = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0F172A' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  content: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.25rem',
  },
  statCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  statLabel: { fontSize: '0.875rem', color: '#94A3B8', fontWeight: '500' },
  statIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: { fontSize: '1rem' },
  statValue: {
    fontSize: '2.25rem',
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: '0.25rem',
  },
  statHint: { fontSize: '0.775rem', color: '#94A3B8', margin: 0 },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  },
  card: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#F8FAFC',
    margin: 0,
  },
  viewAll: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#2563EB',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    padding: '1.5rem',
    fontSize: '0.875rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1.5rem',
  },
  emptyIcon: { fontSize: '2rem', margin: 0 },
  emptyText: { fontSize: '0.875rem', color: '#94A3B8', margin: 0 },
  actionBtn: {
    backgroundColor: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    marginTop: '0.5rem',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid #334155',
  },
  activityIconWrap: {
    width: '36px',
    height: '36px',
    backgroundColor: '#1E3A5F',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityInfo: { flex: 1 },
  activityTitle: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#F8FAFC',
    marginBottom: '0.2rem',
    lineHeight: '1.4',
  },
  activityMeta: { fontSize: '0.75rem', color: '#94A3B8', margin: 0 },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    flexShrink: 0,
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#2563EB',
    borderRadius: '50%',
    flexShrink: 0,
  },
  quickActions: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  actionsRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  quickBtn: {
    backgroundColor: 'transparent',
    border: '1px solid',
    borderRadius: '10px',
    padding: '0.75rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    transition: 'background-color 0.2s',
  },
  userCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userAvatar: {
    width: '52px',
    height: '52px',
    backgroundColor: '#2563EB',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'white',
    flexShrink: 0,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: '0.35rem',
  },
  userRole: { flexShrink: 0 },
  roleBadge: {
    fontSize: '0.75rem',
    backgroundColor: '#1E3A5F',
    color: '#60A5FA',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontWeight: '600',
  },
};

export default Dashboard;
