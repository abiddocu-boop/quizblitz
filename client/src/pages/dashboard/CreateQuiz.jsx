import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import QuizBuilder from '../../components/quiz/QuizBuilder';
import { useToast } from '../../components/ui/Icons';

const COLORS = ['#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706','#16A34A','#0891B2','#1D4ED8'];

function emptyQ() {
  return { type:'multiple_choice',text:'',imageUrl:'',options:[{text:'',isCorrect:true},{text:'',isCorrect:false},{text:'',isCorrect:false},{text:'',isCorrect:false}],acceptedAnswers:[''],explanation:'',timeLimit:20,points:1000,shuffleOptions:false };
}

export default function CreateQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, ToastEl } = useToast();
  const isEditing = Boolean(id);

  const [meta, setMeta] = useState({ title:'', description:'', subject:'', coverColor:COLORS[0] });
  const [questions, setQuestions] = useState([emptyQ()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/quizzes/${id}`)
      .then(({ quiz }) => {
        setMeta({ title:quiz.title, description:quiz.description||'', subject:quiz.subject||'', coverColor:quiz.coverColor||COLORS[0] });
        setQuestions(quiz.questions.length ? quiz.questions : [emptyQ()]);
      })
      .catch(() => { show('Failed to load quiz','error'); navigate('/dashboard/quizzes'); })
      .finally(() => setLoading(false));
  }, [id, isEditing]); // eslint-disable-line

  const handleQChange = useCallback(next => setQuestions(next), []);

  async function handleSave() {
    if (!meta.title.trim()) return show('Quiz title is required','error');
    if (!questions.length) return show('Add at least one question','error');
    if (questions.find(q => !q.text.trim())) return show('All questions need text','error');
    setSaving(true);
    try {
      const payload = { ...meta, questions };
      if (isEditing) { await api.put(`/quizzes/${id}`, payload); show('Quiz saved!','success'); }
      else { const { quiz } = await api.post('/quizzes', payload); show('Quiz created!','success'); navigate(`/dashboard/quizzes/${quiz._id}/edit`); }
    } catch (err) { show(err.message||'Save failed','error'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="page-container" style={{display:'flex',justifyContent:'center',paddingTop:'4rem'}}><div className="spinner" style={{width:32,height:32}}/></div>;

  return (
    <div className="page-container-wide">
      {ToastEl}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}} className="anim-fade-up">
        <div style={{display:'flex',alignItems:'center',gap:'.875rem'}}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>navigate('/dashboard/quizzes')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="page-title">{isEditing?'Edit Quiz':'Create Quiz'}</h1>
            <p className="page-subtitle">{questions.length} question{questions.length!==1?'s':''}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:'.75rem'}}>
          {isEditing&&<button className="btn btn-success" onClick={()=>navigate(`/host/${id}`)}>Host Now</button>}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving?<><div className="spinner" style={{width:14,height:14,borderWidth:2,borderTopColor:'white',borderColor:'rgba(255,255,255,.3)'}}/>Saving...</>:(isEditing?'Save Changes':'Create Quiz')}
          </button>
        </div>
      </div>

      <div className="card anim-fade-up delay-1" style={{marginBottom:'1.5rem'}}>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="form-group" style={{gridColumn:'1 / -1',marginBottom:0}}>
              <label className="form-label">Quiz Title *</label>
              <input className="input input-lg" placeholder="e.g. Chapter 4 — The Water Cycle" value={meta.title} maxLength={120} onChange={e=>setMeta(m=>({...m,title:e.target.value}))}/>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Subject / Topic</label>
              <input className="input" placeholder="e.g. Biology, History..." value={meta.subject} maxLength={50} onChange={e=>setMeta(m=>({...m,subject:e.target.value}))}/>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Description</label>
              <input className="input" placeholder="Brief description (optional)" value={meta.description} maxLength={200} onChange={e=>setMeta(m=>({...m,description:e.target.value}))}/>
            </div>
          </div>
          <div style={{marginTop:'1rem'}}>
            <label className="form-label">Accent Color</label>
            <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
              {COLORS.map(c=>(
                <button key={c} type="button" onClick={()=>setMeta(m=>({...m,coverColor:c}))} style={{width:28,height:28,borderRadius:'50%',background:c,border:`3px solid ${meta.coverColor===c?'var(--text-1)':'transparent'}`,cursor:'pointer',padding:0,transition:'border-color .15s ease'}}/>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card anim-fade-up delay-2">
        <div className="card-body">
          <QuizBuilder questions={questions} onChange={handleQChange}/>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginTop:'1.5rem'}}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving?'Saving...':(isEditing?'Save Changes':'Create Quiz')}
        </button>
      </div>
    </div>
  );
}
