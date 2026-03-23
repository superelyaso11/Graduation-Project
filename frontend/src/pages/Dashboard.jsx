import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Sidebar navigation items
const navItems = [
  { icon: '⊞', label: 'Dashboard', active: true },
  { icon: '⊙', label: 'Report Lost', active: false },
  { icon: '◎', label: 'Report Found', active: false },
  { icon: '⬡', label: 'My Items', active: false },
  { icon: '🔔', label: 'Notifications', active: false },
]

// Stat cards data
const stats = [
  { label: 'Active Reports', value: '0', change: '+0%', icon: '⊙' },
  { label: 'Matches Found', value: '0', change: '+0%', icon: '✓' },
  { label: 'Items Resolved', value: '0', change: '+0%', icon: '⬡' },
]

// Recent activity placeholder
const activities = [
  { icon: '✓', title: 'Welcome to Lost & Found!', desc: 'Start by reporting a lost or found item', time: 'Just now' },
]

const Dashboard= () => {
    const { user, logout} = useAuth()
    const navigate = useNavigate()
    const [activeNav, setActiveNav] = useState('Dashboard') // track active sidebar item

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

  // get initials from user's name for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div style={s.layout}>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* Logo */}
        <div style={s.sidebarLogo}>
          <div style={s.logoIcon}>⬡</div>
          <span style={s.logoText}>Lost & Found</span>
        </div>

        {/* Nav Items */}
        <nav style={s.nav}>
          {navItems.map((item) => (
            <button
              key={item.label}
              style={activeNav === item.label ? { ...s.navItem, ...s.navItemActive } : s.navItem}
              onClick={() => setActiveNav(item.label)}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main style={s.main}>

        {/* Top Navbar */}
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>Dashboard</h1>
            <p style={s.pageSubtitle}>Welcome back, {user?.name?.split(' ')[0]}!</p>
          </div>

          <div style={s.topbarRight}>
            {/* Notification bell */}
            <div style={s.bellWrap}>
              <span style={s.bell}>🔔</span>
              <span style={s.bellDot} />
            </div>

            {/* User avatar */}
            <div style={s.avatar}>{getInitials(user?.name)}</div>

            <div style={s.userInfo}>
              <span style={s.userName}>{user?.name}</span>
              <span style={s.roleBadge}>{user?.role}</span>
            </div>

            {/* Logout button */}
            <button style={s.logoutBtn} onClick={handleLogout}
              onMouseEnter={e => e.target.style.backgroundColor = '#1E293B'}
              onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
            >
              ⏻
            </button>
          </div>
        </header>

        {/* Stat Cards */}
        <div style={s.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} style={s.statCard}>
              <div style={s.statTop}>
                <span style={s.statLabel}>{stat.label}</span>
                <div style={s.statIconWrap}>
                  <span style={s.statIcon}>{stat.icon}</span>
                </div>
              </div>
              <div style={s.statValue}>{stat.value}</div>
              <div style={s.statChange}>
                <span style={s.changeArrow}>↑</span>
                <span style={{ color: '#10B981' }}>{stat.change}</span>
                <span style={{ color: '#94A3B8' }}> from last week</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={s.activityCard}>
          <h2 style={s.activityTitle}>Recent Activity</h2>
          <div style={s.activityList}>
            {activities.map((a, i) => (
              <div key={i} style={s.activityItem}>
                <div style={s.activityIconWrap}>
                  <span>{a.icon}</span>
                </div>
                <div style={s.activityInfo}>
                  <p style={s.activityItemTitle}>{a.title}</p>
                  <p style={s.activityDesc}>{a.desc}</p>
                </div>
                <span style={s.activityTime}>🕐 {a.time}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}

const s = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#0F172A' },

  // Sidebar
  sidebar: { width: '260px', backgroundColor: '#1E293B', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', flexShrink: 0 },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', marginBottom: '2rem' },
  logoIcon: { width: '36px', height: '36px', backgroundColor: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'white' },
  logoText: { fontSize: '1rem', fontWeight: '700', color: '#F8FAFC' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', color: '#94A3B8', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left', fontFamily: 'Sora, sans-serif', transition: 'all 0.2s' },
  navItemActive: { backgroundColor: '#2563EB', color: '#F8FAFC' },
  navIcon: { fontSize: '1rem', width: '20px', textAlign: 'center' },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },

  // Topbar
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid #334155', backgroundColor: '#1E293B' },
  pageTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '0.1rem' },
  pageSubtitle: { fontSize: '0.875rem', color: '#94A3B8' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  bellWrap: { position: 'relative', cursor: 'pointer' },
  bell: { fontSize: '1.25rem' },
  bellDot: { position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#2563EB', borderRadius: '50%', border: '2px solid #1E293B' },
  avatar: { width: '38px', height: '38px', backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '700', color: 'white' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '0.875rem', fontWeight: '600', color: '#F8FAFC' },
  roleBadge: { fontSize: '0.7rem', backgroundColor: '#1E3A5F', color: '#60A5FA', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '600', alignSelf: 'flex-start' },
  logoutBtn: { backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', transition: 'background-color 0.2s' },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', padding: '2rem 2rem 0' },
  statCard: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  statLabel: { fontSize: '0.875rem', color: '#94A3B8', fontWeight: '500', lineHeight: '1.4' },
  statIconWrap: { width: '36px', height: '36px', backgroundColor: '#1E3A5F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statIcon: { color: '#2563EB', fontSize: '1rem' },
  statValue: { fontSize: '2rem', fontWeight: '800', color: '#F8FAFC', marginBottom: '0.5rem' },
  statChange: { fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' },
  changeArrow: { color: '#10B981' },

  // Activity
  activityCard: { margin: '1.25rem 2rem', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' },
  activityTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '1.25rem' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  activityItem: { display: 'flex', alignItems: 'center', gap: '1rem' },
  activityIconWrap: { width: '40px', height: '40px', backgroundColor: '#1E3A5F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 },
  activityInfo: { flex: 1 },
  activityItemTitle: { fontSize: '0.9rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '0.2rem' },
  activityDesc: { fontSize: '0.8rem', color: '#94A3B8' },
  activityTime: { fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'nowrap' },
}

export default Dashboard