import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ReputationBadge from '../components/ReputationBadge';

const Chat = () => {
  const { roomId } = useParams(); //if coming from notification
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null); //for auto-scrolling to bottom
  const [chatRooms, setChatRooms] = useState([]); //all chat rooms
  const [activeRoom, setActiveRoom] = useState(null); //currently selected chat
  const [messages, setMessages] = useState([]); //messages in active room
  const [newMessage, setNewMessage] = useState(''); //input value
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  //fetch all chat rooms on mount
  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/chat');
      setChatRooms(data);

      //if roomId in URL - open that room directly
      if (roomId) {
        const room = data.find((r) => r.id === parseInt(roomId));
        if (room) setActiveRoom(room);
      } else if (data.length > 0 && !activeRoom) {
        setActiveRoom(data[0]); //open first room by default
      }
    } catch (err) {
      console.error('Failed to fetch chat rooms', err);
    } finally {
      setLoading(false);
    }
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

    return () => {
      socket.off('new_message');
      socket.off('message_sent');
      socket.off('chat_ended');
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

  const handleEndChat = async (roomId) => {
    if (
      !window.confirm(
        'Are you sure you want to end this chat? this cannot be undone.'
      )
    )
      return;
    try {
      await api.patch(`/chat/${roomId}/end`);
      setChatRooms((prev) => prev.filter((r) => r.id !== roomId));
      setActiveRoom(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to end chat', err);
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
    return Date.toLocalDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  //group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <Navbar title="Messages" subtitle="Chat with item owners and finders" />

        <div style={s.chatLayout}>
          {/* Left panel — chat room list */}
          <div style={s.roomList}>
            <div style={s.roomListHeader}>
              <h2 style={s.roomListTitle}>Conversations</h2>
              <span style={s.roomCount}>{chatRooms.length}</span>
            </div>

            {loading && <p style={s.empty}>Loading chats...</p>}

            {!loading && chatRooms.length === 0 && (
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
              const isActive = activeRoom?.id === room.id;

              return (
                <div
                  key={room.id}
                  style={{
                    ...s.roomItem,
                    backgroundColor: isActive ? '#1E3A5F' : 'transparent',
                    borderLeft: isActive
                      ? '3px solid #2563EB'
                      : '3px solid transparent',
                  }}
                  onClick={() => setActiveRoom(room)}
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
                          ? lastMessage.content.length > 35
                            ? lastMessage.content.slice(0, 35) + '...'
                            : lastMessage.content
                          : `Re: ${room.claim?.lostItem?.title}`}
                      </span>
                      {room.unreadCount > 0 && (
                        <span style={s.unreadBadge}>{room.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right panel — message view */}
          {activeRoom ? (
            <div style={s.messagePanel}>
              {/* Chat header */}
              <div style={s.chatHeader}>
                <div style={s.chatHeaderLeft}>
                  <div style={s.chatAvatar}>
                    {getOtherUser(activeRoom)
                      ?.name?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p style={s.chatName}>{getOtherUser(activeRoom)?.name}</p>
                    <ReputationBadge
                      points={getOtherUser(activeRoom)?.points || 0}
                      showPoints={true}
                      size="small"
                    />
                  </div>
                </div>
                <div style={s.chatHeaderRight}>
                  <span style={s.chatItemLabel}>
                    📦 {activeRoom.claim?.lostItem?.title}
                  </span>
                  <button
                    style={s.endChatBtn}
                    onClick={() => handleEndChat(activeRoom.id)}
                  >
                    End Chat
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={s.messages}>
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div style={s.dateSeparator}>
                      <span style={s.dateLabel}>{date}</span>
                    </div>

                    {msgs.map((message) => {
                      const isMine = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          style={{
                            ...s.messageRow,
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                          }}
                        >
                          {/* Other person's avatar */}
                          {!isMine && (
                            <div style={s.messageAvatar}>
                              {message.sender?.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}

                          <div
                            style={{
                              ...s.messageBubble,
                              backgroundColor: isMine ? '#2563EB' : '#1E293B',
                              borderBottomRightRadius: isMine ? '4px' : '16px',
                              borderBottomLeftRadius: isMine ? '16px' : '4px',
                            }}
                          >
                            <p style={s.messageContent}>{message.content}</p>
                            <p style={s.messageTime}>
                              {formatTime(message.createdAt)}
                              {isMine && (
                                <span style={{ marginLeft: '0.25rem' }}>
                                  {message.isRead ? ' ✓✓' : ' ✓'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div style={s.inputArea}>
                <form onSubmit={handleSend} style={s.inputForm}>
                  <input
                    style={s.messageInput}
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
                    {sending ? '...' : '➤'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            // No room selected
            <div style={s.noRoom}>
              <p style={s.noRoomIcon}>💬</p>
              <p style={s.noRoomText}>
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const s = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0F172A' },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatLayout: { display: 'flex', flex: 1, overflow: 'hidden' },

  // Room list
  roomList: {
    width: '300px',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1E293B',
    flexShrink: 0,
    overflowY: 'auto',
  },
  roomListHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #334155',
  },
  roomListTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#F8FAFC',
    margin: 0,
  },
  roomCount: {
    backgroundColor: '#2563EB',
    color: 'white',
    borderRadius: '10px',
    padding: '0.1rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    padding: '2rem',
    fontSize: '0.875rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    gap: '0.5rem',
  },
  emptyIcon: { fontSize: '2rem', margin: 0 },
  emptyText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#F8FAFC',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '0.775rem',
    color: '#94A3B8',
    margin: 0,
    textAlign: 'center',
  },
  roomItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.25rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderLeft: '3px solid transparent',
  },
  roomAvatar: {
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
  roomInfo: { flex: 1, minWidth: 0 },
  roomTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.2rem',
  },
  roomName: { fontSize: '0.875rem', fontWeight: '600', color: '#F8FAFC' },
  roomTime: { fontSize: '0.7rem', color: '#94A3B8', flexShrink: 0 },
  roomBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomPreview: {
    fontSize: '0.775rem',
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
    padding: '0.1rem 0.4rem',
    fontSize: '0.7rem',
    fontWeight: '700',
    marginLeft: '0.5rem',
    flexShrink: 0,
  },

  // Message panel
  messagePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #334155',
    backgroundColor: '#1E293B',
  },
  chatHeaderLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  chatAvatar: {
    width: '40px',
    height: '40px',
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
  chatName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#F8FAFC',
    margin: '0 0 0.2rem',
  },
  chatHeaderRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  chatItemLabel: {
    fontSize: '0.8rem',
    color: '#94A3B8',
    backgroundColor: '#0F172A',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
  },
  endChatBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #EF4444',
    color: '#EF4444',
    borderRadius: '8px',
    padding: '0.4rem 0.875rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Sora, sans-serif',
  },

  // Messages area
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  dateSeparator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1rem 0',
  },
  dateLabel: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    backgroundColor: '#1E293B',
    padding: '0.25rem 0.75rem',
    borderRadius: '10px',
  },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: '0.5rem' },
  messageAvatar: {
    width: '28px',
    height: '28px',
    backgroundColor: '#334155',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#94A3B8',
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: '65%',
    padding: '0.6rem 0.875rem',
    borderRadius: '16px',
  },
  messageContent: {
    fontSize: '0.9rem',
    color: '#F8FAFC',
    margin: '0 0 0.2rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  messageTime: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    textAlign: 'right',
  },

  // Input area
  inputArea: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #334155',
    backgroundColor: '#1E293B',
  },
  inputForm: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  messageInput: {
    flex: 1,
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '24px',
    padding: '0.75rem 1.25rem',
    color: '#F8FAFC',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'Sora, sans-serif',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    backgroundColor: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.2s',
  },

  // No room selected
  noRoom: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  noRoomIcon: { fontSize: '3rem', margin: 0 },
  noRoomText: { fontSize: '1rem', color: '#94A3B8', margin: 0 },
};

export default Chat;
