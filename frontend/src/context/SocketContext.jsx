/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null); //socket instance
  const [connected, setConnected] = useState(false); //connection status
  const socketRef = useRef(null); //use ref to avoid setState in effect

  useEffect(() => {
    if (!user) {
      //don't connect if not logged in
      if (socketRef.current) {
        socketRef.current.disconnect(); //disconnect if user logs out
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('token'); //get JWT token

    if (!token) return;

    //create socket  connection with token for authentication
    const newSocket = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
        'http://localhost:5000',
      {
        auth: { token }, //send token for authentication
        transports: ['websocket', 'polling'], //try websocket first, fallback to polling
        reconnectionAttempts: 3, //limit reconnecting attempts
        reconnectionDelay: 2000, //wait 2s between attempts
      }
    );

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setSocket(newSocket); //store socket in state
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(newSocket); //store socket in state

    //cleanup on unmount or user logout
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]); //reconnect when user  changes

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
