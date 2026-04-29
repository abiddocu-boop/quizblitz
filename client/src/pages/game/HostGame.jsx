import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socket from '../../socket';
import Timer from '../../components/game/Timer';
import Leaderboard from '../../components/game/Leaderboard';
import AnswerStats from '../../components/game/AnswerStats';
import { IconPlay, IconUsers, IconArrow } from '../../components/ui/Icons';

const OPT_COLORS = ['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
const OPT_LABELS = ['A','B','C','D'];

const LogoMark = () => (
  <div className="logo-mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="3" rx="1.5" fill="white"/>
    <rect x="3" y="10.5" width="13" height="3" rx="1.5" fill="white" opacity=".7"/>
    <rect x="3" y="18" width="15" height="3" rx="1.5" fill="white" opacity=".5"/>
  </svg></div>
);

export default function HostGame() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('lobby');
  const [pin, setPin] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answerStats, setAnswerStats] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLastQ, setIsLastQ] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.connect();
    const token = localStorage.getItem('qb_token');
    socket.emit('host:create', { quizId, token });

    socket.on('game:created', ({ pin: p, quizTitle: t }) => { setPin(p); setQuizTitle(t); });
    socket.on('error', ({ message }) => setError(message));
    socket.on('lobby:update', ({ players: pl }) => setPlayers(pl));
    socket.on('question:start', ({ question: q, isHost }) => {
      if (!isHost) return;
      setQuestion(q); setAnsweredCount(0); setAnswerStats({}); setPhase('question'); setTimerKey(k=>k+1);
    });
    socket.on('host:answer-update', ({ answeredCount: ac, answerStats: as }) => { setAnsweredCount(ac); setAnswerStats(as); });
    socket.on('question:end', ({ correctOptionIndex, leaderboard: lb, answerStats: as, isLastQuestion }) => {
      setQuestion(q => ({ ...q, _correctIndex: correctOptionIndex }));
      setLeaderboard(lb); setAnswerStats(as); setIsLastQ(isLastQuestion); setPhase('results');
    });
    socket.on('game:ended', ({ leaderboard: lb }) => { setLeaderboard(lb); setPhase('ended'); });

    return () => {
      ['game:created','error','lobby:update','question:start','host:answer-update','question:end','game:ended'].forEach(e => socket.off(e));
      socket.disconnect();
    };
  }, [quizId]);

  const nextQuestion = useCallback(() => socket.emit('host:next'), []);
  const endEarly     = useCallback(() => socket.emit('host:end-question'), []);

  if (error) return (
    <div className="page-center"><div className="card" style={{maxWidth:400,textAlign:'center'}}>
      <div className="card-body">
        <h2 className="t-heading" style={{marginBottom:'.5rem'}}>Something went wrong</h2>
        <p className="t-small text-muted" style={{marginBottom:'1.25rem'}}>{error}</p>
        <button className="btn btn-primary" onClick={()=>navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div></div>
  );

  /* ── LOBBY ── */
  if (phase === 'lobby') return (
    <div className="game-layout">
      <div className="game-topbar">
        <div style={{display:'flex',alignItems:'center',gap:'.875rem'}}><LogoMark/><span style={{fontWeight:700}}>{quizTitle||'Loading...'}</span><span className="badge badge-primary">Host View</span></div>
        <button className="btn btn-ghost btn-sm" onClick={()=>{socket.disconnect();navigate('/dashboard');}}>Exit</button>
      </div>
      <div className="game-body" style={{justifyContent:'center',paddingTop:'2rem'}}>
        {!pin ? (
          <div style={{textAlign:'center'}}><div className="spinner" style={{width:36,height:36,margin:'0 auto 1rem'}}/><p className="t-small text-muted">Setting up game...</p></div>
        ) : (
          <div style={{maxWidth:560,width:'100%',margin:'0 auto'}}>
            <div className="anim-scale-in text-center" style={{marginBottom:'2rem'}}>
              <p className="t-small text-muted" style={{marginBottom:'.5rem'}}>Students open the app URL and enter:</p>
              <div className="pin-box"><div className="pin-number">{pin}</div><div className="pin-label">Game PIN</div></div>
            </div>
            <div className="card anim-fade-up delay-1" style={{marginBottom:'1rem'}}>
              <div className="card-body">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                    <IconUsers size={16} style={{color:'var(--text-3)'}}/><span className="t-small" style={{fontWeight:600}}>{players.length} joined</span>
                  </div>
                  {!players.length&&<span className="t-xs text-muted">Waiting for students...</span>}
                </div>
                <div className="player-chips">{players.map(p=><div key={p.name} className="player-chip">{p.name}</div>)}</div>
              </div>
            </div>
            <button className="btn btn-primary btn-xl btn-full anim-fade-up delay-2" onClick={nextQuestion} disabled={!players.length}>
              <IconPlay size={18}/>{players.length?`Start Quiz (${players.length} ready)`:'Waiting for players...'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ── QUESTION ── */
  if (phase === 'question' && question) {
    const total = players.length;
    const pct = total > 0 ? Math.round((answeredCount/total)*100) : 0;
    return (
      <div className="game-layout">
        <div className="game-topbar">
          <div style={{display:'flex',alignItems:'center',gap:'.875rem'}}>
            <span className="badge badge-primary">Q{question.index+1}/{question.total}</span>
            <span className="t-small text-muted" style={{textTransform:'capitalize'}}>{question.type.replace('_',' ')}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <span className="t-small" style={{fontWeight:600,color:'var(--text-2)'}}>{answeredCount}/{total} answered</span>
            <button className="btn btn-secondary btn-sm" onClick={endEarly}>End Early</button>
          </div>
        </div>
        <div className="game-body">
          <div className="progress-bar" style={{marginBottom:'1.25rem'}}><div className="progress-fill" style={{width:`${pct}%`}}/></div>
          <div style={{display:'flex',gap:'1.5rem',alignItems:'flex-start',flexWrap:'wrap'}}>
            <div style={{flex:'1 1 380px'}}>
              <div className="card anim-scale-in" style={{marginBottom:'1rem'}}>
                <div className="card-body">
                  {question.imageUrl&&<img src={question.imageUrl} alt="Question" style={{width:'100%',maxHeight:200,objectFit:'cover',borderRadius:'var(--radius-md)',marginBottom:'1rem'}}/>}
                  <h2 style={{fontSize:'clamp(1rem,3vw,1.375rem)',fontWeight:700,lineHeight:1.3}}>{question.text}</h2>
                </div>
              </div>
              {(question.type==='multiple_choice'||question.type==='true_false'||question.type==='poll')&&(
                <div className="answer-grid">
                  {question.options.map((opt,i)=>(
                    <div key={i} className={'answer-btn opt-'+['a','b','c','d'][i]} style={{cursor:'default'}}>
                      <div className="answer-key" style={{background:OPT_COLORS[i],color:'white'}}>{OPT_LABELS[i]}</div>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{flexShrink:0,display:'flex',flexDirection:'column',gap:'1rem',minWidth:200}}>
              <div className="card"><div className="card-body text-center" style={{padding:'1.25rem'}}>
                <Timer key={timerKey} duration={question.timeLimit} active onExpire={()=>{}}/>
                <p className="t-xs text-muted" style={{marginTop:'.5rem'}}>seconds left</p>
              </div></div>
              <div className="card"><div className="card-body" style={{padding:'1.25rem'}}>
                <p className="t-small text-muted" style={{marginBottom:'.625rem'}}>Live responses</p>
                <AnswerStats stats={answerStats} total={answeredCount} options={question.options}/>
              </div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULTS ── */
  if (phase === 'results') return (
    <div className="game-layout">
      <div className="game-topbar">
        <div style={{display:'flex',alignItems:'center',gap:'.75rem'}}>
          <span className="badge badge-success">Answer Reveal</span>
          {question&&<span className="t-small text-muted">Q{question.index+1} of {question.total}</span>}
        </div>
        <button className="btn btn-primary" onClick={nextQuestion}>
          {isLastQ?'Show Final Results':'Next Question'}<IconArrow size={14}/>
        </button>
      </div>
      <div className="game-body" style={{flexDirection:'row',gap:'1.5rem',flexWrap:'wrap'}}>
        <div style={{flex:'1 1 360px'}}>
          {question&&<div className="card anim-scale-in" style={{marginBottom:'1rem'}}>
            <div className="card-body">
              <h3 className="t-title" style={{marginBottom:'1rem'}}>Answer Distribution</h3>
              <AnswerStats stats={answerStats} total={players.length} correctIndex={question._correctIndex} options={question.options}/>
              {question.explanation&&<div style={{marginTop:'1rem',padding:'.875rem',background:'var(--primary-light)',borderRadius:'var(--radius-md)',borderLeft:'3px solid var(--primary)'}}>
                <p className="t-xs" style={{color:'var(--primary)',fontWeight:700,marginBottom:'.25rem'}}>Explanation</p>
                <p className="t-small" style={{color:'var(--text-2)'}}>{question.explanation}</p>
              </div>}
            </div>
          </div>}
        </div>
        <div style={{flex:'1 1 280px'}}>
          <div className="card anim-fade-up delay-1"><div className="card-body">
            <h3 className="t-title" style={{marginBottom:'1rem'}}>Leaderboard</h3>
            <Leaderboard players={leaderboard} showDelta/>
          </div></div>
        </div>
      </div>
    </div>
  );

  /* ── ENDED ── */
  if (phase === 'ended') return (
    <div className="page-center" style={{background:'var(--bg)'}}>
      <div style={{width:'100%',maxWidth:560}}>
        <div className="text-center anim-scale-in" style={{marginBottom:'1.5rem'}}>
          <div style={{width:64,height:64,background:'var(--success-light)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{fontSize:'1.875rem',fontWeight:800,letterSpacing:'-.025em',marginBottom:'.375rem'}}>Quiz Complete</h1>
          <p className="t-small text-muted">{leaderboard.length} students participated</p>
        </div>
        <div className="card anim-fade-up delay-1" style={{marginBottom:'1rem'}}>
          <div className="card-body"><h3 className="t-title" style={{marginBottom:'1rem'}}>Final Leaderboard</h3><Leaderboard players={leaderboard}/></div>
        </div>
        <div style={{display:'flex',gap:'.75rem',justifyContent:'center'}} className="anim-fade-up delay-2">
          <button className="btn btn-primary" onClick={()=>navigate(`/host/${quizId}`)}>Run Again</button>
          <button className="btn btn-secondary" onClick={()=>navigate('/dashboard')}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  return null;
}
