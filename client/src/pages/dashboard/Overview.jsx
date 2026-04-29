import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { IconPlus, IconPlay, IconEdit, IconQuiz, IconUsers, IconChart } from '../../components/ui/Icons';

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/quizzes').then(({quizzes:q})=>setQuizzes(q||[])).catch(console.error).finally(()=>setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const totalQ = quizzes.reduce((a,q)=>a+(q.questionCount||0),0);

  return (
    <div className="page-container">
      <div className="anim-fade-up" style={{marginBottom:'2rem'}}>
        <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]}.</h1>
        <p className="page-subtitle">Here's an overview of your quizzes and activity.</p>
      </div>

      <div className="stat-grid anim-fade-up delay-1" style={{marginBottom:'2rem'}}>
        {[
          {label:'Total Quizzes', value:quizzes.length, icon:IconQuiz},
          {label:'Total Questions', value:totalQ, icon:IconChart},
          {label:'Sessions Run', value:quizzes.reduce((a,q)=>a+(q.stats?.totalPlays||0),0), icon:IconPlay},
          {label:'Students Reached', value:quizzes.reduce((a,q)=>a+(q.stats?.totalPlayers||0),0), icon:IconUsers},
        ].map(({label,value,icon:Icon})=>(
          <div key={label} className="stat-card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.5rem'}}>
              <span className="t-label">{label}</span>
              <div style={{padding:'.4rem',background:'var(--primary-light)',borderRadius:8,color:'var(--primary)'}}><Icon size={15}/></div>
            </div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}} className="anim-fade-up delay-2">
        <h2 className="t-heading">Recent Quizzes</h2>
        <button className="btn btn-primary btn-sm" onClick={()=>navigate('/dashboard/create')}><IconPlus size={14}/>New Quiz</button>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner" style={{width:28,height:28}}/></div>
      ) : quizzes.length === 0 ? (
        <div className="card anim-scale-in delay-2">
          <div className="empty-state">
            <div style={{color:'var(--border-strong)',marginBottom:'.75rem'}}><IconQuiz size={48}/></div>
            <h3 className="t-title" style={{marginBottom:'.375rem'}}>No quizzes yet</h3>
            <p className="t-small text-muted" style={{marginBottom:'1.25rem'}}>Create your first quiz to get started.</p>
            <button className="btn btn-primary" onClick={()=>navigate('/dashboard/create')}><IconPlus size={15}/>Create Quiz</button>
          </div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
          {quizzes.slice(0,6).map((quiz,i)=>(
            <div key={quiz._id} className={'card quiz-card card-hover anim-fade-up delay-'+(Math.min(i+2,5))} style={{cursor:'pointer'}} onClick={()=>navigate(`/dashboard/quizzes/${quiz._id}/edit`)}>
              <div className="quiz-card-accent" style={{background:quiz.coverColor||'var(--primary)'}}/>
              <div className="card-body" style={{paddingTop:'1.25rem'}}>
                <h3 className="t-title" style={{marginBottom:'.25rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{quiz.title}</h3>
                {quiz.subject&&<span className="tag" style={{marginBottom:'.75rem',display:'inline-block'}}>{quiz.subject}</span>}
                <div style={{display:'flex',gap:'1rem',marginTop:'.75rem'}}>
                  <span className="t-small text-muted">{quiz.questionCount||0} questions</span>
                  {quiz.stats?.lastPlayedAt&&<span className="t-small text-muted">Last {new Date(quiz.stats.lastPlayedAt).toLocaleDateString()}</span>}
                </div>
                <div style={{display:'flex',gap:'.5rem',marginTop:'1rem'}}>
                  <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();navigate(`/host/${quiz._id}`)}}><IconPlay size={13}/>Host</button>
                  <button className="btn btn-secondary btn-sm" onClick={e=>{e.stopPropagation();navigate(`/dashboard/quizzes/${quiz._id}/edit`)}}><IconEdit size={13}/>Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
