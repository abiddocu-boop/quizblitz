export default function Leaderboard({ players, compact=false }) {
  if (!players?.length) return <div style={{ textAlign:'center',padding:'2rem',color:'var(--text-muted)',fontSize:'0.875rem' }}>No scores yet.</div>;
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
      {players.map((player, i) => {
        const rank = i + 1;
        const moved = (player.previousRank||rank) - rank;
        const cls = rank===1?'lb-rank-1':rank===2?'lb-rank-2':rank===3?'lb-rank-3':'lb-rank-n';
        return (
          <div key={player.name} className={`leaderboard-row ${rank<=3?'top-3':''}`} style={{ animationDelay:`${i*0.05}s` }}>
            <div className={`lb-rank-badge ${cls}`}>{rank}</div>
            <div className="lb-name">{player.name}</div>
            {!compact && player.streak > 1 && (
              <div style={{ fontSize:'0.7rem',fontWeight:700,background:'var(--amber-100)',color:'#92400E',padding:'2px 8px',borderRadius:'var(--radius-full)' }}>
                {player.streak}x
              </div>
            )}
            {!compact && moved !== 0 && (
              <div className={`lb-delta ${moved>0?'up':'down'}`}>{moved>0?'+':''}{moved}</div>
            )}
            <div className="lb-score">{player.score.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}
