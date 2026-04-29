import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV = [
  { label: 'My Quizzes', path: '/dashboard', icon: 'grid' },
  { label: 'Create Quiz', path: '/dashboard/create', icon: 'plus' },
  { label: 'Analytics',   path: '/dashboard/analytics', icon: 'chart' },
];

const Icon = ({ name }) => {
  if (name === 'grid') return <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
  if (name === 'plus') return <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8.5 5.5v6M5.5 8.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (name === 'chart') return <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 12l3.5-3.5 2.5 2.5L12 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 15h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (name === 'play') return <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M7 5.5l5 3-5 3V5.5z" fill="currentColor"/></svg>;
  return null;
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname.startsWith(path);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo" style={{ cursor:'pointer' }} onClick={() => navigate('/dashboard')}>
          <div className="logo-mark">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2.5 7.5l3.5 3.5 6.5-6.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Quiz<span className="logo-text-accent">Blitz</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-label">Workspace</p>
        {NAV.map(item => (
          <button key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <Icon name={item.icon}/>{item.label}
          </button>
        ))}
        <p className="nav-section-label" style={{ marginTop:16 }}>Live Game</p>
        <button className="nav-item" onClick={() => navigate('/host')}>
          <Icon name="play"/>Host a Game
        </button>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--indigo-100)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.8rem',color:'var(--primary)',flexShrink:0 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:600,fontSize:'0.8rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:'0.72rem',color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm btn-full" onClick={logout} style={{ justifyContent:'flex-start', color:'var(--text-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
