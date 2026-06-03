import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  AlertCircle,
  Search,
  Package,
  Bell,
  LogOut,
  ShieldCheck,
  Crown,
  MessageSquare,
  Scan,
  Sun,
  Moon,
} from 'lucide-react';

const Tooltip = ({ label, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            style={{
              position: 'absolute',
              left: '100%',
              marginLeft: 12,
              padding: '0.25rem 0.625rem',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 50,
              backgroundColor: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'inherit',
            }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const railBg = isDark ? '#080C14' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const textMut = isDark ? '#64748B' : '#64748B';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const cyanBg = isDark ? 'rgba(34,211,238,0.1)' : 'rgba(8,145,178,0.1)';
  const btnGrad = isDark
    ? 'linear-gradient(135deg,#22D3EE,#0EA5E9)'
    : 'linear-gradient(135deg,#0891B2,#0369A1)';
  const btnText = isDark ? '#050709' : '#fff';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const allNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['STUDENT', 'SECURITY', 'ADMIN'],
    },
    {
      icon: AlertCircle,
      label: 'Report Lost',
      path: '/report-lost',
      roles: ['STUDENT'],
    },
    {
      icon: Scan,
      label: 'Report Found',
      path: '/report-found',
      roles: ['STUDENT'],
    },
    {
      icon: Search,
      label: 'Browse Lost Items',
      path: '/browse-items',
      roles: ['STUDENT', 'SECURITY', 'ADMIN'],
    },
    {
      icon: Package,
      label: 'My Items',
      path: '/my-items',
      roles: ['STUDENT'],
    },
    {
      icon: ShieldCheck,
      label: 'Security Dashboard',
      path: '/security',
      roles: ['SECURITY', 'ADMIN'],
    },
    {
      icon: Crown,
      label: 'Admin Dashboard',
      path: '/admin',
      roles: ['ADMIN'],
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      path: '/chat',
      roles: ['STUDENT'],
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/notifications',
      roles: ['STUDENT', 'SECURITY', 'ADMIN'],
    },
  ];

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      style={{
        width: 64,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '1.25rem',
        paddingBottom: '1.25rem',
        gap: 4,
        backgroundColor: railBg,
        borderRight: `1px solid ${border}`,
        transition: 'background-color 0.3s',
        position: 'sticky',
        zIndex: 10,
        height: '100vh', // full height
        top: 0,
      }}
      initial={{ x: -64, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logo */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: btnGrad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M2 14C4.5 12 9 13 9 13C9 13 13.5 12 16 14V4C13.5 2 9 3 9 3C9 3 4.5 2 2 4V14Z"
            stroke={btnText}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 3V13" stroke={btnText} strokeWidth="1.5" />
        </svg>
      </div>

      {/* Nav items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%',
          padding: '0 0.5rem',
        }}
      >
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.label} label={item.label}>
              <motion.div
                style={{ width: '100%', position: 'relative' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.04 }}
              >
                {isActive && (
                  <motion.span
                    style={{
                      position: 'absolute',
                      top: 4,
                      bottom: 4,
                      left: 0,
                      width: 2,
                      borderRadius: 999,
                      backgroundColor: cyan,
                    }}
                    layoutId="railIndicator"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Link
                  to={item.path}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <motion.div
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isActive ? cyanBg : 'transparent',
                      color: isActive ? cyan : textMut,
                      cursor: 'pointer',
                    }}
                    whileHover={{
                      backgroundColor: isActive ? cyanBg : hoverBg,
                    }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Icon size={17} />
                  </motion.div>
                </Link>
              </motion.div>
            </Tooltip>
          );
        })}
      </div>

      {/* Bottom section */}
      <div
        style={{
          marginTop: 'auto', // pushes to bottom
          position: 'sticky', // stays visible
          bottom: '1.25rem', // sticks to bottom
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.625rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${border}`,
        }}
      >
        {/* Theme toggle */}
        <Tooltip label={isDark ? 'Light mode' : 'Dark mode'}>
          <motion.button
            onClick={toggleTheme}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: textMut,
              cursor: 'pointer',
            }}
            whileHover={{ backgroundColor: hoverBg }}
            whileTap={{ scale: 0.92 }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
        </Tooltip>

        {/* Logout */}
        <Tooltip label="Sign out">
          <motion.button
            onClick={handleLogout}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: textMut,
              cursor: 'pointer',
            }}
            whileHover={{ backgroundColor: hoverBg }}
            whileTap={{ scale: 0.92 }}
          >
            <LogOut size={16} />
          </motion.button>
        </Tooltip>

        {/* Avatar */}
        <Tooltip label={user?.name || 'Profile'}>
          <motion.div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: btnGrad,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <span style={{ color: btnText, fontSize: 11, fontWeight: 800 }}>
              {getInitials(user?.name)}
            </span>
          </motion.div>
        </Tooltip>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
