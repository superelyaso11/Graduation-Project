import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const heroBg = isDark ? '#0D1521' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const textPri = isDark ? '#F1F5F9' : '#0F172A';
  const textMut = isDark ? '#64748B' : '#64748B';
  const cyan = isDark ? '#22D3EE' : '#0891B2';
  const gridLine = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';
  const meshA = isDark ? 'rgba(34,211,238,0.07)' : 'rgba(8,145,178,0.06)';

  return (
    <motion.div
      style={{
        position: 'relative',
        overflow: 'visible',
        backgroundColor: heroBg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        margin: '1.5rem 1.5rem 0',
        transition: 'background-color 0.3s',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Grid background — clipped to card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${gridLine} 1px,transparent 1px),linear-gradient(90deg,${gridLine} 1px,transparent 1px)`,
          backgroundSize: '32px 32px',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '15%',
          width: 320,
          height: 320,
          background: `radial-gradient(circle,${meshA} 0%,transparent 70%)`,
          filter: 'blur(50px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem 2rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem',
            }}
          >
            <motion.span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block',
              }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span
              style={{
                color: '#10B981',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              SYSTEM ACTIVE
            </span>
          </div>
          <h1
            style={{
              color: textPri,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {title || (
              <>
                Good morning,{' '}
                <span style={{ color: cyan }}>
                  {user?.name?.split(' ')[0]} 👋
                </span>
              </>
            )}
          </h1>
          {subtitle && (
            <p style={{ color: textMut, fontSize: 14, marginTop: 4 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Only notification bell */}
        <div style={{ position: 'relative', zIndex: 200 }}>
          <NotificationBell />
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;
