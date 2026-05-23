import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { data } from 'react-router-dom';

const SecurityDashboard = () => {
  const [items, setItems] = useState([]); //all found items
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [holdModal, setHoldModal] = useState(false); //modal for marking as held
  const [selectedItem, setSelectedItem] = useState(null);
  const [heldAt, setHeldAt] = useState('');
  const [activeTab, setActiveTab] = useState('all'); //filter tab

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/security/items');
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHold = async () => {
    try {
      await api.patch(`/security/items/${selectedItem.id}/hold`, { heldAt });
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, heldAt: data.heldAt } : item
        )
      );
      setHoldModal(false);
      setSuccessMsg('✅ Item marked as held at security.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchItems();
    } catch (err) {
      console.error('Failed to update item', err);
    }
  };

  const handleResolve = async (itemId) => {
    if (!window.confirm('Confirm that the owner has collected this item?'))
      return;
    try {
      await api.patch(`/security/items/${itemId}/resolve`);
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'RESOLVED' } : item
        )
      );
      setSuccessMsg('✅ Item marked as resolved.');
      await fetchItems();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to resolve item', err);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const statusColor = {
    ACTIVE: '#10B981',
    MATCHED: '#F59E0B',
    RESOLVED: '#2563EB',
    EXPIRED: '#94A3B8',
    DONATED: '#8B5CF6',
  };

  //filter items based on active tab
  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'held') return item.heldAt; //items held at security
    if (activeTab === 'matched') return item.status === 'MATCHED';
    if (activeTab === 'resolved') return item.status === 'RESOLVED';
    return true;
  });

  const categoryEmoji = {
    ELECTRONICS: '💻',
    CLOTHING: '👕',
    ACCESSORIES: '🔑',
    STATIONERY: '📚',
    ID_CARDS: '🪪',
    SPORTS: '⚽',
    OTHER: '📦',
  };
  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <Navbar
          title="Security Dashboard"
          subtitle="Manage physically held lost and found items"
        />

        <div style={s.content}>
          {successMsg && <div style={s.successBox}>{successMsg}</div>}

          {/* Stats row */}
          <div style={s.statsRow}>
            {[
              { label: 'Total Items', value: items.length, icon: '📦' },
              {
                label: 'Held at Security',
                value: items.filter((i) => i.heldAt).length,
                icon: '🏢',
              },
              {
                label: 'Matched',
                value: items.filter((i) => i.status === 'MATCHED').length,
                icon: '🔍',
              },
              {
                label: 'Resolved',
                value: items.filter((i) => i.status === 'RESOLVED').length,
                icon: '✅',
              },
            ].map((stat) => (
              <div key={stat.label} style={s.statCard}>
                <span style={s.statIcon}>{stat.icon}</span>
                <div>
                  <p style={s.statValue}>{stat.value}</p>
                  <p style={s.statLabel}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            {[
              { key: 'all', label: 'All Items' },
              { key: 'held', label: 'Held at Security' },
              { key: 'matched', label: 'Matched' },
              { key: 'resolved', label: 'Resolved' },
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

          {loading && <p style={s.empty}>Loading items...</p>}

          {!loading && filteredItems.length === 0 && (
            <p style={s.empty}>No items found.</p>
          )}

          {/* Items list */}
          <div style={s.list}>
            {filteredItems.map((item) => (
              <div key={item.id} style={s.itemCard}>
                {/* Image */}
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
                    {categoryEmoji[item.category]}{' '}
                    {item.category.replace('_', ' ')} · 📍 {item.location} · 📅{' '}
                    {formatDate(item.dateFound)}
                  </p>
                  <p style={s.itemDesc}>{item.description}</p>
                  <p style={s.itemReporter}>
                    👤 Reported by: {item.user?.name} · {item.user?.email}
                  </p>
                  {item.heldAt && (
                    <p style={s.heldTag}>🏢 Currently held at: {item.heldAt}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div style={s.itemActions}>
                  {item.status !== 'RESOLVED' && (
                    <button
                      style={s.holdBtn}
                      onClick={() => {
                        setSelectedItem(item);
                        setHeldAt(item.heldAt || 'Security Office');
                        setHoldModal(true);
                      }}
                    >
                      🏢 {item.heldAt ? 'Update Location' : 'Mark as Held'}
                    </button>
                  )}

                  {item.status !== 'RESOLVED' &&
                    (item.heldAt || item.status === 'MATCHED') && (
                      <button
                        style={s.resolveBtn}
                        onClick={() => handleResolve(item.id)}
                      >
                        ✅ Owner Collected
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Hold Modal */}
      {holdModal && (
        <div style={s.modalOverlay} onClick={() => setHoldModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Mark as Held at Security</h2>
            <p style={s.modalSubtitle}>
              Item:{' '}
              <strong style={{ color: '#F8FAFC' }}>
                {selectedItem?.title}
              </strong>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleHold();
              }}
              style={s.form}
            >
              <div style={s.field}>
                <label style={s.label}>Location where item is held</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. Security Office, Building A"
                  value={heldAt}
                  onChange={(e) => setHeldAt(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                />
              </div>
              <div style={s.modalBtns}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => setHoldModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={s.submitBtn}>
                  Confirm
                </button>
              </div>
            </form>
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIcon: { fontSize: '1.5rem' },
  statValue: { fontSize: '1.5rem', fontWeight: '800', color: '#F8FAFC' },
  statLabel: { fontSize: '0.75rem', color: '#94A3B8' },
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
  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    padding: '3rem',
    fontSize: '0.95rem',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  itemCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    flexShrink: 0,
  },
  itemLeft: { flex: 1 },
  itemTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.35rem',
  },
  itemTitle: { fontSize: '1rem', fontWeight: '700', color: '#F8FAFC' },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
  },
  itemMeta: { fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.4rem' },
  itemDesc: { fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.4rem' },
  itemReporter: { fontSize: '0.8rem', color: '#60A5FA' },
  heldTag: { fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' },
  itemActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flexShrink: 0,
  },
  holdBtn: {
    backgroundColor: '#1E3A5F',
    color: '#60A5FA',
    border: '1px solid #2563EB',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    whiteSpace: 'nowrap',
  },
  resolveBtn: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    color: '#10B981',
    border: '1px solid #10B981',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
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
    marginBottom: '0.5rem',
  },
  modalSubtitle: {
    fontSize: '0.875rem',
    color: '#94A3B8',
    marginBottom: '1.5rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: '500', color: '#F8FAFC' },
  input: {
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#F8FAFC',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'Sora, sans-serif',
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
  submitBtn: {
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

export default SecurityDashboard;
