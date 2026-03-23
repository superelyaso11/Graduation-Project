import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()

    //form state
    const [formData, setFormData] = useState({email: '', password: ''})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const validate = () => {
        if (!formData.email || !formData.password){
            setError('All fields are required')
            return false
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)){
            setError('Please enter a valid email')
            return false
        }
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validate()) return

        setLoading(true)
        try{
            const {data} = await api.post('/auth/login', formData)
            login(data)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

      return (
      <div style={s.page}>
      {/* Subtle background gradient orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <span style={s.logoIcon}>🎓</span>
        </div>

        <h1 style={s.title}>Welcome Back</h1>
        <p style={s.subtitle}>Sign in to Lost & Found</p>

        {/* Error message */}
        {error && (
          <div style={s.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type='email'
              name='email'
              placeholder='student@university.edu'
              value={formData.email}
              onChange={handleChange}
              onFocus={e => e.target.style.borderColor = '#2563EB'}   /* blue glow on focus */
              onBlur={e => e.target.style.borderColor = '#334155'}    /* back to default */
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type='password'
              name='password'
              placeholder='••••••••'
              value={formData.password}
              onChange={handleChange}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            style={loading ? { ...s.btn, opacity: 0.6, cursor: 'not-allowed' } : s.btn}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#1D4ED8' }}
            onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#2563EB' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={s.footerText}>
          Don't have an account?{' '}
          <Link to='/register' style={s.link}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem',
  },
  orb1: {                                         /* decorative blue gradient blob top left */
    position: 'absolute', top: '-150px', left: '-150px',
    width: '500px', height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {                                         /* decorative blue gradient blob bottom right */
    position: 'absolute', bottom: '-150px', right: '-150px',
    width: '500px', height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
    border: '1px solid #334155',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    width: '64px', height: '64px',
    backgroundColor: '#2563EB',
    borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.75rem',
    margin: '0 auto 1.5rem',
  },
  logoIcon: { fontSize: '1.75rem' },
  title: { textAlign: 'center', fontSize: '1.75rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '0.25rem' },
  subtitle: { textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.75rem' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#FCA5A5',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
    display: 'flex', gap: '0.5rem', alignItems: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: '500', color: '#F8FAFC' },
  input: {
    backgroundColor: '#0D1B2E',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#F8FAFC',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Sora, sans-serif',
  },
  btn: {
    marginTop: '0.5rem',
    backgroundColor: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '0.85rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'Sora, sans-serif',
  },
  footerText: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#94A3B8' },
  link: { color: '#2563EB', textDecoration: 'none', fontWeight: '600' },
}

export default Login