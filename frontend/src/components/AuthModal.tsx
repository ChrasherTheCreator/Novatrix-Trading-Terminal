import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/app'
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ShieldCheck, Zap } from 'lucide-react'

interface AuthModalProps {
  onClose?: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register, enterDemoMode } = useAppStore()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let success = false
      if (isLogin) {
        success = await login(formData.email, formData.password)
      } else {
        success = await register(formData.username, formData.email, formData.password)
      }

      if (success) {
        onClose?.()
      } else {
        setError(isLogin ? 'Invalid credentials' : 'Registration failed. Try a different email.')
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    // Small delay for UX feedback
    await new Promise(r => setTimeout(r, 800))
    enterDemoMode()
    setDemoLoading(false)
    onClose?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          borderRadius: '28px',
          padding: '44px',
          position: 'relative',
          boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139,92,246,0.08)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '68px', height: '68px',
            background: 'linear-gradient(135deg, var(--accent), #aa88ff)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 8px 24px rgba(139,92,246,0.4)'
          }}>
            <ShieldCheck size={34} color="white" />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isLogin ? 'Continue your trading journey' : 'Join the Creatix ecosystem today'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {!isLogin && (
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="TradingAlias"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '13px 16px 13px 48px', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '13px 16px 13px 48px', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '13px 16px 13px 48px', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ color: 'var(--red)', fontSize: '12px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px', padding: '14px', borderRadius: '12px',
              background: 'var(--accent)', color: 'white', fontWeight: '700',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: loading ? 0.7 : 1,
              fontSize: '15px',
              boxShadow: '0 4px 16px rgba(139,92,246,0.35)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.45)' }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.35)' }}
          >
            {loading ? 'Verifying...' : (
              <>
                {isLogin ? <LogIn size={17} /> : <UserPlus size={17} />}
                {isLogin ? 'Sign In' : 'Register Now'}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Demo Button */}
        <motion.button
          id="demo-login-btn"
          onClick={handleDemoLogin}
          disabled={demoLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: demoLoading
              ? 'rgba(250,204,21,0.08)'
              : 'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(245,158,11,0.08))',
            border: '1px solid rgba(250,204,21,0.3)',
            color: '#fbbf24',
            fontWeight: '700', fontSize: '15px',
            cursor: demoLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'border-color 0.2s, background 0.2s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => { if (!demoLoading) e.currentTarget.style.borderColor = 'rgba(250,204,21,0.6)' }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(250,204,21,0.3)' }}
        >
          {demoLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: '18px', height: '18px', border: '2px solid rgba(251,191,36,0.3)', borderTopColor: '#fbbf24', borderRadius: '50%' }}
              />
              Loading Demo...
            </>
          ) : (
            <>
              <Zap size={17} fill="#fbbf24" />
              Try Demo — No Login Required
            </>
          )}
          {/* Shimmer effect */}
          {!demoLoading && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.15), transparent)',
                pointerEvents: 'none'
              }}
            />
          )}
        </motion.button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', marginTop: '10px', opacity: 0.7 }}>
          Demo data resets automatically on logout. No account needed.
        </p>

        {/* Toggle Login/Register */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isLogin ? "Don't have an account?" : "Already a member?"}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', cursor: 'pointer', padding: '0 4px' }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
