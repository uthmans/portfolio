import { sampleWorkspace, money } from "./model";
import "./preview.css";
export default function HubPreview() {
  const projects = sampleWorkspace().projects;
  return (
    <div className="hub-feature-screen" aria-hidden="true">
      <div className="hub-feature-heading">
        <strong>Freelancer Project Hub</strong>
        <span>Fictional sample workspace</span>
      </div>
      <div className="hub-feature-grid">
        {projects.map((p) => (
          <div key={p.id}>
            <span className="hub-feature-stage">{p.stage}</span>
            <strong>{p.title}</strong>
            <span>{p.client}</span>
            <div className="hub-feature-budget">
              Budget <b>{money(p.budget)}</b>
            </div>
            {p.tasks.slice(0, 2).map((t) => (
              <p key={t.id}>
                <span>{t.done ? "✓" : "○"}</span>
                {t.title}
              </p>
            ))}
            <small>
              {p.tasks.filter((t) => t.done).length} / {p.tasks.length} tasks
              done
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
