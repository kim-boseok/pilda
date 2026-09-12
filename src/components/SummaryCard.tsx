import type { SeaSummary } from '../types';

export default function SummaryCard({ summary }: { summary: SeaSummary }) {
  return (
    <div className="card">
      <div className="summary-headline">{summary.headline}</div>
      <div className="summary-detail">{summary.detail}</div>
      {summary.tags.length > 0 && (
        <div className="tag-row">
          {summary.tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
