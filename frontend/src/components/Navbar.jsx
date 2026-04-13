import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = ({title, subtitle}) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getInitials = (name) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    }

    return (
        <header style={s.topbar}>
      <div>
        <h1 style={s.pageTitle}>{title}</h1>
        {subtitle && <p style={s.pageSubtitle}>{subtitle}</p>}
      </div>

      <div style={s.right}>
        {/* Static bell for now — will be replaced in task #14 */}
        <div style={s.bellWrap}>
          <span style={{ fontSize: '1.25rem' }}>🔔</span>
          <span style={s.bellDot} />
        </div>

        <div style={s.avatar}>{getInitials(user?.name)}</div>

        <div style={s.userInfo}>
          <span style={s.userName}>{user?.name}</span>
          <span style={s.roleBadge}>{user?.role}</span>
        </div>

        <button
          style={s.logoutBtn}
          onClick={handleLogout}
          onMouseEnter={e => e.target.style.backgroundColor = '#334155'}
          onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
          title='Logout'
        >
          ⏻
        </button>
      </div>
    </header>
  )
}

const s = {
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid #334155', backgroundColor: '#1E293B', position: 'sticky', top: 0, zIndex: 10 },
  pageTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '0.1rem' },
  pageSubtitle: { fontSize: '0.875rem', color: '#94A3B8' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  bellWrap: { position: 'relative', cursor: 'pointer', padding: '0.4rem' },
  bellDot: { position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#2563EB', borderRadius: '50%', border: '2px solid #1E293B' },
  avatar: { width: '38px', height: '38px', backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '700', color: 'white', flexShrink: 0 },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '0.875rem', fontWeight: '600', color: '#F8FAFC' },
  roleBadge: { fontSize: '0.7rem', backgroundColor: '#1E3A5F', color: '#60A5FA', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '600', alignSelf: 'flex-start' },
  logoutBtn: { backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', transition: 'background-color 0.2s' },
}

export default Navbar