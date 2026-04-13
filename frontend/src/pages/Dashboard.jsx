import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

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
    const { user } = useAuth()

  return (
    <div style={s.layout}>

      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main Content ── */}
      <main style={s.main}>

        {/* Top Navbar */}
        <Navbar
          title='Dashboard'
          subtitle={`Welcome back, ${user?.name?.split(' ')[0]}!`}
        />

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
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', padding: '2rem 2rem 0' },
  statCard: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  statLabel: { fontSize: '0.875rem', color: '#94A3B8', fontWeight: '500', lineHeight: '1.4' },
  statIconWrap: { width: '36px', height: '36px', backgroundColor: '#1E3A5F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statIcon: { color: '#2563EB', fontSize: '1rem' },
  statValue: { fontSize: '2rem', fontWeight: '800', color: '#F8FAFC', marginBottom: '0.5rem' },
  statChange: { fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' },
  changeArrow: { color: '#10B981' },
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