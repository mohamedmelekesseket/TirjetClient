interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  color?: string;
  delay?: number;
}

export function StatCard({ icon, label, value, delta, positive = true, color = '#0234AB', delay = 0 }: StatCardProps) {
  return (
    <div className="stat-card anim-fade-up" style={{ animationDelay: `${delay}s` }}>
      <div className="stat-card-top">
        <div
          className="stat-card-icon"
          style={{
            background: `linear-gradient(135deg, ${color}22, ${color}11)`,
            border: `1px solid ${color}22`,
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>{icon}</span>
        </div>
        {delta && (
          <span className={`stat-card-delta ${positive ? 'pos' : 'neg'}`}>
            {positive ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      <div
        className="stat-card-bar"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />
    </div>
  );
}
