import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LogoMark = () => (
  <div className="logo-mark" style={{ width: 40, height: 40, borderRadius: 10 }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="3" rx="1.5" fill="white"/>
      <rect x="3" y="10.5" width="13" height="3" rx="1.5" fill="white" opacity=".7"/>
      <rect x="3" y="18" width="15" height="3" rx="1.5" fill="white" opacity=".5"/>
    </svg>
  </div>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="page-center">
      <div style={{ position:'fixed',inset:0,zIndex:0,backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',backgroundSize:'40px 40px',opacity:.5,pointerEvents:'none' }} />
      <div style={{ position:'relative',zIndex:1,width:'100%',maxWidth:420 }}>
        <div className="text-center mb-3 anim-fade-up">
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'.625rem',marginBottom:'1.5rem' }}>
            <LogoMark /><span className="logo-text" style={{ fontSize:'1.25rem' }}>QuizBlitz</span>
          </div>
          <h1 style={{ fontSize:'1.625rem',fontWeight:800,letterSpacing:'-.025em',marginBottom:'.35rem' }}>Welcome back</h1>
          <p className="t-small text-muted">Sign in to your educator account</p>
        </div>
        <div className="card anim-fade-up delay-1">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input id="email" className={'input input-lg' + (error ? ' error' : '')} type="email" placeholder="you@school.edu" autoComplete="email" autoFocus value={form.email} onChange={e => { setForm({...form,email:e.target.value}); setError(''); }} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input id="password" className={'input input-lg' + (error ? ' error' : '')} type="password" placeholder="Min. 8 characters" autoComplete="current-password" value={form.password} onChange={e => { setForm({...form,password:e.target.value}); setError(''); }} />
              </div>
              {error && <div style={{ background:'var(--danger-light)',border:'1px solid #FECACA',borderRadius:'var(--radius-md)',padding:'.75rem 1rem',color:'var(--danger)',fontSize:'.875rem',marginBottom:'1rem' }}>{error}</div>}
              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={busy || !form.email || !form.password}>
                {busy ? <><div className="spinner" style={{width:16,height:16,borderWidth:2,borderTopColor:'white',borderColor:'rgba(255,255,255,.3)'}} />Signing in...</> : 'Sign in'}
              </button>
            </form>
            <hr className="divider" />
            <p className="t-small text-muted text-center">No account? <Link to="/register" style={{ color:'var(--primary)',fontWeight:600 }}>Create one free</Link></p>
          </div>
        </div>
        <p className="t-xs text-muted text-center mt-2 anim-fade-in delay-3">
          <Link to="/join" style={{ color:'var(--text-3)' }}>Student? Join a game instead</Link>
        </p>
      </div>
    </div>
  );
}
