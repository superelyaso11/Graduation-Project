import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { socket } = useSocket();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnread(data.filter((n) => !n.isRead).length); //count unread
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  //fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //listen for real-time notifications from server
  useEffect(() => {
    if (!socket) return; //wait for socket to connect

    //when server emits new_notification, add it to the list instantly
    socket.on('new_notification', (notification) => {
      console.log('New real-time notification:', notification);

      setNotifications((prev) => [notification, ...prev]); //add to top of list
      setUnread((prev) => prev + 1); //increment badge
    });

    //cleanup listener on unmount
    return () => {
      socket.off('new_notification');
    };
  }, [socket]); //re-run when socket is ready

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unread > 0) {
      try {
        await api.patch('/notifications/read-all'); //mark all as read
        setUnread(0); //reset badge
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error('Failed to mark notifications as read:', err);
      }
    }
  };

  const formatTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={s.wrap}>
      <div style={s.bellBtn} onClick={handleOpen}>
        <span style={s.bellIcon}>🔔</span>
        {unread > 0 && (
          <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </div>

      {open && (
        <>
          <div style={s.overlay} onClick={() => setOpen(false)} />
          <div style={s.dropdown}>
            <div style={s.dropdownHeader}>
              <span style={s.dropdownTitle}>Notifications</span>
              {unread === 0 && <span style={s.allRead}>All caught up ✓</span>}
            </div>

            {notifications.length === 0 ? (
              <p style={s.empty}>No notifications yet</p>
            ) : (
              <div style={s.list}>
                {notifications.map((n, i) => (
                  <div
                    key={n.id || i}
                    style={n.isRead ? s.item : { ...s.item, ...s.itemUnread }}
                    onClick={() => {
                      if (
                        n.message.includes('message') ||
                        n.message.includes('💬')
                      ) {
                        //if notification has chatRoomdId
                        setOpen(false);
                        window.location.href = '/chat'; //go to chat page
                      }
                    }}
                  >
                    <div style={s.itemIcon}>🔔</div>
                    <div style={s.itemContent}>
                      <p style={s.itemMsg}>{n.message}</p>
                      <p style={s.itemTime}>{formatTime(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const s = {
  wrap: { position: 'relative' },
  bellBtn: {
    position: 'relative',
    cursor: 'pointer',
    padding: '0.4rem',
    borderRadius: '8px',
  },
  bellIcon: { fontSize: '1.25rem' },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '18px',
    height: '18px',
    backgroundColor: '#EF4444',
    borderRadius: '50%',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #1E293B',
  },
  overlay: { position: 'fixed', inset: 0, zIndex: 99 },
  dropdown: {
    position: 'absolute',
    top: '110%',
    right: 0,
    width: '320px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #334155',
  },
  dropdownTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#F8FAFC' },
  allRead: { fontSize: '0.75rem', color: '#10B981' },
  empty: {
    padding: '1.5rem',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '0.875rem',
  },
  list: { maxHeight: '320px', overflowY: 'auto' },
  item: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    borderBottom: '1px solid #334155',
    cursor: 'pointer',
  },
  itemUnread: { backgroundColor: 'rgba(37,99,235,0.08)' },
  itemIcon: { fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' },
  itemContent: { flex: 1 },
  itemMsg: {
    fontSize: '0.85rem',
    color: '#F8FAFC',
    lineHeight: '1.4',
    marginBottom: '0.25rem',
  },
  itemTime: { fontSize: '0.75rem', color: '#94A3B8' },
};

export default NotificationBell;
