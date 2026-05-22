import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ROLES = ['STUDENT', 'SECURITY', 'ADMIN'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [roleModal, setRoleModal] = useState(false); //role change confirmation modal
  const [selectedUser, setSelectedUser] = useState(null); //user being edited
  const [newRole, setNewRole] = useState(''); //new role to assign

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
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
  };

  //open role change modal
  const handleRoleChange = (user, role) => {
    setSelectedUser(user);
    setNewRole(role);
    setRoleModal(true);
  };

  //confirm and apply role change
  const confirmRoleChange = async () => {
    try {
      const { data } = await api.patch(`/admin/users/${selectedUser.id}/role`, {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: data.role } : u
        )
      );
      setRoleModal(false);
      setSuccessMsg(`✅ ${selectedUser.name}'s role updated to ${newRole}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setSuccessMsg(
        '❌ ' + (err.response?.data?.message || 'Failed to update role')
      );
      setTimeout(() => setSuccessMsg(''), 4000);
      setRoleModal(false);
    }
  };

  //delete a lost item
  const handleDeleteLost = async (id) => {
    if (!window.confirm('Delete this lost item permanently?')) return;

    try {
      await api.delete(`/admin/lost/${id}`);
      setLostItems((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg('🗑️ Lost item deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  //delete a found item
  const handleDeleteFound = async (id) => {
    if (!window.confirm('Delete this found item report permanently?')) return;
    try {
      await api.delete(`/admin/found/${id}`);
      setFoundItems((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg('🗑️ Found item deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  //approve donation for expired item
  const handleDonate = async (id) => {
    if (!window.confirm('Mark this item as donated?')) return;

    try {
      await api.patch(`/admin/lost/${id}/donate`);
      setExpiredItems((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg('✅ Item marked as donated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to donate', err);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const roleColor = {
    STUDENT: '#10B981',
    SECURITY: '#F59E0B',
    ADMIN: '#EF4444',
  };
  const statusColor = {
    ACTIVE: '#10B981',
    MATCHED: '#F59E0B',
    RESOLVED: '#2563EB',
    EXPIRED: '#94A3B8',
    DONATED: '#8B5CF6',
  };

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <Navbar
          title="Admin Dashboard"
          subtitle="Manage users, reports, and platform settings"
        />

        <div style={s.content}>
          {successMsg && <div style={s.successBox}>{successMsg}</div>}

          {/* Tabs */}
          <div style={s.tabs}>
            {[
              { key: 'overview', label: '📊 Overview' },
              { key: 'users', label: `👥 Users (${users.length})` },
              { key: 'lost', label: `📋 Lost Items (${lostItems.length})` },
              { key: 'found', label: `📋 Found Items (${foundItems.length})` },
              { key: 'expired', label: `⏰ Expired (${expiredItems.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                style={
                  activeTab === tab.key ? { ...s.tab, ...s.tabActive } : s.tab
                }
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && <p style={s.empty}>Loading...</p>}

          {/* Overview Tab */}
          {!loading && activeTab === 'overview' && stats && (
            <div style={s.statsGrid}>
              {[
                {
                  label: 'Total Users',
                  value: stats.totalUsers,
                  icon: '👥',
                  color: '#2563EB',
                },
                {
                  label: 'Lost Reports',
                  value: stats.totalLostItems,
                  icon: '🔍',
                  color: '#F59E0B',
                },
                {
                  label: 'Found Reports',
                  value: stats.totalFoundItems,
                  icon: '📦',
                  color: '#10B981',
                },
                {
                  label: 'Total Matches',
                  value: stats.totalMatches,
                  icon: '🔗',
                  color: '#8B5CF6',
                },
                {
                  label: 'Resolved Items',
                  value: stats.resolvedItems,
                  icon: '✅',
                  color: '#10B981',
                },
                {
                  label: 'Active Reports',
                  value: stats.activeItems,
                  icon: '⏳',
                  color: '#F59E0B',
                },
              ].map((stat) => (
                <div key={stat.label} style={s.statCard}>
                  <div
                    style={{
                      ...s.statIconWrap,
                      backgroundColor: stat.color + '22',
                    }}
                  >
                    <span style={s.statIcon}>{stat.icon}</span>
                  </div>
                  <div>
                    <p style={s.statValue}>{stat.value}</p>
                    <p style={s.statLabel}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users Tab */}
          {!loading && activeTab === 'users' && (
            <div style={s.list}>
              {users.map((user) => (
                <div key={user.id} style={s.itemCard}>
                  <div style={s.userAvatar}>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div style={s.itemLeft}>
                    <div style={s.itemTopRow}>
                      <h3 style={s.itemTitle}>{user.name}</h3>
                      <span
                        style={{
                          ...s.roleBadge,
                          backgroundColor: roleColor[user.role] + '22',
                          color: roleColor[user.role],
                        }}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p style={s.itemMeta}>
                      ✉️ {user.email} · ⭐ {user.points} pts · 📦{' '}
                      {user._count.lostItems} lost · 🔍 {user._count.foundItems}{' '}
                      found · 📅 Joined {formatDate(user.createdAt)}
                    </p>
                  </div>

                  {/* Role change dropdown */}
                  <div style={s.roleSelect}>
                    <select
                      style={s.select}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lost Items Tab */}
          {!loading && activeTab === 'lost' && (
            <div style={s.list}>
              {lostItems.map((item) => (
                <div key={item.id} style={s.itemCard}>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={s.itemImage}
                    />
                  )}
                  <div style={s.itemLeft}>
                    <div style={s.itemTopRow}>
                      <h3 style={s.itemTitle}>{item.title}</h3>
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
                    <p style={s.itemMeta}>
                      📍 {item.location} · 📅 {formatDate(item.dateLost)}
                    </p>
                    <p style={s.itemMeta}>
                      👤 {item.user?.name} · ✉️ {item.user?.email}
                    </p>
                  </div>
                  <button
                    style={s.deleteBtn}
                    onClick={() => handleDeleteLost(item.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Found Items Tab */}
          {!loading && activeTab === 'found' && (
            <div style={s.list}>
              {foundItems.map((item) => (
                <div key={item.id} style={s.itemCard}>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={s.itemImage}
                    />
                  )}
                  <div style={s.itemLeft}>
                    <div style={s.itemTopRow}>
                      <h3 style={s.itemTitle}>{item.title}</h3>
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
                    <p style={s.itemMeta}>
                      📍 {item.location} · 📅 {formatDate(item.dateFound)}
                    </p>
                    <p style={s.itemMeta}>
                      👤 {item.user?.name} · ✉️ {item.user?.email}
                    </p>
                  </div>
                  <button
                    style={s.deleteBtn}
                    onClick={() => handleDeleteFound(item.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Expired Items Tab */}
          {!loading && activeTab === 'expired' && (
            <div style={s.list}>
              {expiredItems.length === 0 && (
                <p style={s.empty}>No expired items pending donation.</p>
              )}
              {expiredItems.map((item) => (
                <div key={item.id} style={s.itemCard}>
                  <div style={s.itemLeft}>
                    <h3 style={s.itemTitle}>{item.title}</h3>
                    <p style={s.itemMeta}>
                      📍 {item.location} · 📅 {formatDate(item.dateLost)}
                    </p>
                    <p style={s.itemMeta}>
                      👤 {item.user?.name} · ✉️ {item.user?.email}
                    </p>
                  </div>
                  <button
                    style={s.donateBtn}
                    onClick={() => handleDonate(item.id)}
                  >
                    🎁 Approve Donation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Role Change Confirmation Modal */}
      {roleModal && (
        <div style={s.modalOverlay} onClick={() => setRoleModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Confirm Role Change</h2>
            <p style={s.modalText}>
              Are you sure you want to change{' '}
              <strong style={{ color: '#F8FAFC' }}>{selectedUser?.name}</strong>
              's role from{' '}
              <strong style={{ color: roleColor[selectedUser?.role] }}>
                {selectedUser?.role}
              </strong>{' '}
              to{' '}
              <strong style={{ color: roleColor[newRole] }}>{newRole}</strong>?
            </p>
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => setRoleModal(false)}>
                Cancel
              </button>
              <button style={s.confirmBtn} onClick={confirmRoleChange}>
                Yes, Change Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0F172A' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  content: { padding: '2rem' },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#6EE7B7',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: '#2563EB',
    color: '#F8FAFC',
    border: '1px solid #2563EB',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  statCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statIcon: { fontSize: '1.25rem' },
  statValue: { fontSize: '1.75rem', fontWeight: '800', color: '#F8FAFC' },
  statLabel: { fontSize: '0.775rem', color: '#94A3B8' },
  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    padding: '3rem',
    fontSize: '0.95rem',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  itemCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userAvatar: {
    width: '42px',
    height: '42px',
    backgroundColor: '#2563EB',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'white',
    flexShrink: 0,
  },
  itemImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
    flexShrink: 0,
  },
  itemLeft: { flex: 1 },
  itemTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.3rem',
  },
  itemTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#F8FAFC' },
  roleBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
  },
  itemMeta: { fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.2rem' },
  roleSelect: { flexShrink: 0 },
  select: {
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    color: '#F8FAFC',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    outline: 'none',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #EF4444',
    color: '#EF4444',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    flexShrink: 0,
  },
  donateBtn: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    border: '1px solid #8B5CF6',
    color: '#8B5CF6',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '440px',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: '1rem',
  },
  modalText: {
    fontSize: '0.9rem',
    color: '#94A3B8',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
  },
  modalBtns: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
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
  confirmBtn: {
    backgroundColor: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
};

export default AdminDashboard;
