/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ChatDrawer = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [expanded, setExpanded] = useState(false); //bottom bar expanded/collapsed
  const [chatRooms, setChatRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null); //null = show list, room = show chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/chat');
      setChatRooms(data);
      setTotalUnread(data.reduce((sum, r) => sum + (r.unreadCount || 0), 0));
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRooms();
  }, [user, fetchRooms]);

  useEffect(() => {
    if (expanded) fetchRooms();
  }, [expanded, fetchRooms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', ({ chatRoomId, message }) => {
      if (activeRoom?.id === chatRoomId) {
        setMessages((prev) => [...prev, message]);
      }
      setChatRooms((prev) =>
        prev.map((room) =>
          room.id === chatRoomId
            ? {
                ...room,
                messages: [message],
                unreadCount:
                  activeRoom?.id === chatRoomId
                    ? 0
                    : (room.unreadCount || 0) + 1,
              }
            : room
        )
      );
      if (activeRoom?.id !== chatRoomId) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    socket.on('message_sent', ({ chatRoomId, message }) => {
      if (activeRoom?.id === chatRoomId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    socket.on('chat_ended', ({ chatRoomId }) => {
      setChatRooms((prev) => prev.filter((r) => r.id !== chatRoomId));
      if (activeRoom?.id === chatRoomId) {
        setActiveRoom(null);
      }
    });

    //when other user requests to end chat
    socket.on('end_chat_requested', ({ chatRoomId, requesterName }) => {
      setChatRooms((prev) =>
        prev.map((r) =>
          r.id === chatRoomId ? { ...r, endRequested: true, requesterName } : r
        )
      );
      if (activeRoom?.id === chatRoomId) {
        setActiveRoom((prev) => ({
          ...prev,
          endRequested: true,
          requesterName,
        }));
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('message_sent');
      socket.off('chat_ended');
      socket.off('end_chat_requested');
    };
  }, [socket, activeRoom]);

  const openRoom = async (room) => {
    setActiveRoom(room);
    try {
      const { data } = await api.get(`/chat/${room.id}/messages`);
      setMessages(data);
      setChatRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
      );
      setTotalUnread((prev) => Math.max(0, prev - (room.unreadCount || 0)));
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || sending) return;
    setSending(true);
    try {
      await api.post(`/chat/${activeRoom.id}/messages`, {
        content: newMessage,
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send', err);
    } finally {
      setSending(false);
    }
  };

  const handleRequestEnd = async () => {
    if (
      !window.confirm(
        'Request to end this chat? The other person must also agree.'
      )
    )
      return;
    try {
      await api.patch(`/chat/${activeRoom.id}/request-end`);
      setActiveRoom((prev) => ({ ...prev, endRequestedByMe: true }));
    } catch (err) {
      console.error('Failed to request end', err);
    }
  };

  const handleConfirmEnd = async () => {
    try {
      await api.patch(`/chat/${activeRoom.id}/confirm-end`);
      setChatRooms((prev) => prev.filter((r) => r.id !== activeRoom.id));
      setActiveRoom(null);
    } catch (err) {
      console.error('Failed to confirm end', err);
    }
  };

  const getOtherUser = (room) => {
    if (!room || !user) return null;
    return room.ownerId === user.id ? room.finder : room.owner;
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <div style={s.container}>
      {/* Bottom bar — always visible */}
      <div style={s.bar} onClick={() => setExpanded(!expanded)}>
        <div style={s.barLeft}>
          <span style={s.barIcon}>💬</span>
          <span style={s.barLabel}>Messages</span>
          {totalUnread > 0 && <span style={s.barBadge}>{totalUnread}</span>}
        </div>
        <span style={s.barArrow}>{expanded ? '▼' : '▲'}</span>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={s.panel}>
          {/* Room list */}
          {!activeRoom && (
            <>
              <div style={s.panelHeader}>
                <span style={s.panelTitle}>Conversations</span>
                <button
                  style={s.fullPageBtn}
                  onClick={() => {
                    setExpanded(false);
                    navigate('/chat');
                  }}
                  title="Open full page"
                >
                  ⛶ Full View
                </button>
              </div>

              <div style={s.roomList}>
                {chatRooms.length === 0 && (
                  <div style={s.emptyState}>
                    <p style={s.emptyIcon}>💬</p>
                    <p style={s.emptyText}>No conversations yet</p>
                    <p style={s.emptySubtext}>
                      Chats appear when a claim is approved
                    </p>
                  </div>
                )}
                {chatRooms.map((room) => {
                  const otherUser = getOtherUser(room);
                  const lastMessage = room.messages?.[0];
                  return (
                    <div
                      key={room.id}
                      style={s.roomItem}
                      onClick={() => openRoom(room)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = '#1E3A5F')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <div style={s.roomAvatar}>
                        {otherUser?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div style={s.roomInfo}>
                        <div style={s.roomTopRow}>
                          <span style={s.roomName}>{otherUser?.name}</span>
                          {lastMessage && (
                            <span style={s.roomTime}>
                              {formatTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div style={s.roomBottomRow}>
                          <span style={s.roomPreview}>
                            {lastMessage
                              ? lastMessage.content.slice(0, 28) +
                                (lastMessage.content.length > 28 ? '...' : '')
                              : `Re: ${room.claim?.lostItem?.title}`}
                          </span>
                          {room.unreadCount > 0 && (
                            <span style={s.unreadBadge}>
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Active chat */}
          {activeRoom && (
            <>
              <div style={s.chatHeader}>
                <button style={s.backBtn} onClick={() => setActiveRoom(null)}>
                  ←
                </button>
                <div style={s.chatHeaderInfo}>
                  <span style={s.chatName}>
                    {getOtherUser(activeRoom)?.name}
                  </span>
                  <span style={s.chatSub}>
                    Re: {activeRoom.claim?.lostItem?.title}
                  </span>
                </div>
                <button
                  style={s.endBtn}
                  onClick={
                    activeRoom.endRequested && !activeRoom.endRequestedByMe
                      ? handleConfirmEnd
                      : handleRequestEnd
                  }
                  title={
                    activeRoom.endRequestedByMe
                      ? 'Waiting for other user'
                      : 'End chat'
                  }
                >
                  {activeRoom.endRequested && !activeRoom.endRequestedByMe
                    ? '✓ Confirm End'
                    : activeRoom.endRequestedByMe
                      ? '⏳ Waiting...'
                      : '✕ End'}
                </button>
              </div>

              {/* End requested banner */}
              {activeRoom.endRequested && !activeRoom.endRequestedByMe && (
                <div style={s.endBanner}>
                  <p style={s.endBannerText}>
                    {activeRoom.requesterName} wants to end this chat. Confirm
                    to close it.
                  </p>
                </div>
              )}

              {activeRoom.endRequestedByMe && (
                <div style={s.endBannerWaiting}>
                  <p style={s.endBannerText}>
                    Waiting for the other person to confirm ending the chat...
                  </p>
                </div>
              )}

              <div style={s.messages}>
                {messages.map((message) => {
                  const isMine = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      style={{
                        ...s.messageRow,
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          ...s.bubble,
                          backgroundColor: isMine ? '#2563EB' : '#1E293B',
                          borderBottomRightRadius: isMine ? '4px' : '16px',
                          borderBottomLeftRadius: isMine ? '16px' : '4px',
                        }}
                      >
                        <p style={s.bubbleText}>{message.content}</p>
                        <p style={s.bubbleTime}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={s.inputArea}>
                <form onSubmit={handleSend} style={s.inputForm}>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                    onBlur={(e) => (e.target.style.borderColor = '#334155')}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    style={{
                      ...s.sendBtn,
                      opacity: sending || !newMessage.trim() ? 0.5 : 1,
                    }}
                  >
                    ➤
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const s = {
  container: {
    position: 'fixed',
    bottom: 0,
    right: '2rem',
    zIndex: 150,
    width: '320px',
  },
  bar: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderBottom: 'none',
    borderRadius: '12px 12px 0 0',
    padding: '0.875rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  barLeft: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  barIcon: { fontSize: '1rem' },
  barLabel: { fontSize: '0.9rem', fontWeight: '700', color: '#F8FAFC' },
  barBadge: {
    backgroundColor: '#EF4444',
    color: 'white',
    borderRadius: '10px',
    padding: '0.1rem 0.4rem',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  barArrow: { fontSize: '0.7rem', color: '#94A3B8' },
  panel: {
    backgroundColor: '#0F172A',
    border: '1px solid #334155',
    borderBottom: 'none',
    display: 'flex',
    flexDirection: 'column',
    height: '420px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid #334155',
    backgroundColor: '#1E293B',
  },
  panelTitle: { fontSize: '0.875rem', fontWeight: '700', color: '#F8FAFC' },
  fullPageBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#94A3B8',
    borderRadius: '6px',
    padding: '0.25rem 0.6rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },
  roomList: { flex: 1, overflowY: 'auto' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1rem',
    gap: '0.4rem',
  },
  emptyIcon: { fontSize: '2rem', margin: 0 },
  emptyText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#F8FAFC',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    margin: 0,
    textAlign: 'center',
  },
  roomItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.25rem',
    cursor: 'pointer',
    borderBottom: '1px solid #1E293B',
    transition: 'background-color 0.15s',
  },
  roomAvatar: {
    width: '38px',
    height: '38px',
    backgroundColor: '#2563EB',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'white',
    flexShrink: 0,
  },
  roomInfo: { flex: 1, minWidth: 0 },
  roomTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.15rem',
  },
  roomName: { fontSize: '0.85rem', fontWeight: '600', color: '#F8FAFC' },
  roomTime: { fontSize: '0.7rem', color: '#94A3B8' },
  roomBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomPreview: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#2563EB',
    color: 'white',
    borderRadius: '10px',
    padding: '0.1rem 0.35rem',
    fontSize: '0.65rem',
    fontWeight: '700',
    marginLeft: '0.4rem',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #334155',
    backgroundColor: '#1E293B',
  },
  backBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94A3B8',
    fontSize: '1.1rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  chatHeaderInfo: { flex: 1, minWidth: 0 },
  chatName: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#F8FAFC',
    display: 'block',
  },
  chatSub: {
    fontSize: '0.7rem',
    color: '#94A3B8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  endBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #EF4444',
    color: '#EF4444',
    borderRadius: '6px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.72rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  endBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderBottom: '1px solid rgba(239,68,68,0.3)',
    padding: '0.5rem 1rem',
  },
  endBannerWaiting: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderBottom: '1px solid rgba(245,158,11,0.3)',
    padding: '0.5rem 1rem',
  },
  endBannerText: {
    fontSize: '0.775rem',
    color: '#F8FAFC',
    margin: 0,
    textAlign: 'center',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  messageRow: { display: 'flex' },
  bubble: { maxWidth: '80%', padding: '0.5rem 0.75rem', borderRadius: '16px' },
  bubbleText: {
    fontSize: '0.85rem',
    color: '#F8FAFC',
    margin: '0 0 0.15rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  bubbleTime: {
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    textAlign: 'right',
  },
  inputArea: {
    padding: '0.75rem',
    borderTop: '1px solid #334155',
    backgroundColor: '#1E293B',
  },
  inputForm: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '20px',
    padding: '0.5rem 0.875rem',
    color: '#F8FAFC',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'Sora, sans-serif',
  },
  sendBtn: {
    width: '34px',
    height: '34px',
    backgroundColor: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
};

export default ChatDrawer;
