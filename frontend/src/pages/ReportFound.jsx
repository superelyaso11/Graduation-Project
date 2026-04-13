import {useState, useEffect} from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const CATEGORIES = [
    {value: 'ELECTRONICS', label: 'Electronics'},
    {value: 'CLOTHING', label: 'Clothing & Bags'},
    {value: 'ACCESSORIES', label: 'Accessories'},
    {value: 'STATIONERY', label: 'Stationery'},
    {value: 'ID_CARDS', label: 'ID Cards'},
    {value: 'SPORTS', label: 'Sports Equipment'},
    {value: 'OTHER', label: 'Other'},
]

const ReportFound = () => {
    const { user } = useAuth()

  const [items, setItems] = useState([])               // all lost items
  const [loading, setLoading] = useState(true)         // loading state
  const [search, setSearch] = useState('')             // search input
  const [category, setCategory] = useState('')         // category filter
  const [selectedItem, setSelectedItem] = useState(null) // item user clicked "I Found This"
  const [modalOpen, setModalOpen] = useState(false)    // modal visibility
  const [modalData, setModalData] = useState({ location: '', dateFound: '', heldAt: '' })
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const fetchItems = async () => {
    setLoading(true)
    try {
        const params = {}
        if (category) params.category = category
        const { data } = await api.get('/lost-items', {params})
        setItems(data.filter(item => item.status === 'ACTIVE'))
    } catch (err) {
        console.error('Failed to fetch items', err)
    } finally {
        setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleFoundThis = (item) => {
    setSelectedItem(item)
    setModalData({ location: '', dateFound: '', heldAt: ''})
    setModalError('')
    setModalOpen(true)
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!modalData.location || !modalData.dateFound) {
        setModalError('Location and date found are required')
        return
    }

    setModalLoading(true)
    try{
        await api.post(`/found-items/match/${selectedItem.id}`, modalData)
        setModalOpen(false)
        setSuccessMsg(`✅ Thank you! The owner of "${selectedItem.title}" has been notified.`)
        fetchItems() // refresh list to remove matched item
        setTimeout(() => setSuccessMsg(''), 4000) // hide success message after 4 seconds
    } catch (err) {
        setModalError(err.response?.data?.message || 'Failed to submit report')
    } finally {
        setModalLoading(false)
    }
  }
  const focusStyle = (e) => e.target.style.borderColor = '#2563EB'
  const blurStyle = (e) => e.target.style.borderColor = '#334155'

  // format date nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  // get emoji for each category
  const categoryEmoji = {
    ELECTRONICS: '💻', CLOTHING: '👕', ACCESSORIES: '🔑',
    STATIONERY: '📚', ID_CARDS: '🪪', SPORTS: '⚽', OTHER: '📦'
  }

  return (
    <div style={s.layout}>

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main style={s.main}>
        <Navbar title='Browse Lost Items' subtitle='Found something? Help reunite it with its owner' />

        <div style={s.content}>

          {/* Success message */}
          {successMsg && (
            <div style={s.successBox}>{successMsg}</div>
          )}

          {/* Search + Filter bar */}
          <div style={s.filterBar}>
            <input
              style={{ ...s.searchInput }}
              type='text'
              placeholder='🔍  Search by title, location, or description...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={focusStyle} onBlur={blurStyle}
            />
            <select
              style={{ ...s.filterSelect, cursor: 'pointer' }}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Items count */}
          <p style={s.countText}>
            {filteredItems.length} active lost {filteredItems.length === 1 ? 'item' : 'items'}
          </p>

          {/* Loading */}
          {loading && (
            <div style={s.emptyState}>Loading items...</div>
          )}

          {/* Empty state */}
          {!loading && filteredItems.length === 0 && (
            <div style={s.emptyState}>
              <p style={{ fontSize: '2rem' }}>🎉</p>
              <p>No active lost items found!</p>
            </div>
          )}

          {/* Items grid */}
          <div style={s.grid}>
            {filteredItems.map(item => (
              <div key={item.id} style={s.card}>

                {/* Category badge */}
                <div style={s.cardHeader}>
                  <span style={s.categoryBadge}>
                    {categoryEmoji[item.category]} {item.category.replace('_', ' ')}
                  </span>
                  <span style={s.dateBadge}>Lost {formatDate(item.dateLost)}</span>
                </div>

                {/* Item image if exists */}
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title}
                    style={s.itemImage} />
                )}

                <h3 style={s.cardTitle}>{item.title}</h3>
                <p style={s.cardDesc}>{item.description}</p>

                <div style={s.cardFooter}>
                  <span style={s.locationTag}>📍 {item.location}</span>
                  <span style={s.reporterTag}>
                    👤 {item.user?.name}
                  </span>
                </div>

                {/* Only show button if not the user's own item */}
                {item.userId !== user?.id ? (
                  <button
                    style={s.foundBtn}
                    onClick={() => handleFoundThis(item)}
                    onMouseEnter={e => e.target.style.backgroundColor = '#1D4ED8'}
                    onMouseLeave={e => e.target.style.backgroundColor = '#2563EB'}
                  >
                    ✋ I Found This
                  </button>
                ) : (
                  <div style={s.ownItemTag}>📌 Your report</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div style={s.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>  {/* stop click from closing */}

            <h2 style={s.modalTitle}>I Found This Item</h2>
            <p style={s.modalSubtitle}>
              You're reporting that you found: <strong style={{ color: '#F8FAFC' }}>{selectedItem?.title}</strong>
            </p>

            {modalError && <div style={s.errorBox}>⚠️ {modalError}</div>}

            <form onSubmit={handleModalSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Where did you find it?</label>
                <input
                  style={s.input} type='text'
                  placeholder='e.g. Library 2nd Floor'
                  value={modalData.location}
                  onChange={e => setModalData({ ...modalData, location: e.target.value })}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>When did you find it?</label>
                <input
                  style={s.input} type='date'
                  value={modalData.dateFound}
                  onChange={e => setModalData({ ...modalData, dateFound: e.target.value })}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>
                  Where is it now? <span style={{ color: '#94A3B8', fontWeight: '400' }}>(optional)</span>
                </label>
                <input
                  style={s.input} type='text'
                  placeholder='e.g. Security Office, I have it with me'
                  value={modalData.heldAt}
                  onChange={e => setModalData({ ...modalData, heldAt: e.target.value })}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>

              <div style={s.modalBtns}>
                <button type='button' style={s.cancelBtn}
                  onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type='submit' disabled={modalLoading}
                  style={modalLoading ? { ...s.submitBtn, opacity: 0.6 } : s.submitBtn}
                  onMouseEnter={e => { if (!modalLoading) e.target.style.backgroundColor = '#1D4ED8' }}
                  onMouseLeave={e => { if (!modalLoading) e.target.style.backgroundColor = '#2563EB' }}
                >
                  {modalLoading ? 'Submitting...' : 'Confirm Found'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0F172A' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  content: { padding: '2rem' },
  successBox: { backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.25rem' },
  filterBar: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  searchInput: { flex: 1, backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem 1rem', color: '#F8FAFC', fontSize: '0.95rem', outline: 'none', fontFamily: 'Sora, sans-serif' },
  filterSelect: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem 1rem', color: '#F8FAFC', fontSize: '0.875rem', outline: 'none', fontFamily: 'Sora, sans-serif' },
  countText: { fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.25rem' },
  emptyState: { textAlign: 'center', color: '#94A3B8', padding: '4rem', fontSize: '0.95rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' },
  card: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { fontSize: '0.75rem', backgroundColor: '#1E3A5F', color: '#60A5FA', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '600' },
  dateBadge: { fontSize: '0.75rem', color: '#94A3B8' },
  itemImage: { width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' },
  cardTitle: { fontSize: '1rem', fontWeight: '700', color: '#F8FAFC' },
  cardDesc: { fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  locationTag: { fontSize: '0.8rem', color: '#94A3B8' },
  reporterTag: { fontSize: '0.8rem', color: '#94A3B8' },
  foundBtn: { width: '100%', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', padding: '0.65rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', fontFamily: 'Sora, sans-serif', marginTop: '0.25rem' },
  ownItemTag: { textAlign: 'center', fontSize: '0.8rem', color: '#94A3B8', padding: '0.5rem' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
  modal: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px' },
  modalTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '0.5rem' },
  modalSubtitle: { fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: '500', color: '#F8FAFC' },
  input: { backgroundColor: '#0D1B2E', border: '1px solid #334155', borderRadius: '10px', padding: '0.75rem 1rem', color: '#F8FAFC', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Sora, sans-serif' },
  modalBtns: { display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
  cancelBtn: { backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '10px', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Sora, sans-serif' },
  submitBtn: { backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', fontFamily: 'Sora, sans-serif' },
}

export default ReportFound