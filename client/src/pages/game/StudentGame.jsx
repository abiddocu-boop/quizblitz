import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../../socket';
import Timer from '../../components/game/Timer';
import Leaderboard from '../../components/game/Leaderboard';
import { IconCheck, IconX, IconArrow } from '../../components/ui/Icons';

const OPT_LABELS = ['A','B','C','D'];
const OPT_CLS = ['opt-a','opt-b','opt-c','opt-d'];

export default function StudentGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('join');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [shortAns, setShortAns] = useState('');
  const [ansResult, setAnsResult] = useState(null);
  const [correctIdx, setCorrectIdx] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [isLastQ, setIsLastQ] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [timerKey, setTimerKey] = useState(0);
  const [nameRef, setNameRef] = useState('');

  useEffect(() => {
    socket.connect();
    socket.on('join:success', ({ pin: p, quizTitle: t, playerName: n }) => { setPin(p); setQuizTitle(t); setNameRef(n); setJoining(false); setPhase('lobby'); });
    socket.on('join:error', ({ message }) => { setJoinError(message); setJoining(false); });
    socket.on('lobby:update', ({ players: pl }) => setPlayers(pl));
    socket.on('question:start', ({ question: q }) => { setQuestion(q); setSelected(null); setShortAns(''); setAnsResult(null); setCorrectIdx(null); setExplanation(''); setTimerKey(k=>k+1); setPhase('question'); });
    socket.on('answer:result', ({ correct, pointsEarned, correctOptionIndex }) => { setAnsResult({ correct, pointsEarned }); setCorrectIdx(correctOptionIndex); setPhase('answered'); });
    socket.on('question:end', ({ correctOptionIndex, leaderboard: lb, isLastQuestion, explanation: exp }) => {
      setCorrectIdx(correctOptionIndex); setLeaderboard(lb); setIsLastQ(isLastQuestion); setExplanation(exp||'');
      const me = lb.find(p => p.name === nameRef);
      const rank = lb.findIndex(p => p.name === nameRef) + 1;
      if (me) setMyScore(me.score);
      if (rank > 0) setMyRank(rank);
      setPhase('results');
    });
    socket.on('game:ended', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      const me = lb.find(p => p.name === nameRef);
      const rank = lb.findIndex(p => p.name === nameRef) + 1;
      if (me) setMyScore(me.score);
      if (rank > 0) setMyRank(rank);
      setPhase('ended');
    });
    socket.on('host:disconnected', () => { alert('Host disconnected. Game over.'); navigate('/join'); });
    return () => {
      ['join:success','join:error','lobby:update','question:start','answer:result','question:end','game:ended','host:disconnected'].forEach(e=>socket.off(e));
      socket.disconnect();
    };
  }, [nameRef, navigate]);

  const handleJoin = useCallback(e => {
    e.preventDefault();
    const cp = pin.trim().replace(/\D/g,'');
    const cn = name.trim();
    if (cp.length !== 6) return setJoinError('PIN must be 6 digits.');
    if (cn.length < 2) return setJoinError('Name must be at least 2 characters.');
    setJoinError(''); setJoining(true);
    setNameRef(cn);
    socket.emit('player:join', { pin: cp, name: cn });
  }, [pin, name]);

  const submitAnswer = useCallback(index => {
    if (selected !== null || phase !== 'question') return;
    setSelected(index);
    socket.emit('player:answer', { answer: index });
  }, [selected, phase]);

  const submitShort = useCallback(text => {
    if (!text.trim() || selected !== null) return;
    setSelected(text);
    socket.emit('player:answer', { answer: text.trim() });
  }, [selected]);

  const BG = (
    <div style={{ position:'fixed',inset:0,zIndex:0,backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',backgroundSize:'40px 40px',opacity:.5,pointerEvents:'none' }} />
  );

  const LogoHeader = () => (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'.625rem',marginBottom:'1.75rem' }}>
      <div className="logo-mark" style={{width:40,height:40,borderRadius:10}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="3" rx="1.5" fill="white"/><rect x="3" y="10.5" width="13" height="3" rx="1.5" fill="white" opacity=".7"/><rect x="3" y="18" width="15" height="3" rx="1.5" fill="white" opacity=".5"/></svg></div>
      <span className="logo-text" style={{fontSize:'1.25rem'}}>QuizBlitz</span>
    </div>
  );

  /* JOIN */
  if (phase === 'join') return (
    <div className="page-center">
      {BG}
      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:400}}>
        <div className="text-center mb-3 anim-fade-up"><LogoHeader/>
          <h1 style={{fontSize:'1.625rem',fontWeight:800,letterSpacing:'-.025em',marginBottom:'.35rem'}}>Join a Quiz</h1>
          <p className="t-small text-muted">Enter the PIN shown by your teacher</p>
        </div>
        <div className="card anim-fade-up delay-1"><div className="card-body">
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label" htmlFor="pin">Game PIN</label>
              <input id="pin" className={'input input-lg'+(joinError?' error':'')} type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={pin} autoFocus autoComplete="off" style={{letterSpacing:'.2em',textAlign:'center',fontWeight:800,fontSize:'1.5rem'}} onChange={e=>{setPin(e.target.value.replace(/\D/g,''));setJoinError('');}}/>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="uname">Your Name</label>
              <input id="uname" className={'input input-lg'+(joinError?' error':'')} type="text" maxLength={24} placeholder="Enter your name" value={name} autoComplete="given-name" onChange={e=>{setName(e.target.value);setJoinError('');}}/>
            </div>
            {joinError&&<div style={{background:'var(--danger-light)',border:'1px solid #FECACA',borderRadius:'var(--radius-md)',padding:'.75rem 1rem',color:'var(--danger)',fontSize:'.875rem',marginBottom:'1rem'}}>{joinError}</div>}
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={joining||pin.length!==6||!name.trim()}>
              {joining?<><div className="spinner" style={{width:16,height:16,borderWidth:2,borderTopColor:'white',borderColor:'rgba(255,255,255,.3)'}}/>Joining...</>:<>Join<IconArrow size={16}/></>}
            </button>
          </form>
        </div></div>
      </div>
    </div>
  );

  /* LOBBY */
  if (phase === 'lobby') return (
    <div className="page-center" style={{background:'var(--bg)'}}>
      <div style={{width:'100%',maxWidth:440,textAlign:'center'}}>
        <div className="anim-scale-in" style={{marginBottom:'1.5rem'}}>
          <div className="pin-box" style={{marginBottom:'1rem'}}><div className="pin-number">{pin}</div><div className="pin-label">Game PIN</div></div>
          <h2 style={{fontSize:'1.375rem',fontWeight:700,marginBottom:'.25rem'}}>You're in, <span style={{color:'var(--primary)'}}>{name}</span></h2>
          <p className="t-small text-muted">{quizTitle}</p>
        </div>
        <div className="card anim-fade-up delay-1"><div className="card-body">
          <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'1rem'}}>
            <div className="spinner"/><span className="t-small text-muted">Waiting for your teacher to start...</span>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.75rem'}}>
            <span className="t-small" style={{fontWeight:600}}>Players joined</span>
            <span className="badge badge-primary">{players.length}</span>
          </div>
          <div className="player-chips">
            {players.map(p=><div key={p.name} className="player-chip" style={p.name===name?{background:'var(--primary-light)',color:'var(--primary)',borderColor:'var(--primary-mid)'}:{}}>{p.name}</div>)}
          </div>
        </div></div>
      </div>
    </div>
  );

  /* QUESTION */
  if (phase === 'question' && question) return (
    <div className="game-layout">
      <div className="game-topbar">
        <div style={{display:'flex',alignItems:'center',gap:'.75rem'}}>
          <span className="badge badge-neutral">Q{question.index+1}/{question.total}</span>
          <span className="t-xs text-muted">{question.points} pts</span>
        </div>
        <Timer key={timerKey} duration={question.timeLimit} active onExpire={()=>setPhase('answered')}/>
        <span className="t-xs text-muted">{name}</span>
      </div>
      <div className="game-body">
        <div className="card anim-scale-in" style={{marginBottom:'1.25rem'}}>
          <div className="card-body">
            {question.imageUrl&&<img src={question.imageUrl} alt="Question" style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:'var(--radius-md)',marginBottom:'1rem'}}/>}
            <h2 style={{fontSize:'clamp(1rem,4vw,1.5rem)',fontWeight:700,lineHeight:1.35}}>{question.text}</h2>
          </div>
        </div>
        {(question.type==='multiple_choice'||question.type==='true_false'||question.type==='poll')&&(
          <div className="answer-grid anim-fade-up delay-1">
            {question.options.map((opt,i)=>(
              <button key={i} className={'answer-btn '+OPT_CLS[i]+(selected===i?' selected':'')} onClick={()=>submitAnswer(i)} disabled={selected!==null}>
                <div className="answer-key">{OPT_LABELS[i]}</div><span>{opt.text}</span>
              </button>
            ))}
          </div>
        )}
        {question.type==='short_answer'&&(
          <div className="card anim-fade-up delay-1"><div className="card-body">
            <label className="form-label">Your Answer</label>
            <div style={{display:'flex',gap:'.75rem'}}>
              <input className="input input-lg" placeholder="Type your answer..." value={shortAns} onChange={e=>setShortAns(e.target.value)} disabled={selected!==null} autoFocus onKeyDown={e=>e.key==='Enter'&&submitShort(shortAns)}/>
              <button className="btn btn-primary" onClick={()=>submitShort(shortAns)} disabled={!shortAns.trim()||selected!==null}>Submit</button>
            </div>
          </div></div>
        )}
      </div>
    </div>
  );

  /* ANSWERED — waiting */
  if (phase === 'answered') {
    const correct = ansResult?.correct;
    return (
      <div className="page-center" style={{background:'var(--bg)'}}>
        <div className="card anim-scale-in" style={{maxWidth:380,width:'100%',textAlign:'center'}}>
          <div className="card-body" style={{padding:'2.5rem 2rem'}}>
            <div style={{width:72,height:72,background:correct?'var(--success-light)':'var(--danger-light)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.25rem'}}>
              {correct?<IconCheck size={32} style={{color:'var(--success-dark)'}}/>:<IconX size={32} style={{color:'var(--danger)'}}/>}
            </div>
            <h2 style={{fontWeight:800,fontSize:'1.5rem',marginBottom:'.375rem'}}>
              {selected===null?'Time ran out':correct?'Correct!':'Not quite'}
            </h2>
            {correct&&ansResult?.pointsEarned>0&&<div className="badge badge-success" style={{fontSize:'1rem',padding:'.4rem 1.25rem',margin:'.5rem auto'}}>+{ansResult.pointsEarned.toLocaleString()} pts</div>}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem',marginTop:'1.5rem',color:'var(--text-3)'}}>
              <div className="spinner" style={{width:14,height:14}}/><span className="t-small">Waiting for results...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* RESULTS */
  if (phase === 'results') {
    const correct = ansResult?.correct;
    const optLabel = correctIdx!==null&&question?.options?.[correctIdx]?`${OPT_LABELS[correctIdx]}: ${question.options[correctIdx].text}`:null;
    return (
      <div className="page-center" style={{background:'var(--bg)',padding:'1.5rem'}}>
        <div style={{width:'100%',maxWidth:480,display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div className="card anim-scale-in"><div className="card-body" style={{textAlign:'center'}}>
            <h3 style={{fontWeight:700,marginBottom:'.75rem'}}>{selected===null?'Time ran out':correct?'Correct answer!':'Not quite...'}</h3>
            {optLabel&&<div style={{display:'inline-flex',alignItems:'center',gap:'.5rem',background:'var(--success-light)',border:'1.5px solid #86EFAC',borderRadius:'var(--radius-md)',padding:'.6rem 1rem',marginBottom:'1rem'}}>
              <IconCheck size={15} style={{color:'var(--success-dark)',flexShrink:0}}/><span style={{fontWeight:600,color:'var(--success-dark)',fontSize:'.9375rem'}}>{optLabel}</span>
            </div>}
            {explanation&&<div style={{background:'var(--primary-light)',borderLeft:'3px solid var(--primary)',borderRadius:'var(--radius-md)',padding:'.75rem',textAlign:'left',marginBottom:'.75rem'}}>
              <p className="t-xs" style={{color:'var(--primary)',fontWeight:700,marginBottom:'.2rem'}}>Explanation</p>
              <p className="t-small" style={{color:'var(--text-2)'}}>{explanation}</p>
            </div>}
            <div style={{display:'flex',justifyContent:'center',gap:'2rem'}}>
              <div><div className="t-xs text-muted">Score</div><div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--primary)'}}>{myScore.toLocaleString()}</div></div>
              {myRank&&<div><div className="t-xs text-muted">Rank</div><div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--text-2)'}}>#{myRank}</div></div>}
            </div>
          </div></div>
          <div className="card anim-fade-up delay-1"><div className="card-body">
            <h4 className="t-title" style={{marginBottom:'.875rem'}}>Leaderboard</h4>
            <Leaderboard players={leaderboard.slice(0,8)} showDelta highlightName={nameRef}/>
          </div></div>
          {isLastQ&&<p className="t-xs text-muted text-center">Last question — final results coming!</p>}
        </div>
      </div>
    );
  }

  /* ENDED */
  if (phase === 'ended') return (
    <div className="page-center" style={{background:'var(--bg)',padding:'1.5rem'}}>
      <div style={{width:'100%',maxWidth:480}}>
        <div className="text-center anim-scale-in" style={{marginBottom:'1.5rem'}}>
          {myRank===1&&<div style={{width:80,height:80,background:'#FEF3C7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',fontSize:'2.5rem',fontWeight:800,color:'#92400E'}}>1</div>}
          <h1 style={{fontWeight:800,fontSize:'1.875rem',letterSpacing:'-.025em',marginBottom:'.375rem'}}>{myRank===1?'You won!':'Quiz Complete'}</h1>
          <p className="t-small text-muted">Final score: <strong style={{color:'var(--primary)'}}>{myScore.toLocaleString()}</strong>{myRank&&<> · Rank <strong>#{myRank}</strong></>}</p>
        </div>
        <div className="card anim-fade-up delay-1" style={{marginBottom:'1rem'}}><div className="card-body">
          <h4 className="t-title" style={{marginBottom:'.875rem'}}>Final Leaderboard</h4>
          <Leaderboard players={leaderboard} highlightName={nameRef}/>
        </div></div>
        <button className="btn btn-primary btn-full btn-lg anim-fade-up delay-2" onClick={()=>navigate('/join')}>Play Again</button>
      </div>
    </div>
  );

  return null;
}
