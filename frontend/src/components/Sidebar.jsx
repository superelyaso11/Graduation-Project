import {Link, useLocation} from 'react-router-dom'

const navItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '📢', label: 'Report Lost', path: '/report-lost' },
    { icon: '🔍', label: 'Browse Lost Items', path: '/report-found' },
    { icon: '👤', label: 'My Items', path: '/my-items' },
    { icon: '🔔', label: 'Notifications', path: '/notifications' },
]

const Sidebar = () => {
    const location = useLocation()

  return (
    <aside style={s.sidebar}>
      <div style={s.sidebarLogo}>
        <div style={s.logoIcon}>📦</div>
        <span style={s.logoText}>Lost & Found</span>
      </div>
      <nav style={s.nav}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            style={location.pathname === item.path     // highlight based on actual current URL
              ? { ...s.navItem, ...s.navItemActive }
              : s.navItem}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

const s = {
  sidebar: { width: '260px', backgroundColor: '#1E293B', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', flexShrink: 0 },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', marginBottom: '2rem' },
  logoIcon: { width: '36px', height: '36px', backgroundColor: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'white' },
  logoText: { fontSize: '1rem', fontWeight: '700', color: '#F8FAFC' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', color: '#94A3B8', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' },
  navItemActive: { backgroundColor: '#2563EB', color: '#F8FAFC' },
  navIcon: { fontSize: '1rem', width: '20px', textAlign: 'center' },
}

export default Sidebar