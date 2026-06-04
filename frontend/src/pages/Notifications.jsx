import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Search,
  AlertCircle,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';

const ITEMS_PER_PAGE = 10;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); //current page for pagination
  const { socket } = useSocket(); //listen for real-time events
  const { isDark } = useTheme();

  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const rowBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const rowHover = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const cyanBg = isDark ? 'rgba(34,211,238,0.1)' : 'rgba(8,145,178,0.1)';
  const gridLine = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';
  const btnText = isDark ? '#050709' : '#fff';

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (message.includes('match'))
      return { icon: Search, color: cyan, bg: cyanBg };
    if (message.includes('approved'))
      return {
        icon: CheckCircle2,
        color: '#10B981',
        bg: 'rgba(16,185,129,0.12)',
      };
    if (message.includes('rejected'))
      return {
        icon: AlertCircle,
        color: '#F43F5E',
        bg: 'rgba(244,63,94,0.12)',
      };
    if (message.includes('💬') || message.includes('message'))
      return {
        icon: MessageSquare,
        color: '#A78BFA',
        bg: 'rgba(167,139,250,0.12)',
      };
    if (message.includes('expired'))
      return { icon: Clock, color: '#64748B', bg: 'rgba(100,116,139,0.12)' };
    return { icon: Bell, color: cyan, bg: cyanBg };
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
              transition: 'background-color 0.3s',
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
                  <Bell size={13} style={{ color: cyan }} />
                  <span
                    style={{
                      color: cyan,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                    }}
                  >
                    NOTIFICATIONS
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
                  Your Updates
                </h1>
                <p style={{ color: textMut, fontSize: 13, marginTop: 4 }}>
                  Stay on top of matches, claims and messages
                </p>
              </div>
              {notifications.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0.5rem 1rem',
                    borderRadius: 10,
                    backgroundColor: cyanBg,
                    border: `1px solid ${cyan}30`,
                  }}
                >
                  <Bell size={14} style={{ color: cyan }} />
                  <span style={{ color: cyan, fontSize: 13, fontWeight: 700 }}>
                    {notifications.length} total
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Content */}
          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 16,
                    padding: '1.25rem',
                    backgroundColor: cardBg,
                    border: `1px solid ${border}`,
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: rowBg,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        height: 14,
                        borderRadius: 6,
                        backgroundColor: rowBg,
                        width: '60%',
                      }}
                    />
                    <div
                      style={{
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: rowBg,
                        width: '40%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5rem 0',
                borderRadius: 20,
                backgroundColor: cardBg,
                border: `1px solid ${border}`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Bell size={48} style={{ color: textMut, marginBottom: 16 }} />
              </motion.div>
              <div
                style={{
                  color: textPri,
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 16,
                }}
              >
                All caught up
              </div>
              <p style={{ color: textMut, fontSize: 14, marginTop: 4 }}>
                You'll be notified when matches, claims or messages arrive
              </p>
            </motion.div>
          )}

          {!loading && notifications.length > 0 && (
            <>
              {/* Page info */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ color: textMut, fontSize: 13 }}>
                    {notifications.length} notification
                    {notifications.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ color: textMut, fontSize: 13 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}

              {/* Notification list */}
              <motion.div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                }}
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.05 } },
                }}
              >
                <AnimatePresence>
                  {currentNotifications.map((n, i) => {
                    const {
                      icon: Icon,
                      color,
                      bg: iconBg,
                    } = getIcon(n.message);
                    return (
                      <motion.div
                        key={n.id || i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem 1.25rem',
                          borderRadius: 16,
                          backgroundColor: n.isRead
                            ? rowBg
                            : isDark
                              ? 'rgba(34,211,238,0.04)'
                              : 'rgba(8,145,178,0.04)',
                          border: `1px solid ${n.isRead ? border : `${cyan}20`}`,
                          cursor: 'default',
                          transition: 'background-color 0.2s',
                        }}
                        variants={{
                          hidden: { opacity: 0, y: 8 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                        }}
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
                            backgroundColor: iconBg,
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} style={{ color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              color: textPri,
                              fontSize: '0.875rem',
                              fontWeight: n.isRead ? 500 : 600,
                              margin: '0 0 0.25rem',
                              lineHeight: 1.4,
                            }}
                          >
                            {n.message}
                          </p>
                          <p
                            style={{
                              color: textMut,
                              fontSize: '0.75rem',
                              margin: 0,
                            }}
                          >
                            {formatTime(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <motion.div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: cyan,
                              flexShrink: 0,
                            }}
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <motion.button
                    style={{
                      padding: '0.5rem 0.875rem',
                      borderRadius: 10,
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
                      color: textMut,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.4 : 1,
                      fontFamily: 'inherit',
                    }}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    whileTap={currentPage !== 1 ? { scale: 0.97 } : {}}
                  >
                    ← Prev
                  </motion.button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <motion.button
                        key={page}
                        style={{
                          padding: '0.5rem 0.875rem',
                          borderRadius: 10,
                          backgroundColor: page === currentPage ? cyan : cardBg,
                          border: `1px solid ${page === currentPage ? cyan : border}`,
                          color: page === currentPage ? btnText : textMut,
                          fontSize: 13,
                          fontWeight: page === currentPage ? 700 : 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                        onClick={() => goToPage(page)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {page}
                      </motion.button>
                    )
                  )}

                  <motion.button
                    style={{
                      padding: '0.5rem 0.875rem',
                      borderRadius: 10,
                      backgroundColor: cardBg,
                      border: `1px solid ${border}`,
                      color: textMut,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor:
                        currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      fontFamily: 'inherit',
                    }}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    whileTap={currentPage !== totalPages ? { scale: 0.97 } : {}}
                  >
                    Next →
                  </motion.button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;
