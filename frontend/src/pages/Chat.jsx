import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ReputationBadge from '../components/ReputationBadge';

const Chat = () => {
  const { roomId } = useParams(); //if coming from notification
  const { user } = useAuth();
  const { socket } = useSocket();
  const { isDark } = useTheme();
  const messagesEndRef = useRef(null); //for auto-scrolling to bottom
  const [chatRooms, setChatRooms] = useState([]); //all chat rooms
  const [activeRoom, setActiveRoom] = useState(null); //currently selected chat
  const [messages, setMessages] = useState([]); //messages in active room
  const [newMessage, setNewMessage] = useState(''); //input value
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bg = isDark ? '#050709' : '#EEF2F7';
  const cardBg = isDark ? '#0C1118' : '#FFFFFF';
  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const cyanBg = isDark ? 'rgba(34,211,238,0.1)' : 'rgba(8,145,178,0.1)';
  const btnGrad = isDark
    ? 'linear-gradient(135deg,#22D3EE,#0EA5E9)'
    : 'linear-gradient(135deg,#0891B2,#0369A1)';
  const btnText = isDark ? '#050709' : '#fff';
  const gridLine = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';

  //fetch all chat rooms on mount
  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/chat');
      setChatRooms(data);

      //if roomId in URL - open that room directly
      if (roomId) {
        const room = data.find((r) => r.id === parseInt(roomId));
        if (room) openRoom(room);
      } else if (data.length > 0 && !activeRoom) {
        openRoom(data[0]); //open first room by default
      }
    } catch (err) {
      console.error('Failed to fetch chat rooms', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  //fetch messages when active room changes
  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom.id);
  }, [activeRoom]);

  //scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  //listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    //new messages received
    socket.on('new_message', ({ chatRoomId, message }) => {
      if (activeRoom?.id === chatRoomId) {
        setMessages((prev) => [...prev, message]); //add to current chat
      }
      //update last message preview in room list
      setChatRooms((prev) =>
        prev.map((room) =>
          room.id === chatRoomId
            ? {
                ...room,
                messages: [message],
                unreadCount:
                  activeRoom?.id === chatRoomId ? 0 : room.unreadCount + 1,
              }
            : room
        )
      );
    });

    //message sent by me - add to chat
    socket.on('message_sent', ({ chatRoomId, message }) => {
      if (activeRoom?.id === chatRoomId) {
        setMessages((prev) => {
          //avoid duplicates
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    //other user ended the chat
    socket.on('chat_ended', ({ chatRoomId }) => {
      setChatRooms((prev) => prev.filter((r) => r.id !== chatRoomId));
      if (activeRoom?.id === chatRoomId) {
        setActiveRoom(null);
        setMessages([]);
      }
    });

    socket.on('end_chat_requested', ({ chatRoomId, requesterName }) => {
      setChatRooms((prev) =>
        prev.map((r) =>
          r.id === chatRoomId ? { ...r, endRequested: true, requesterName } : r
        )
      );
      if (activeRoom?.id === chatRoomId)
        setActiveRoom((prev) => ({
          ...prev,
          endRequested: true,
          requesterName,
        }));
    });

    return () => {
      socket.off('new_message');
      socket.off('message_sent');
      socket.off('chat_ended');
      socket.off('end_chat_requested');
    };
  }, [socket, activeRoom]);

  const fetchMessages = async (roomId) => {
    try {
      const { data } = await api.get(`/chat/${roomId}/messages`);
      setMessages(data);
      //mark room as read
      setChatRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
      );
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const openRoom = async (room) => {
    setActiveRoom(room);
    try {
      const { data } = await api.get(`/chat/${room.id}/messages`);
      setMessages(data);
      setChatRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
      );
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
      console.error('Failed to send message', err);
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
      setMessages([]);
    } catch (err) {
      console.error('Failed to confirm end', err);
    }
  };

  //get other participant in the chat
  const getOtherUser = (room) => {
    if (!room || !user) return null;
    return room.ownerId === user.id ? room.finder : room.owner;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  //group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const getInitials = (name) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

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
        {/* Page hero — replaces Navbar */}
        <motion.div
          style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: heroBg,
            borderBottom: `1px solid ${border}`,
            flexShrink: 0,
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
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} style={{ color: cyan }} />
              <span
                style={{
                  color: cyan,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                }}
              >
                MESSAGES
              </span>
              {chatRooms.length > 0 && (
                <span
                  style={{
                    padding: '0.1rem 0.5rem',
                    borderRadius: 6,
                    backgroundColor: cyanBg,
                    color: cyan,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {chatRooms.reduce((s, r) => s + (r.unreadCount || 0), 0) > 0
                    ? `${chatRooms.reduce((s, r) => s + (r.unreadCount || 0), 0)} unread`
                    : `${chatRooms.length} conversation${chatRooms.length !== 1 ? 's' : ''}`}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Chat layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left — room list */}
          <motion.div
            style={{
              width: 300,
              flexShrink: 0,
              backgroundColor: cardBg,
              borderRight: `1px solid ${border}`,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: `1px solid ${border}`,
              }}
            >
              <span style={{ color: textPri, fontSize: 14, fontWeight: 700 }}>
                Conversations
              </span>
            </div>

            {loading && (
              <div
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', gap: 10, alignItems: 'center' }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: inputBg,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          height: 12,
                          borderRadius: 4,
                          backgroundColor: inputBg,
                          width: '70%',
                        }}
                      />
                      <div
                        style={{
                          height: 10,
                          borderRadius: 4,
                          backgroundColor: inputBg,
                          width: '50%',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && chatRooms.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '3rem 1rem',
                  gap: 8,
                }}
              >
                <MessageSquare size={32} style={{ color: textMut }} />
                <p
                  style={{
                    color: textPri,
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  No conversations
                </p>
                <p
                  style={{
                    color: textMut,
                    fontSize: 12,
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  Chats appear when a claim is approved
                </p>
              </div>
            )}

            {chatRooms.map((room) => {
              const otherUser = getOtherUser(room);
              const lastMessage = room.messages?.[0];
              const isActive = activeRoom?.id === room.id;
              return (
                <motion.div
                  key={room.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${border}`,
                    backgroundColor: isActive ? cyanBg : 'transparent',
                    borderLeft: `3px solid ${isActive ? cyan : 'transparent'}`,
                    transition: 'all 0.2s',
                  }}
                  onClick={() => openRoom(room)}
                  whileHover={{
                    backgroundColor: isActive
                      ? cyanBg
                      : isDark
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: btnGrad,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: btnText,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(otherUser?.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          color: textPri,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {otherUser?.name}
                      </span>
                      {lastMessage && (
                        <span style={{ color: textMut, fontSize: 11 }}>
                          {formatTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          color: textMut,
                          fontSize: 12,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {lastMessage
                          ? lastMessage.content.slice(0, 30) +
                            (lastMessage.content.length > 30 ? '...' : '')
                          : `Re: ${room.claim?.lostItem?.title}`}
                      </span>
                      {room.unreadCount > 0 && (
                        <span
                          style={{
                            marginLeft: 6,
                            padding: '0.1rem 0.375rem',
                            borderRadius: 6,
                            backgroundColor: cyan,
                            color: btnText,
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right — message view */}
          {activeRoom ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Chat header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1.5rem',
                  borderBottom: `1px solid ${border}`,
                  backgroundColor: cardBg,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: btnGrad,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: btnText,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(getOtherUser(activeRoom)?.name)}
                  </div>
                  <div>
                    <div
                      style={{ color: textPri, fontSize: 14, fontWeight: 700 }}
                    >
                      {getOtherUser(activeRoom)?.name}
                    </div>
                    <ReputationBadge
                      points={getOtherUser(activeRoom)?.points || 0}
                      showPoints={true}
                      size="small"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      color: textMut,
                      fontSize: 12,
                      backgroundColor: inputBg,
                      padding: '0.3rem 0.75rem',
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                    }}
                  >
                    📦 {activeRoom.claim?.lostItem?.title}
                  </span>

                  {/* End chat button — two-sided */}
                  {activeRoom.endRequested && !activeRoom.endRequestedByMe ? (
                    <motion.button
                      onClick={handleConfirmEnd}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '0.4rem 0.875rem',
                        borderRadius: 10,
                        backgroundColor: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        color: '#10B981',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ backgroundColor: 'rgba(16,185,129,0.18)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      ✓ Confirm End
                    </motion.button>
                  ) : activeRoom.endRequestedByMe ? (
                    <div
                      style={{
                        padding: '0.4rem 0.875rem',
                        borderRadius: 10,
                        backgroundColor: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#F59E0B',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      ⏳ Waiting...
                    </div>
                  ) : (
                    <motion.button
                      onClick={handleRequestEnd}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '0.4rem 0.875rem',
                        borderRadius: 10,
                        backgroundColor: 'rgba(244,63,94,0.08)',
                        border: '1px solid rgba(244,63,94,0.25)',
                        color: '#F43F5E',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      whileHover={{ backgroundColor: 'rgba(244,63,94,0.15)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <X size={12} /> End Chat
                    </motion.button>
                  )}
                </div>
              </div>

              {/* End request banner */}
              <AnimatePresence>
                {activeRoom.endRequested && !activeRoom.endRequestedByMe && (
                  <motion.div
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      borderBottom: '1px solid rgba(239,68,68,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <p
                      style={{
                        color: '#FCA5A5',
                        fontSize: 13,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {activeRoom.requesterName} wants to end this chat. Click
                      "Confirm End" to close it.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '1rem 0',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: textMut,
                          backgroundColor: cardBg,
                          padding: '0.25rem 0.75rem',
                          borderRadius: 10,
                          border: `1px solid ${border}`,
                        }}
                      >
                        {date}
                      </span>
                    </div>
                    {msgs.map((message) => {
                      const isMine = message.senderId === user?.id;
                      return (
                        <motion.div
                          key={message.id}
                          style={{
                            display: 'flex',
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end',
                            gap: '0.5rem',
                            marginBottom: '0.375rem',
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {!isMine && (
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                background: btnGrad,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                color: btnText,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(message.sender?.name)}
                            </div>
                          )}
                          <div
                            style={{
                              maxWidth: '65%',
                              padding: '0.625rem 0.875rem',
                              borderRadius: 16,
                              backgroundColor: isMine ? cyan : cardBg,
                              borderBottomRightRadius: isMine ? 4 : 16,
                              borderBottomLeftRadius: isMine ? 16 : 4,
                              border: isMine ? 'none' : `1px solid ${border}`,
                            }}
                          >
                            <p
                              style={{
                                fontSize: '0.875rem',
                                color: isMine ? btnText : textPri,
                                margin: '0 0 0.2rem',
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                              }}
                            >
                              {message.content}
                            </p>
                            <p
                              style={{
                                fontSize: '0.6rem',
                                color: isMine ? `${btnText}80` : textMut,
                                margin: 0,
                                textAlign: 'right',
                              }}
                            >
                              {formatTime(message.createdAt)}
                              {isMine && (message.isRead ? ' ✓✓' : ' ✓')}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: `1px solid ${border}`,
                  backgroundColor: cardBg,
                  flexShrink: 0,
                }}
              >
                <form
                  onSubmit={handleSend}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.25rem',
                      borderRadius: 24,
                      outline: 'none',
                      backgroundColor: inputBg,
                      border: `1px solid ${border}`,
                      color: textPri,
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = `${cyan}60`)}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                  <motion.button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background:
                        sending || !newMessage.trim()
                          ? isDark
                            ? '#1E293B'
                            : '#CBD5E1'
                          : btnGrad,
                      color: btnText,
                      border: 'none',
                      cursor:
                        sending || !newMessage.trim()
                          ? 'not-allowed'
                          : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'opacity 0.2s',
                    }}
                    whileHover={
                      !sending && newMessage.trim() ? { scale: 1.08 } : {}
                    }
                    whileTap={
                      !sending && newMessage.trim() ? { scale: 0.95 } : {}
                    }
                  >
                    <Send size={16} />
                  </motion.button>
                </form>
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <MessageSquare size={48} style={{ color: textMut }} />
              </motion.div>
              <p
                style={{
                  color: textPri,
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Select a conversation
              </p>
              <p style={{ color: textMut, fontSize: 14, margin: 0 }}>
                Choose a chat from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
