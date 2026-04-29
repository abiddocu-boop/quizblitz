import { useState, useCallback } from 'react';
import { IconPlus, IconTrash, IconCheck, IconUpload, IconDownload, IconImage } from '../ui/Icons';

const TYPES = [{value:'multiple_choice',label:'Multiple Choice'},{value:'true_false',label:'True / False'},{value:'short_answer',label:'Short Answer'},{value:'poll',label:'Poll'}];
const COLORS = ['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
const BG     = ['var(--opt-a-bg)','var(--opt-b-bg)','var(--opt-c-bg)','var(--opt-d-bg)'];
const LABELS = ['A','B','C','D'];

function emptyQ() {
  return { type:'multiple_choice',text:'',imageUrl:'',options:[{text:'',isCorrect:true},{text:'',isCorrect:false},{text:'',isCorrect:false},{text:'',isCorrect:false}],acceptedAnswers:[''],explanation:'',timeLimit:20,points:1000,shuffleOptions:false };
}

function MCOptions({q,qi,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.25rem'}}>
        <label className="form-label" style={{margin:0}}>Answer Options</label>
        <span style={{fontSize:'.75rem',color:'var(--text-4)'}}>Click letter to mark correct</span>
      </div>
      {q.options.map((opt,oi)=>(
        <div key={oi} style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
          <button type="button" onClick={()=>onChange(qi,'options',q.options.map((o,j)=>({...o,isCorrect:j===oi})))}
            style={{width:32,height:32,borderRadius:8,border:`2px solid ${opt.isCorrect?'var(--success)':COLORS[oi]}`,background:opt.isCorrect?'var(--success)':BG[oi],color:opt.isCorrect?'white':COLORS[oi],fontWeight:800,fontSize:'.8125rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',transition:'all .15s ease'}}>
            {opt.isCorrect?<IconCheck size={13}/>:LABELS[oi]}
          </button>
          <input className="input" placeholder={'Option '+LABELS[oi]} value={opt.text} maxLength={120}
            onChange={e=>onChange(qi,'options',q.options.map((o,j)=>j===oi?{...o,text:e.target.value}:o))}/>
        </div>
      ))}
    </div>
  );
}

function TFOptions({q,qi,onChange}) {
  return (
    <div style={{display:'flex',gap:'.75rem'}}>
      {['True','False'].map((label,i)=>{
        const isC = i===0?q.options[0]?.isCorrect:q.options[1]?.isCorrect;
        return <button key={label} type="button" className="btn" style={{flex:1,border:`2px solid ${isC?'var(--success)':'var(--border)'}`,background:isC?'var(--success-light)':'var(--bg-white)',color:isC?'var(--success-dark)':'var(--text-2)',fontWeight:600}}
          onClick={()=>onChange(qi,'options',[{text:'True',isCorrect:i===0},{text:'False',isCorrect:i===1}])}>
          {isC&&<IconCheck size={14}/>}{label}
        </button>;
      })}
    </div>
  );
}

function SAOptions({q,qi,onChange}) {
  const answers = q.acceptedAnswers||[''];
  return (
    <div>
      <label className="form-label">Accepted Answers</label>
      <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
        {answers.map((ans,ai)=>(
          <div key={ai} style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
            <input className="input" placeholder={'Answer '+(ai+1)} value={ans}
              onChange={e=>{const n=[...answers];n[ai]=e.target.value;onChange(qi,'acceptedAnswers',n);}}/>
            {answers.length>1&&<button type="button" className="btn btn-ghost btn-sm" style={{color:'var(--danger)',flexShrink:0}} onClick={()=>onChange(qi,'acceptedAnswers',answers.filter((_,j)=>j!==ai))}><IconTrash size={14}/></button>}
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" style={{alignSelf:'flex-start'}} onClick={()=>onChange(qi,'acceptedAnswers',[...answers,''])}><IconPlus size={13}/>Add variant</button>
      </div>
    </div>
  );
}

function PollOptions({q,qi,onChange}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
      <label className="form-label">Poll Options (no correct answer)</label>
      {q.options.map((opt,oi)=>(
        <div key={oi} style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
          <div style={{width:32,height:32,borderRadius:8,background:BG[oi],color:COLORS[oi],fontWeight:800,fontSize:'.8125rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`2px solid ${COLORS[oi]}`}}>{LABELS[oi]}</div>
          <input className="input" placeholder={'Option '+LABELS[oi]} value={opt.text} maxLength={120}
            onChange={e=>onChange(qi,'options',q.options.map((o,j)=>j===oi?{...o,text:e.target.value}:o))}/>
        </div>
      ))}
    </div>
  );
}

export default function QuizBuilder({ questions = [], onChange }) {
  const [activeQi, setActiveQi] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importErr, setImportErr] = useState('');

  const updateQ = useCallback((qi,field,value)=>{ onChange(questions.map((q,i)=>i===qi?{...q,[field]:value}:q)); },[questions,onChange]);

  function addQ() { const n=[...questions,emptyQ()]; onChange(n); setActiveQi(n.length-1); }
  function removeQ(qi) { if(questions.length<=1) return; onChange(questions.filter((_,i)=>i!==qi)); setActiveQi(Math.min(qi,questions.length-2)); }

  function handleTypeChange(qi,type) {
    let update={type};
    if(type==='true_false') update.options=[{text:'True',isCorrect:true},{text:'False',isCorrect:false}];
    else if(type==='multiple_choice'||type==='poll') update.options=questions[qi].options?.length===4?questions[qi].options:emptyQ().options;
    onChange(questions.map((q,i)=>i===qi?{...q,...update}:q));
  }

  function handleImport() {
    try { const a=Array.isArray(JSON.parse(importJson))?JSON.parse(importJson):[JSON.parse(importJson)]; onChange([...questions,...a.map(q=>({...emptyQ(),...q}))]); setShowImport(false); setImportJson(''); setImportErr(''); }
    catch { setImportErr('Invalid JSON.'); }
  }

  function exportJson() {
    const blob=new Blob([JSON.stringify(questions,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='quiz-questions.json';a.click();
  }

  const q = questions[activeQi];

  return (
    <div style={{display:'flex',gap:'1.25rem',alignItems:'flex-start'}}>
      {/* Question list */}
      <div style={{width:200,flexShrink:0,display:'flex',flexDirection:'column',gap:'.375rem'}}>
        <button className="btn btn-primary btn-sm btn-full" onClick={addQ} style={{marginBottom:'.5rem'}}><IconPlus size={13}/>Add Question</button>
        <div style={{maxHeight:400,overflowY:'auto',display:'flex',flexDirection:'column',gap:'.25rem'}}>
          {questions.map((qu,qi)=>(
            <button key={qi} onClick={()=>setActiveQi(qi)} style={{width:'100%',padding:'.6rem .75rem',borderRadius:'var(--radius-md)',border:`1.5px solid ${activeQi===qi?'var(--primary)':'var(--border)'}`,background:activeQi===qi?'var(--primary-light)':'var(--bg-white)',color:activeQi===qi?'var(--primary)':'var(--text-2)',fontSize:'.8125rem',fontWeight:600,textAlign:'left',cursor:'pointer',transition:'all .15s ease'}}>
              <div>Q{qi+1}</div>
              <div style={{fontSize:'.7rem',opacity:.7,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'.1rem'}}>{qu.text||'Untitled'}</div>
            </button>
          ))}
        </div>
        <hr className="divider" style={{margin:'.5rem 0'}}/>
        <button className="btn btn-ghost btn-sm" style={{justifyContent:'flex-start',gap:'.375rem'}} onClick={()=>setShowImport(!showImport)}><IconUpload size={13}/>Import JSON</button>
        <button className="btn btn-ghost btn-sm" style={{justifyContent:'flex-start',gap:'.375rem'}} onClick={exportJson}><IconDownload size={13}/>Export JSON</button>
      </div>

      {/* Editor */}
      {q ? (
        <div style={{flex:1}}>
          <div style={{display:'flex',gap:'.75rem',marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}}>
            <select className="input" style={{width:'auto',flex:'1 1 180px'}} value={q.type} onChange={e=>handleTypeChange(activeQi,e.target.value)}>
              {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div style={{display:'flex',alignItems:'center',gap:'.375rem'}}>
              <label className="form-label" style={{margin:0,whiteSpace:'nowrap'}}>Time</label>
              <select className="input" style={{width:80}} value={q.timeLimit} onChange={e=>updateQ(activeQi,'timeLimit',Number(e.target.value))}>
                {[5,10,15,20,30,45,60,90,120].map(t=><option key={t} value={t}>{t}s</option>)}
              </select>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'.375rem'}}>
              <label className="form-label" style={{margin:0}}>Pts</label>
              <input className="input" type="number" style={{width:80}} min={0} max={2000} step={100} value={q.points} onChange={e=>updateQ(activeQi,'points',Number(e.target.value))}/>
            </div>
            <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)',marginLeft:'auto'}} onClick={()=>removeQ(activeQi)} title="Delete"><IconTrash size={14}/></button>
          </div>

          <div className="form-group">
            <label className="form-label">Question</label>
            <textarea className="textarea" placeholder="Type your question..." value={q.text} rows={2} maxLength={400} onChange={e=>updateQ(activeQi,'text',e.target.value)}/>
          </div>

          <div className="form-group">
            <label className="form-label" style={{display:'flex',alignItems:'center',gap:'.35rem'}}><IconImage size={13}/>Image URL (optional)</label>
            <input className="input" placeholder="https://example.com/image.jpg" value={q.imageUrl||''} onChange={e=>updateQ(activeQi,'imageUrl',e.target.value)}/>
          </div>

          <div className="form-group">
            {q.type==='multiple_choice'&&<MCOptions q={q} qi={activeQi} onChange={updateQ}/>}
            {q.type==='true_false'&&<TFOptions q={q} qi={activeQi} onChange={updateQ}/>}
            {q.type==='short_answer'&&<SAOptions q={q} qi={activeQi} onChange={updateQ}/>}
            {q.type==='poll'&&<PollOptions q={q} qi={activeQi} onChange={updateQ}/>}
          </div>

          <div className="form-group">
            <label className="form-label">Explanation (shown after answer reveal)</label>
            <input className="input" placeholder="Optional — explain the correct answer" value={q.explanation||''} maxLength={300} onChange={e=>updateQ(activeQi,'explanation',e.target.value)}/>
          </div>

          {(q.type==='multiple_choice'||q.type==='poll')&&(
            <label style={{display:'flex',alignItems:'center',gap:'.5rem',cursor:'pointer',userSelect:'none'}}>
              <input type="checkbox" checked={q.shuffleOptions} onChange={e=>updateQ(activeQi,'shuffleOptions',e.target.checked)}/>
              <span style={{fontSize:'.875rem',color:'var(--text-2)'}}>Shuffle answer options for each student</span>
            </label>
          )}
        </div>
      ) : (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'3rem',color:'var(--text-4)'}}>
          Click "Add Question" to get started
        </div>
      )}

      {showImport&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,padding:'1.5rem'}} onClick={e=>e.target===e.currentTarget&&setShowImport(false)}>
          <div className="card" style={{width:'100%',maxWidth:540}}>
            <div className="card-body">
              <h3 className="t-title mb-2">Import Questions (JSON)</h3>
              <p className="t-small text-muted mb-2">Paste a JSON array of question objects.</p>
              <textarea className="textarea" style={{minHeight:160,fontFamily:'monospace',fontSize:'.8rem'}} placeholder='[{"type":"multiple_choice","text":"...","options":[...]}]' value={importJson} onChange={e=>{setImportJson(e.target.value);setImportErr('');}}/>
              {importErr&&<p className="form-error">{importErr}</p>}
              <div style={{display:'flex',gap:'.75rem',marginTop:'1rem'}}>
                <button className="btn btn-primary" onClick={handleImport}>Import</button>
                <button className="btn btn-secondary" onClick={()=>setShowImport(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
