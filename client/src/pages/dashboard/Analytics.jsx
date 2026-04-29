import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { IconChart, IconQuiz } from '../../components/ui/Icons';

export default function Analytics() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingA, setLoadingA] = useState(false);

  useEffect(()=>{
    api.get('/quizzes').then(({quizzes:q})=>{ setQuizzes(q||[]); if(q?.length) setSelected(q[0]._id); }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!selected) return; setLoadingA(true);
    api.get(`/quizzes/${selected}/analytics`).then(setAnalytics).catch(()=>setAnalytics(null)).finally(()=>setLoadingA(false));
  },[selected]);

  if(loading) return <div className="page-container" style={{display:'flex',justifyContent:'center',paddingTop:'4rem'}}><div className="spinner" style={{width:32,height:32}}/></div>;

  if(!quizzes.length) return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Analytics</h1></div>
      <div className="card"><div className="empty-state">
        <div style={{color:'var(--border-strong)',marginBottom:'.75rem'}}><IconChart size={48}/></div>
        <h3 className="t-title" style={{marginBottom:'.375rem'}}>No data yet</h3>
        <p className="t-small text-muted" style={{marginBottom:'1.25rem'}}>Run quiz sessions to see analytics.</p>
        <button className="btn btn-primary" onClick={()=>navigate('/dashboard/quizzes')}>Go to Quizzes</button>
      </div></div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header anim-fade-up">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Performance data across quiz sessions</p></div>
      </div>

      <div className="form-group anim-fade-up delay-1">
        <label className="form-label">Select Quiz</label>
        <select className="input" style={{maxWidth:400}} value={selected||''} onChange={e=>setSelected(e.target.value)}>
          {quizzes.map(q=><option key={q._id} value={q._id}>{q.title}</option>)}
        </select>
      </div>

      {loadingA ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner" style={{width:28,height:28}}/></div>
      ) : !analytics?.summary ? (
        <div className="card anim-scale-in"><div className="empty-state"><p className="t-small text-muted">No completed sessions for this quiz yet.</p></div></div>
      ) : (
        <>
          <div className="stat-grid anim-fade-up delay-2" style={{marginBottom:'1.5rem'}}>
            {[
              {label:'Total Sessions', value:analytics.summary.totalSessions},
              {label:'Total Students', value:analytics.summary.totalPlayers},
              {label:'Avg Per Session', value:analytics.summary.avgPlayersPerSession},
              {label:'Avg Score', value:analytics.summary.avgScore?.toLocaleString()},
            ].map(({label,value})=>(
              <div key={label} className="stat-card"><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
            ))}
          </div>

          {analytics.sessions[0]?.questionStats?.length > 0 && (
            <div className="card anim-fade-up delay-3" style={{marginBottom:'1.5rem'}}>
              <div className="card-body">
                <h3 className="t-title" style={{marginBottom:'1.25rem'}}>Question Accuracy — Latest Session</h3>
                {analytics.sessions[0].questionStats.map((qs,i)=>(
                  <div key={i} style={{marginBottom:'1rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.35rem'}}>
                      <span className="t-small" style={{fontWeight:600,flex:1,paddingRight:'1rem'}}>Q{i+1}: {qs.questionText}</span>
                      <span className="badge" style={{background:qs.accuracy>=70?'var(--success-light)':qs.accuracy>=40?'var(--warning-light)':'var(--danger-light)',color:qs.accuracy>=70?'var(--success-dark)':qs.accuracy>=40?'#92400E':'var(--danger)',flexShrink:0}}>{qs.accuracy}% correct</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{width:`${qs.accuracy}%`,background:qs.accuracy>=70?'var(--success)':qs.accuracy>=40?'var(--warning)':'var(--danger)'}}/></div>
                    <p className="t-xs text-muted" style={{marginTop:'.25rem'}}>{qs.totalAnswers} responses · Avg {Math.round(qs.avgResponseMs/1000)}s</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card anim-fade-up delay-4">
            <div className="card-body">
              <h3 className="t-title" style={{marginBottom:'1rem'}}>Session History</h3>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.875rem'}}>
                  <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['Date','PIN','Players','Top Score','Status'].map(h=><th key={h} style={{padding:'.625rem .75rem',textAlign:'left',fontWeight:600,color:'var(--text-3)',fontSize:'.8125rem'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {analytics.sessions.map(s=>{
                      const topScore = s.players?.length ? Math.max(...s.players.map(p=>p.score)) : 0;
                      return <tr key={s._id} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'.75rem',color:'var(--text-2)'}}>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td style={{padding:'.75rem',fontFamily:'monospace',fontWeight:600}}>{s.pin}</td>
                        <td style={{padding:'.75rem'}}>{s.playerCount}</td>
                        <td style={{padding:'.75rem',fontWeight:700,color:'var(--primary)'}}>{topScore.toLocaleString()}</td>
                        <td style={{padding:'.75rem'}}><span className={'badge '+(s.status==='completed'?'badge-success':'badge-neutral')}>{s.status}</span></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
