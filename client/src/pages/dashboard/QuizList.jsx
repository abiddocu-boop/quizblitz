import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { IconPlus, IconPlay, IconEdit, IconTrash, IconDownload, IconQuiz } from '../../components/ui/Icons';
import { useToast } from '../../components/ui/Icons';

export default function QuizList() {
  const navigate = useNavigate();
  const { show, ToastEl } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/quizzes').then(({quizzes:q})=>setQuizzes(q||[])).catch(()=>show('Failed to load quizzes','error')).finally(()=>setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    setDeleting(id);
    try { await api.delete(`/quizzes/${id}`); setQuizzes(p=>p.filter(q=>q._id!==id)); show('Quiz deleted','success'); }
    catch { show('Failed to delete','error'); }
    finally { setDeleting(null); }
  }

  function exportQuiz(quiz) {
    const blob = new Blob([JSON.stringify(quiz,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${quiz.title.replace(/\s+/g,'-').toLowerCase()}.json`; a.click();
    show('Exported','success');
  }

  return (
    <div className="page-container">
      {ToastEl}
      <div className="page-header">
        <div><h1 className="page-title">My Quizzes</h1><p className="page-subtitle">{quizzes.length} quiz{quizzes.length!==1?'zes':''} in your library</p></div>
        <button className="btn btn-primary" onClick={()=>navigate('/dashboard/create')}><IconPlus size={15}/>Create Quiz</button>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}><div className="spinner" style={{width:32,height:32}}/></div>
      ) : quizzes.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div style={{color:'var(--border-strong)',marginBottom:'.75rem'}}><IconQuiz size={48}/></div>
          <h3 className="t-title" style={{marginBottom:'.375rem'}}>No quizzes yet</h3>
          <p className="t-small text-muted" style={{marginBottom:'1.25rem'}}>Create your first quiz</p>
          <button className="btn btn-primary" onClick={()=>navigate('/dashboard/create')}><IconPlus size={15}/>Create Quiz</button>
        </div></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
          {quizzes.map((quiz,i)=>(
            <div key={quiz._id} className={'card card-hover anim-fade-up delay-'+(Math.min(i,5))} style={{overflow:'hidden',position:'relative'}}>
              <div style={{width:5,position:'absolute',top:0,left:0,bottom:0,background:quiz.coverColor||'var(--primary)',borderRadius:'var(--radius-lg) 0 0 var(--radius-lg)'}}/>
              <div className="card-body" style={{paddingLeft:'1.75rem',display:'flex',alignItems:'center',gap:'1.25rem',flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.625rem',flexWrap:'wrap'}}>
                    <h3 className="t-title" style={{margin:0}}>{quiz.title}</h3>
                    {quiz.subject&&<span className="tag">{quiz.subject}</span>}
                  </div>
                  <div style={{display:'flex',gap:'1.25rem',marginTop:'.375rem'}}>
                    <span className="t-small text-muted">{quiz.questionCount||0} questions</span>
                    <span className="t-small text-muted">{quiz.stats?.totalPlays||0} sessions</span>
                    {quiz.stats?.lastPlayedAt&&<span className="t-small text-muted">Last: {new Date(quiz.stats.lastPlayedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:'.5rem',flexShrink:0}}>
                  <button className="btn btn-primary btn-sm" onClick={()=>navigate(`/host/${quiz._id}`)}><IconPlay size={13}/>Host</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>navigate(`/dashboard/quizzes/${quiz._id}/edit`)}><IconEdit size={13}/>Edit</button>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Export" onClick={()=>exportQuiz(quiz)}><IconDownload size={14}/></button>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{color:'var(--danger)'}} disabled={deleting===quiz._id} onClick={()=>handleDelete(quiz._id)}>
                    {deleting===quiz._id?<div className="spinner" style={{width:14,height:14,borderWidth:2}}/>:<IconTrash size={14}/>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
