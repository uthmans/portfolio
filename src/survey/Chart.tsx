import "./chart.css";
import type { summarize } from "./data";

export default function Chart({
  summary,
}: {
  summary: ReturnType<typeof summarize>;
}) {
  return (
    <div className="rating-chart" aria-label="Rating distribution">
      {summary.counts.map((bin) => (
        <div className="rating-row" key={bin.score}>
          <span>Rating {bin.score}</span>
          <div className="rating-track" aria-hidden="true">
            <div style={{ width: `${bin.percentage}%` }} />
          </div>
          <span>
            {bin.count} <small>({bin.percentage.toFixed(0)}%)</small>
          </span>
        </div>
      ))}
    </div>
  );
}
