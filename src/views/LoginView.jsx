import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { ShieldAlert, ShieldCheck, Mail, Lock, LogIn } from 'lucide-react';

export default function LoginView() {
  const { login } = usePortal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg('');

    // Small delay to simulate real network request
    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setIsLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      const res = login(quickEmail, quickPassword);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 300);
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      width: '100vw',
      background: 'radial-gradient(circle at top right, #1e293b, #090d16)',
      fontFamily: 'var(--font-family)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      
      {/* Background glowing blobs */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'rgba(59, 130, 246, 0.15)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        top: '20%',
        left: '25%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'rgba(236, 72, 153, 0.1)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        bottom: '20%',
        right: '20%',
        pointerEvents: 'none'
      }} />

      {/* Glassmorphic Login Container */}
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '2.5rem', 
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        animation: 'scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Logo and header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: 'var(--grad-primary)', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.75rem',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            Y
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.5rem', letterSpacing: '-0.5px' }}>
            YHL Operations Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sign in to access production systems
          </p>
        </div>

        {/* Error box */}
        {errorMsg && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            borderRadius: '8px', 
            padding: '0.75rem 1rem', 
            fontSize: '0.8rem', 
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="glass-label" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="email" 
                className="glass-input" 
                style={{ paddingLeft: '2.5rem', background: 'var(--bg-input)' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourhappylife.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="glass-label" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="password" 
                className="glass-input" 
                style={{ paddingLeft: '2.5rem', background: 'var(--bg-input)' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="glass-btn-primary" 
            style={{ 
              marginTop: '0.5rem', 
              justifyContent: 'center', 
              padding: '0.75rem', 
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: 'var(--shadow-glow-cyan)'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : (
              <>
                Sign In <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        {/* Developer Quick-logins divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
          <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: 600, padding: '0 0.75rem' }}>
            Quick Presets
          </span>
          <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Quick Logins Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button 
            className="glass-btn" 
            style={{ 
              padding: '0.5rem 0.75rem', 
              fontSize: '0.75rem', 
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)'
            }}
            onClick={() => handleQuickLogin('tech@yourhappylife.com', 'admin123')}
            disabled={isLoading}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={14} color="var(--color-rose)" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: '#fff' }}>Super Admin</strong>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>tech@yourhappylife.com</div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-cyan)' }}>Auto Log In →</span>
          </button>

          <button 
            className="glass-btn" 
            style={{ 
              padding: '0.5rem 0.75rem', 
              fontSize: '0.75rem', 
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)'
            }}
            onClick={() => handleQuickLogin('ops@yourhappylife.com', 'ops123')}
            disabled={isLoading}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogIn size={14} color="var(--color-cyan)" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: '#fff' }}>Operations view</strong>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>ops@yourhappylife.com</div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-cyan)' }}>Auto Log In →</span>
          </button>

          <button 
            className="glass-btn" 
            style={{ 
              padding: '0.5rem 0.75rem', 
              fontSize: '0.75rem', 
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)'
            }}
            onClick={() => handleQuickLogin('accounts@yourhappylife.com', 'accts123')}
            disabled={isLoading}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogIn size={14} color="var(--color-emerald)" />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: '#fff' }}>Accounts view</strong>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>accounts@yourhappylife.com</div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-cyan)' }}>Auto Log In →</span>
          </button>
        </div>

      </div>
    </div>
  );
}
