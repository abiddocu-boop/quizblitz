import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', institution:'' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const upd = (f,v) => { setForm(p=>({...p,[f]:v})); setError(''); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try { await register(form.name, form.email, form.password, form.institution); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="page-center">
      <div style={{ position:'fixed',inset:0,zIndex:0,backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',backgroundSize:'40px 40px',opacity:.5,pointerEvents:'none' }} />
      <div style={{ position:'relative',zIndex:1,width:'100%',maxWidth:440 }}>
        <div className="text-center mb-3 anim-fade-up">
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'.625rem',marginBottom:'1.5rem' }}>
            <div className="logo-mark" style={{width:40,height:40,borderRadius:10}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="3" rx="1.5" fill="white"/><rect x="3" y="10.5" width="13" height="3" rx="1.5" fill="white" opacity=".7"/><rect x="3" y="18" width="15" height="3" rx="1.5" fill="white" opacity=".5"/></svg></div>
            <span className="logo-text" style={{fontSize:'1.25rem'}}>QuizBlitz</span>
          </div>
          <h1 style={{fontSize:'1.625rem',fontWeight:800,letterSpacing:'-.025em',marginBottom:'.35rem'}}>Create your account</h1>
          <p className="t-small text-muted">Free forever for educators</p>
        </div>
        <div className="card anim-fade-up delay-1">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem',marginBottom:'.75rem'}}>
                <div><label className="form-label">Full name</label><input className="input" placeholder="Jane Smith" value={form.name} onChange={e=>upd('name',e.target.value)} required maxLength={60} /></div>
                <div><label className="form-label">Institution</label><input className="input" placeholder="School / University" value={form.institution} onChange={e=>upd('institution',e.target.value)} maxLength={80} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="input" type="email" placeholder="you@school.edu" autoComplete="email" value={form.email} onChange={e=>upd('email',e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="input" type="password" placeholder="Min. 8 characters" autoComplete="new-password" value={form.password} onChange={e=>upd('password',e.target.value)} required minLength={8} />
                {form.password.length > 0 && <div className="form-hint" style={{color:form.password.length>=8?'var(--success-dark)':'var(--text-4)'}}>{form.password.length>=8?'Password strength: good':`${8-form.password.length} more characters needed`}</div>}
              </div>
              {error && <div style={{background:'var(--danger-light)',border:'1px solid #FECACA',borderRadius:'var(--radius-md)',padding:'.75rem 1rem',color:'var(--danger)',fontSize:'.875rem',marginBottom:'1rem'}}>{error}</div>}
              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={busy||!form.name||!form.email||form.password.length<8}>
                {busy ? <><div className="spinner" style={{width:16,height:16,borderWidth:2,borderTopColor:'white',borderColor:'rgba(255,255,255,.3)'}}/>Creating account...</> : 'Create account'}
              </button>
            </form>
            <hr className="divider" />
            <p className="t-small text-muted text-center">Already have an account? <Link to="/login" style={{color:'var(--primary)',fontWeight:600}}>Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
