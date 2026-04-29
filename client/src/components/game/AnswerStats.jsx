const COLORS = ['var(--opt-a)','var(--opt-b)','var(--opt-c)','var(--opt-d)'];
const LABELS = ['A','B','C','D'];
export default function AnswerStats({ stats, correctAnswerIndex, options }) {
  const total = Object.values(stats).reduce((a,b)=>a+b,0);
  return (
    <div className="answer-stat-grid">
      {[0,1,2,3].map(i=>{
        const count = stats[i]||0;
        const pct = total>0?Math.round((count/total)*100):0;
        const height = total>0?Math.max((count/total)*120,4):4;
        const isCorrect = correctAnswerIndex===i;
        return (
          <div key={i} className="answer-stat-col">
            <div style={{ fontSize:'0.75rem',fontWeight:600,color:'var(--text-secondary)' }}>{pct}%</div>
            <div className="answer-stat-bar" style={{ height:`${height}px`,background:COLORS[i],opacity:correctAnswerIndex!==undefined&&!isCorrect?0.35:1,outline:isCorrect?'2.5px solid var(--green-500)':'none',outlineOffset:2 }}/>
            <div className="answer-stat-label" style={{ color:COLORS[i] }}>{LABELS[i]}</div>
            <div className="answer-stat-count">{count}</div>
          </div>
        );
      })}
    </div>
  );
}
