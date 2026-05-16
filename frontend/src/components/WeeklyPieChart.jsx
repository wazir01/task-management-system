const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const COLORS = {
  TODO: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  DONE: '#22c55e',
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 360) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function WeeklyPieChart({ byStatus, weekLabel, total }) {
  const segments = ['TODO', 'IN_PROGRESS', 'DONE']
    .map((status) => ({ status, count: byStatus[status] || 0 }))
    .filter((s) => s.count > 0);

  const cx = 80;
  const cy = 80;
  const r = 70;

  if (total === 0) {
    return (
      <div className="weekly-chart-empty">
        <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden>
          <circle cx={cx} cy={cy} r={r} fill="var(--surface-2)" stroke="var(--border)" strokeWidth="2" />
        </svg>
        <p>No tasks created this week</p>
      </div>
    );
  }

  let angle = 0;
  const slices = segments.map(({ status, count }) => {
    const sweep = (count / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { status, count, path: describeArc(cx, cy, r, start, end) };
  });

  return (
    <div className="weekly-chart">
      <svg viewBox="0 0 160 160" width="180" height="180" role="img" aria-label="Weekly tasks by status">
        {slices.map(({ status, path }) => (
          <path key={status} d={path} fill={COLORS[status]} stroke="var(--surface)" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={32} fill="var(--surface)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="700">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--muted)" fontSize="10">
          tasks
        </text>
      </svg>
      <ul className="weekly-chart-legend">
        {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
          <li key={status}>
            <span className="legend-swatch" style={{ background: COLORS[status] }} />
            <span className="legend-label">{STATUS_LABELS[status]}</span>
            <span className="legend-value">{byStatus[status] || 0}</span>
          </li>
        ))}
      </ul>
      {weekLabel && <p className="weekly-chart-caption">{weekLabel}</p>}
    </div>
  );
}
