import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useSocket } from '../context/SocketContext';

const ITEMS_PER_PAGE = 10;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); //current page for pagination
  const { socket } = useSocket(); //listen for real-time events

  useEffect(() => {
    fetchNotifications();
  }, []);

  //listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]); //add to top instantly
    });

    return () => socket.off('new_notification');
  }, [socket]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);

      await api.patch('/notifications/read-all'); //mark all as read when page is opened
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  //pagination logic
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE); //total number of pages
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE; //first item index
  const endIndex = startIndex + ITEMS_PER_PAGE; //last item index
  const currentNotifications = notifications.slice(startIndex, endIndex); //items for current page

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    // 1. Update the state first
    setCurrentPage(page);

    // 2. Define the animation
    const duration = 600; // Total time in ms
    const start = window.pageYOffset;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      //starts fast, slows down smoothly
      const ease = 1 - Math.pow(1 - progress, 3);

      window.scrollTo(0, start * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const formatTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getIcon = (message) => {
    if (message.includes('match')) return '🔍';
    if (message.includes('approved')) return '✅';
    if (message.includes('rejected')) return '❌';
    if (message.includes('claim')) return '📋';
    return '🔔';
  };

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <Navbar
          title="Notifications"
          subtitle="Stay updated on your items and claims"
        />

        <div style={s.content}>
          {loading && <p style={s.empty}>Loading notifications...</p>}

          {!loading && notifications.length === 0 && (
            <div style={s.emptyState}>
              <p style={s.emptyIcon}>🔔</p>
              <p style={s.emptyText}>No notifications yet</p>
              <p style={s.emptySubtext}>
                You'll be notified when a match is found or a claim is updated
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <>
              {/* Count and page info */}
              <div style={s.pageInfo}>
                <p style={s.countText}>
                  {notifications.length} notification
                  {notifications.length !== 1 ? 's' : ''}
                </p>
                <p style={s.pageText}>
                  Page {currentPage} of {totalPages}
                </p>
              </div>

              {/* Notifications list */}
              <div style={s.list}>
                {currentNotifications.map((n, i) => (
                  <div key={n.id || i} style={s.card}>
                    <div style={s.iconWrap}>
                      <span style={s.icon}>{getIcon(n.message)}</span>
                    </div>
                    <div style={s.info}>
                      <p style={s.message}>{n.message}</p>
                      <p style={s.time}>{formatTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div style={s.unreadDot} />}
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={s.pagination}>
                  {/* Previous button */}
                  <button
                    style={
                      currentPage === 1
                        ? { ...s.pageBtn, ...s.pageBtnDisabled }
                        : s.pageBtn
                    }
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </button>

                  {/* Page number buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        style={
                          page === currentPage
                            ? { ...s.pageBtn, ...s.pageBtnActive } // highlight current page
                            : s.pageBtn
                        }
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* Next button */}
                  <button
                    style={
                      currentPage === totalPages
                        ? { ...s.pageBtn, ...s.pageBtnDisabled }
                        : s.pageBtn
                    }
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const s = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0F172A' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  content: { padding: '2rem', maxWidth: '700px', width: '100%' },
  empty: { color: '#94A3B8', textAlign: 'center', padding: '3rem' },
  emptyState: { textAlign: 'center', padding: '4rem 2rem' },
  emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
  emptyText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: '0.5rem',
  },
  emptySubtext: { fontSize: '0.875rem', color: '#94A3B8' },
  pageInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  countText: { fontSize: '0.875rem', color: '#94A3B8' },
  pageText: { fontSize: '0.875rem', color: '#94A3B8' },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
  },
  iconWrap: {
    width: '42px',
    height: '42px',
    backgroundColor: '#1E3A5F',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: '1.1rem' },
  info: { flex: 1 },
  message: {
    fontSize: '0.9rem',
    color: '#F8FAFC',
    fontWeight: '500',
    marginBottom: '0.25rem',
    lineHeight: '1.4',
  },
  time: { fontSize: '0.775rem', color: '#94A3B8' },
  unreadDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#2563EB',
    borderRadius: '50%',
    flexShrink: 0,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  pageBtn: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    color: '#F8FAFC',
    borderRadius: '8px',
    padding: '0.5rem 0.875rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    transition: 'all 0.2s',
  },
  pageBtnActive: {
    backgroundColor: '#2563EB',
    border: '1px solid #2563EB',
    color: 'white',
  },
  pageBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
};

export default Notifications;
