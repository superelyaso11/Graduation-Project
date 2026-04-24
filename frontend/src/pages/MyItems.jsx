import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const MyItems = () => {
  useAuth();
  const [lostItems, setLostItems] = useState([]); //user's lost item reports
  const [foundItems, setFoundItems] = useState([]); //user's found item reports
  const [incomingClaims, setIncomingClaims] = useState([]); //claims on user's found items
  const [myClaims, setMyClaims] = useState([]); //claims user submitted
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost'); //active tab
  const [claimModal, setClaimModal] = useState(false); //claim submission modal
  const [selectedMatch, setSelectedMatch] = useState(null); //match user is claiming
  const [claimData, setClaimData] = useState({ question: '', answer: '' }); //claim form data
  const [claimError, setClaimError] = useState(''); //claim submission error
  const [claimLoading, setClaimLoading] = useState(false); //claim submission loading state
  const [successMsg, setSuccessMsg] = useState(''); //success message after claim submission

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lost, found, incoming, mine] = await Promise.all([
        api.get('/lost-items/my'), //my lost items
        api.get('/found-items/my'), //my found items
        api.get('/claims/incoming'), //claims on my found items
        api.get('/claims/my'), //my submitted claims
      ]);
      setLostItems(lost.data);
      setFoundItems(found.data);
      setIncomingClaims(incoming.data);
      setMyClaims(mine.data);
    } catch (err) {
        console.error('Failed to fetch items', err) 
    } finally {
      setLoading(false);
    }
  };

  //open claim modal for a matched lost item
  const handleClaim = (item) => {
    setSelectedMatch(item);
    setClaimData({ question: '', answer: '' });
    setClaimError('');
    setClaimModal(true);
  };

  //submit a claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError('');

    if (!claimData.question || !claimData.answer) {
      setClaimError('Both fields are required');
      return;
    }

    setClaimLoading(true);
    try {
      // fetch the lost item with its matches to get the foundItemId
      const { data: lostItem } = await api.get(
        `/lost-items/${selectedMatch.id}`
      );
      const foundItemId = lostItem.matches?.[0]?.foundItemId || null;

      if (!foundItemId) {
        setClaimError('No match found for this item yet');
        setClaimLoading(false);
        return;
      }

      await api.post('/claims', {
        lostItemId: selectedMatch.id,
        foundItemId, // now sending the correct foundItemId
        question: claimData.question,
        answer: claimData.answer,
      });

      setClaimModal(false);
      setSuccessMsg('✅ Claim submitted! The finder will review it.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAll();
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };

  //approve a claim
  const handleApprove = async (claimId) => {
    try {
      await api.patch(`/claims/${claimId}/approve`);

      // update the claim status directly in state — no refetch needed
      setIncomingClaims(prev => prev.map(c =>
        c.id === claimId ? { ...c, status: 'APPROVED' } : c
      ));

      setSuccessMsg('✅ Claim approved! Item marked as resolved.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to approve claim:', err);
    }
  };

  //reject a claim
  const handleReject = async (claimId) => {
    try {
      await api.patch(`/claims/${claimId}/reject`);
      
      // update the claim status directly in state — no refetch needed
      setIncomingClaims(prev => prev.map(c =>
      c.id === claimId ? { ...c, status: 'REJECTED' } : c
      ));

      setSuccessMsg('❌ Claim rejected.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to reject claim:', err);
    }
  };

  const focusStyle = (e) => (e.target.style.borderColor = '#2563EB');
  const blurStyle = (e) => (e.target.style.borderColor = '#334155');

  //status badge color
  const statusColor = {
    ACTIVE: '#10B981',
    MATCHED: '#F59E0B',
    RESOLVED: '#2563EB',
    EXPIRED: '#94A3B8',
    DONATED: '#8B5CF6',
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <Navbar
          title="My Items"
          subtitle="Manage your lost and found reports"
        />

        <div style={s.content}>
          {successMsg && <div style={s.successBox}>{successMsg}</div>}

          {/* Tabs */}
          <div style={s.tabs}>
            {[
              { key: 'lost', label: `My Lost Items (${lostItems.length})` },
              {
                key: 'found',
                label: `My Found Reports (${foundItems.length})`,
              },
              {
                key: 'incoming',
                label: `Incoming Claims (${incomingClaims.length})`,
              },
              { key: 'myclaims', label: `My Claims (${myClaims.length})` },
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

          {/* My Lost Items */}
          {!loading && activeTab === 'lost' && (
            <div style={s.list}>
              {lostItems.length === 0 && (
                <p style={s.empty}>No lost item reports yet.</p>
              )}
              {lostItems.map((item) => (
                <div key={item.id} style={s.itemCard}>
                  <div style={s.itemLeft}>
                    <h3 style={s.itemTitle}>{item.title}</h3>
                    <p style={s.itemMeta}>
                      📍 {item.location} · 📅 {formatDate(item.dateLost)}
                    </p>
                    <p style={s.itemDesc}>{item.description}</p>
                  </div>
                  <div style={s.itemRight}>
                    <span
                      style={{
                        ...s.statusBadge,
                        backgroundColor: statusColor[item.status] + '22',
                        color: statusColor[item.status],
                      }}
                    >
                      {item.status}
                    </span>
                    {/* Show claim button if item is MATCHED */}
                    {item.status === 'MATCHED' && (
                      <button
                        style={s.claimBtn}
                        onClick={() => handleClaim(item)}
                      >
                        Submit Claim
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My Found Reports */}
          {!loading && activeTab === 'found' && (
            <div style={s.list}>
              {foundItems.length === 0 && (
                <p style={s.empty}>No found item reports yet.</p>
              )}
              {foundItems.map((item) => (
                <div key={item.id} style={s.itemCard}>
                  <div style={s.itemLeft}>
                    <h3 style={s.itemTitle}>{item.title}</h3>
                    <p style={s.itemMeta}>
                      📍 {item.location} · 📅 {formatDate(item.dateFound)}
                    </p>
                    <p style={s.itemDesc}>{item.description}</p>
                  </div>
                  <div style={s.itemRight}>
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
                </div>
              ))}
            </div>
          )}

          {/* Incoming Claims — finder reviews these */}
          {!loading && activeTab === 'incoming' && (
            <div style={s.list}>
              {incomingClaims.length === 0 && (
                <p style={s.empty}>No incoming claims yet.</p>
              )}
              {incomingClaims.map((claim) => (
                <div key={claim.id} style={s.itemCard}>
                  <div style={s.itemLeft}>
                    <h3 style={s.itemTitle}>
                      Claim for: {claim.foundItem?.title}
                    </h3>
                    <p style={s.itemMeta}>
                      👤 {claim.claimant?.name} · ⭐ {claim.claimant?.points}{' '}
                      pts
                    </p>
                    <p style={s.claimQuestion}>
                      <strong>Question:</strong> {claim.question}
                    </p>
                    <p style={s.claimAnswer}>
                      <strong>Their answer:</strong> {claim.answer}
                    </p>
                  </div>
                  <div style={s.itemRight}>
                    <span
                      style={{
                        ...s.statusBadge,
                        backgroundColor: '#F59E0B22',
                        color: '#F59E0B',
                      }}
                    >
                      {claim.status}
                    </span>
                    {/* Only show approve/reject if still pending */}
                    {claim.status === 'PENDING' && (
                      <div style={s.claimActions}>
                        <button
                          style={s.approveBtn}
                          onClick={() => handleApprove(claim.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          style={s.rejectBtn}
                          onClick={() => handleReject(claim.id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {/* Show contact info if approved */}
                    {claim.status === 'APPROVED' && (
                      <p style={s.contactInfo}>📧 {claim.claimant?.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My Submitted Claims */}
          {!loading && activeTab === 'myclaims' && (
            <div style={s.list}>
              {myClaims.length === 0 && (
                <p style={s.empty}>No claims submitted yet.</p>
              )}
              {myClaims.map((claim) => (
                <div key={claim.id} style={s.itemCard}>
                  <div style={s.itemLeft}>
                    <h3 style={s.itemTitle}>
                      Claim for:{' '}
                      {claim.foundItem?.title || claim.lostItem?.title}
                    </h3>
                    <p style={s.claimQuestion}>
                      <strong>Your answer:</strong> {claim.answer}
                    </p>
                  </div>
                  <div style={s.itemRight}>
                    <span
                      style={{
                        ...s.statusBadge,
                        backgroundColor:
                          claim.status === 'APPROVED'
                            ? '#10B98122'
                            : claim.status === 'REJECTED'
                              ? '#EF444422'
                              : '#F59E0B22',
                        color:
                          claim.status === 'APPROVED'
                            ? '#10B981'
                            : claim.status === 'REJECTED'
                              ? '#EF4444'
                              : '#F59E0B',
                      }}
                    >
                      {claim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Claim Modal */}
      {claimModal && (
        <div style={s.modalOverlay} onClick={() => setClaimModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Submit a Claim</h2>
            <p style={s.modalSubtitle}>
              Claiming:{' '}
              <strong style={{ color: '#F8FAFC' }}>
                {selectedMatch?.title}
              </strong>
            </p>
            <p style={s.modalHint}>
              💡 Set a verification question only you would know the answer to
              (e.g. "What color is the strap?")
            </p>

            {claimError && <div style={s.errorBox}>⚠️ {claimError}</div>}

            <form onSubmit={handleClaimSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Verification Question</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. What sticker is on the laptop?"
                  value={claimData.question}
                  onChange={(e) =>
                    setClaimData({ ...claimData, question: e.target.value })
                  }
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Your Answer</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="e.g. A blue dinosaur sticker"
                  value={claimData.answer}
                  onChange={(e) =>
                    setClaimData({ ...claimData, answer: e.target.value })
                  }
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div style={s.modalBtns}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => setClaimModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimLoading}
                  style={
                    claimLoading
                      ? { ...s.submitBtn, opacity: 0.6 }
                      : s.submitBtn
                  }
                >
                  {claimLoading ? 'Submitting...' : 'Submit Claim'}
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
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    padding: '3rem',
    fontSize: '0.95rem',
  },
  itemCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  itemLeft: { flex: 1 },
  itemTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: '0.35rem',
  },
  itemMeta: { fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.5rem' },
  itemDesc: { fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.5' },
  itemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.75rem',
    flexShrink: 0,
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
  },
  claimBtn: {
    backgroundColor: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
  claimQuestion: { fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.5rem' },
  claimAnswer: { fontSize: '0.85rem', color: '#F8FAFC', marginTop: '0.25rem' },
  claimActions: { display: 'flex', gap: '0.5rem' },
  approveBtn: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
  contactInfo: { fontSize: '0.85rem', color: '#10B981', fontWeight: '600' },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
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
    marginBottom: '0.75rem',
  },
  modalHint: {
    fontSize: '0.8rem',
    color: '#60A5FA',
    backgroundColor: '#1E3A5F',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1.25rem',
    lineHeight: '1.5',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#FCA5A5',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
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
    transition: 'border-color 0.2s',
    fontFamily: 'Sora, sans-serif',
  },
  modalBtns: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
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

export default MyItems;
