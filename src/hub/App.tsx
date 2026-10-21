import { useEffect, useRef, useState, type FormEvent } from "react";
import PortfolioBanner from "../components/PortfolioBanner";
import Planner from "./Planner";
import {
  filterProjects,
  localDate,
  money,
  parseMoney,
  parseWorkspace,
  replaceProject,
  sampleWorkspace,
  stages,
  storageKey,
  summary,
  validDate,
  type Project,
  type Stage,
  type Workspace,
} from "./model";

function load() {
  try {
    const saved = localStorage.getItem(storageKey);
    return {
      workspace: saved ? parseWorkspace(saved) : sampleWorkspace(),
      message: saved
        ? "Loaded your saved workspace from this browser."
        : "Fictional sample loaded. Make a change to save it in this browser.",
    };
  } catch {
    return {
      workspace: sampleWorkspace(),
      message:
        "Saved data could not be loaded. Showing the fictional sample; existing storage has not been replaced. Export a backup of your current work before continuing.",
    };
  }
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (!element) return;
    element.showModal();
    element.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      element.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="hub-dialog"
      aria-labelledby="hub-dialog-title"
      onCancel={onClose}
    >
      <div className="hub-dialog-heading">
        <h2 id="hub-dialog-title">{title}</h2>
        <button
          type="button"
          className="hub-text-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
function ProjectEditor({
  project,
  onSave,
  onClose,
}: {
  project: Project | null;
  onSave: (p: Project) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: project?.title ?? "",
    client: project?.client ?? "",
    stage: project?.stage ?? "Planned",
    budget: project ? (project.budget / 100).toFixed(2) : "0",
    spent: project ? (project.spent / 100).toFixed(2) : "0",
    due: project?.due ?? "",
    notes: project?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.title.trim() || form.title.trim().length > 80)
      next.title = "Enter a project name, up to 80 characters.";
    if (!form.client.trim() || form.client.trim().length > 80)
      next.client = "Enter a client or organisation name, up to 80 characters.";
    const budget = parseMoney(form.budget),
      spent = parseMoney(form.spent);
    if (budget === null)
      next.budget =
        "Use a USD amount from 0 to 1,000,000 with at most two decimal places.";
    if (spent === null)
      next.spent =
        "Use a USD amount from 0 to 1,000,000 with at most two decimal places.";
    if (form.due && !validDate(form.due))
      next.due = "Choose a valid due date, or leave it blank.";
    if (form.notes.length > 1000)
      next.notes = "Keep notes to 1,000 characters.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(`project-${first}`)?.focus();
      return;
    }
    onSave({
      id: project?.id ?? crypto.randomUUID(),
      title: form.title.trim(),
      client: form.client.trim(),
      stage: form.stage as Stage,
      budget: budget!,
      spent: spent!,
      due: form.due,
      notes: form.notes.trim(),
      tasks: project?.tasks ?? [],
    });
  }
  function field(key: keyof typeof form) {
    return {
      id: `project-${key}`,
      value: form[key],
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        setForm({ ...form, [key]: e.target.value });
        setErrors({ ...errors, [key]: "" });
      },
      "aria-invalid": !!errors[key],
      "aria-describedby": errors[key] ? `error-${key}` : undefined,
    };
  }
  return (
    <Modal title={project ? "Edit project" : "New project"} onClose={onClose}>
      <p className="hub-muted">
        Names are for your own workspace. All amounts are USD; no invoices or
        payments are created.
      </p>
      <form noValidate onSubmit={submit} className="hub-editor">
        {Object.values(errors).some(Boolean) && (
          <p role="alert" className="hub-error">
            Please correct the highlighted fields.
          </p>
        )}
        <label htmlFor="project-title">
          Project name
          <input {...field("title")} maxLength={80} />
        </label>
        {errors.title && (
          <p id="error-title" className="hub-error">
            {errors.title}
          </p>
        )}
        <label htmlFor="project-client">
          Client / organisation
          <input {...field("client")} maxLength={80} />
        </label>
        {errors.client && (
          <p id="error-client" className="hub-error">
            {errors.client}
          </p>
        )}
        <div className="hub-form-row">
          <label htmlFor="project-stage">
            Project stage
            <select {...field("stage")}>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label htmlFor="project-due">
            Due date (optional)
            <input {...field("due")} type="date" />
          </label>
        </div>
        {errors.due && (
          <p id="error-due" className="hub-error">
            {errors.due}
          </p>
        )}
        <div className="hub-form-row">
          <label htmlFor="project-budget">
            Budget (USD)
            <input {...field("budget")} inputMode="decimal" />
          </label>
          <label htmlFor="project-spent">
            Spent (USD)
            <input {...field("spent")} inputMode="decimal" />
          </label>
        </div>
        {["budget", "spent"].map(
          (key) =>
            errors[key] && (
              <p key={key} id={`error-${key}`} className="hub-error">
                {errors[key]}
              </p>
            ),
        )}
        <label htmlFor="project-notes">
          Notes (optional)
          <textarea {...field("notes")} maxLength={1000} rows={3} />
        </label>
        {errors.notes && (
          <p id="error-notes" className="hub-error">
            {errors.notes}
          </p>
        )}
        <div className="hub-actions">
          <button className="hub-button" type="submit">
            Save project
          </button>
          <button className="hub-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ProjectCard({
  project,
  onChange,
  onEdit,
  onDelete,
}: {
  project: Project;
  onChange: (p: Project) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [task, setTask] = useState("");
  const [error, setError] = useState("");
  const complete = project.tasks.filter((t) => t.done).length;
  const overdue =
    project.stage !== "Complete" &&
    project.due !== "" &&
    project.due < localDate();
  const remaining = project.budget - project.spent;
  function add(event: FormEvent) {
    event.preventDefault();
    if (!task.trim()) {
      setError("Enter a task name.");
      return;
    }
    if (project.tasks.length >= 100) {
      setError("The demo supports up to 100 tasks per project.");
      return;
    }
    onChange({
      ...project,
      tasks: [
        ...project.tasks,
        { id: crypto.randomUUID(), title: task.trim(), done: false },
      ],
    });
    setTask("");
    setError("");
  }
  return (
    <article className="hub-project" aria-labelledby={`title-${project.id}`}>
      <div className="hub-card-top">
        <span className={`hub-stage stage-${stages.indexOf(project.stage)}`}>
          {project.stage}
        </span>
        <button
          className="hub-text-button"
          aria-label={`Edit ${project.title}`}
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
      <h3 id={`title-${project.id}`}>{project.title}</h3>
      <p className="hub-client">{project.client}</p>
      <p className={overdue ? "hub-overdue" : "hub-muted"}>
        {project.due
          ? `${overdue ? "Overdue · " : ""}Due ${new Date(`${project.due}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
          : "No due date"}
      </p>
      <div className="hub-stage-select">
        <label htmlFor={`stage-${project.id}`}>Stage for {project.title}</label>
        <select
          id={`stage-${project.id}`}
          value={project.stage}
          onChange={(e) =>
            onChange({ ...project, stage: e.target.value as Stage })
          }
        >
          {stages.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <dl className="hub-budget">
        <div>
          <dt>Budget</dt>
          <dd>{money(project.budget)}</dd>
        </div>
        <div>
          <dt>Spent</dt>
          <dd>{money(project.spent)}</dd>
        </div>
        <div>
          <dt>{remaining < 0 ? "Over budget" : "Remaining"}</dt>
          <dd className={remaining < 0 ? "hub-overdue" : ""}>
            {money(Math.abs(remaining))}
          </dd>
        </div>
      </dl>
      {project.notes && <p className="hub-notes">{project.notes}</p>}
      <div className="hub-task-heading">
        <h4>Tasks</h4>
        <span>
          {complete} / {project.tasks.length} done
        </span>
      </div>
      <progress
        value={complete}
        max={project.tasks.length || 1}
        aria-label={`Task progress for ${project.title}`}
      />
      <ul className="hub-tasks">
        {project.tasks.map((t) => (
          <li key={t.id}>
            <label>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() =>
                  onChange({
                    ...project,
                    tasks: project.tasks.map((item) =>
                      item.id === t.id ? { ...item, done: !item.done } : item,
                    ),
                  })
                }
              />
              <span className={t.done ? "task-done" : ""}>{t.title}</span>
            </label>
            <button
              className="hub-remove"
              aria-label={`Remove task ${t.title} from ${project.title}`}
              onClick={() =>
                onChange({
                  ...project,
                  tasks: project.tasks.filter((item) => item.id !== t.id),
                })
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {project.tasks.length === 0 && (
        <p className="hub-muted">No tasks yet. Add your first step below.</p>
      )}
      <form className="hub-task-form" onSubmit={add}>
        <label className="hub-sr-only" htmlFor={`task-${project.id}`}>
          New task for {project.title}
        </label>
        <input
          id={`task-${project.id}`}
          value={task}
          maxLength={120}
          placeholder="Add a next step…"
          onChange={(e) => {
            setTask(e.target.value);
            setError("");
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `task-error-${project.id}` : undefined}
        />
        <button
          className="hub-secondary"
          type="submit"
          aria-label={`Add task to ${project.title}`}
        >
          Add
        </button>
      </form>
      {error && (
        <p className="hub-error" role="alert" id={`task-error-${project.id}`}>
          {error}
        </p>
      )}
      <button
        className="hub-text-button hub-delete"
        onClick={onDelete}
        aria-label={`Delete project ${project.title}`}
      >
        Delete project
      </button>
    </article>
  );
}
export default function HubApp() {
  const [initial] = useState(load);
  const [workspace, setWorkspace] = useState<Workspace>(initial.workspace);
  const [notice, setNotice] = useState(initial.message);
  const [warning, setWarning] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<Stage | "All">("All");
  const [overdue, setOverdue] = useState(false);
  const [editor, setEditor] = useState<{ project: Project | null } | null>(
    null,
  );
  const [confirm, setConfirm] = useState<
    | { kind: "delete"; project: Project }
    | { kind: "reset" }
    | { kind: "import"; workspace: Workspace }
    | null
  >(null);
  function commit(next: Workspace, message: string) {
    setWorkspace(next);
    setWarning("");
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice(`${message} Saved in this browser.`);
    } catch {
      setNotice(message);
      setWarning(
        "This change could not be saved in this browser. Download a backup before closing or reloading the page.",
      );
    }
  }
  function clearFilters() {
    setSearch("");
    setStage("All");
    setOverdue(false);
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(workspace, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `freelancer-hub-backup-${localDate()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "Backup download requested. Keep this JSON file to restore your workspace.",
    );
  }
  async function restore(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error(
          "Choose a Hub JSON backup smaller than 5 MB. The current workspace has not changed.",
        );
      setConfirm({
        kind: "import",
        workspace: parseWorkspace(await file.text()),
      });
      setWarning("");
    } catch (error) {
      setWarning(
        error instanceof Error
          ? error.message
          : "This file could not be read. The current workspace has not changed.",
      );
    }
  }
  const visible = filterProjects(workspace.projects, search, stage, overdue);
  const totals = summary(visible);
  return (
    <div className="hub-site">
      <a className="hub-skip" href="#hub-main">
        Skip to workspace
      </a>
      <PortfolioBanner
        title="Freelancer Project Hub"
        context="Independent demo"
      />
      <main id="hub-main" className="hub-main">
        <header className="hub-intro">
          <div>
            <span className="hub-eyebrow">A LITTLE MORE ORGANIZED</span>
            <h1>
              Freelancer Project <em>Hub.</em>
            </h1>
            <p>Keep projects, next steps, and budgets in one clear view.</p>
          </div>
          <button
            className="hub-button"
            onClick={() => setEditor({ project: null })}
            disabled={workspace.projects.length >= 50}
          >
            New project <span aria-hidden="true">+</span>
          </button>
        </header>
        <aside className="hub-demo-note">
          <strong>Your browser. Your workspace.</strong>
          <p>
            Start with three fictional projects, then try your own. Data stays
            in this browser’s storage and isn’t synced between devices.
            The optional AI planner sends only the brief you choose to share.
            Download a backup to keep a copy. Reloading keeps saved changes;
            clearing browser data removes them. Restore a downloaded backup
            to move your workspace to another browser. USD amounts are
            tracking figures, not invoices.
          </p>
          <p>
            Project stage and task completion are separate; completing tasks
            doesn’t automatically close a project.
          </p>
        </aside>
        <Planner full={workspace.projects.length >= 50} onAdd={project => {
          commit(replaceProject(workspace, project), "Reviewed AI draft added as a planned project.");
          clearFilters();
        }} />
        <div className="hub-toolbar">
          <button className="hub-secondary" onClick={download}>
            Download backup
          </button>
          <label className="hub-secondary hub-file-label" htmlFor="hub-import">
            Restore a backup
            <input
              id="hub-import"
              className="hub-file-input"
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                void restore(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <button
            className="hub-text-button"
            onClick={() => setConfirm({ kind: "reset" })}
          >
            Reset to fictional sample
          </button>
        </div>
        <p className="hub-notice" role="status">
          {notice}
        </p>
        {warning && (
          <p className="hub-error hub-warning" role="alert">
            {warning}
          </p>
        )}
        <section className="hub-filters" aria-label="Filter projects">
          <label htmlFor="hub-search">
            Search projects or clients
            <input
              id="hub-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a project…"
            />
          </label>
          <div className="hub-filter-stage">
            <label htmlFor="hub-stage-filter">Project stage</label>
            <select
              id="hub-stage-filter"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage | "All")}
            >
              <option value="All">All stages</option>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <label className="hub-check">
            <input
              type="checkbox"
              checked={overdue}
              onChange={(e) => setOverdue(e.target.checked)}
            />
            Overdue only
          </label>
          {(search || stage !== "All" || overdue) && (
            <button className="hub-text-button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </section>
        <div className="hub-view-label">
          <h2>Project overview</h2>
          <p role="status">
            Showing {visible.length} of {workspace.projects.length} projects ·
            Totals reflect this view
          </p>
        </div>
        <dl className="hub-summary">
          <div>
            <dt>Active projects</dt>
            <dd>{totals.active}</dd>
            <dd className="hub-summary-note">{totals.overdue} overdue</dd>
          </div>
          <div>
            <dt>Combined budget</dt>
            <dd>{money(totals.budget)}</dd>
            <dd className="hub-summary-note">Illustrative USD tracking</dd>
          </div>
          <div>
            <dt>Total spent</dt>
            <dd>{money(totals.spent)}</dd>
            <dd className="hub-summary-note">Entered manually</dd>
          </div>
          <div>
            <dt>Tasks completed</dt>
            <dd>
              {totals.done}
              <span> / {totals.tasks}</span>
            </dd>
            <dd className="hub-summary-note">Across visible projects</dd>
          </div>
        </dl>
        <div className="hub-projects">
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onChange={(next) =>
                commit(replaceProject(workspace, next), "Project updated.")
              }
              onEdit={() => setEditor({ project })}
              onDelete={() => setConfirm({ kind: "delete", project })}
            />
          ))}
        </div>
        {visible.length === 0 && (
          <div className="hub-empty">
            <h3>
              {workspace.projects.length
                ? "No projects match these filters."
                : "A clear space for your next project."}
            </h3>
            <p>
              {workspace.projects.length
                ? "Try another search or clear the filters."
                : "Create a project to start tracking its next steps."}
            </p>
            <button
              className="hub-secondary"
              onClick={
                workspace.projects.length
                  ? clearFilters
                  : () => setEditor({ project: null })
              }
            >
              {workspace.projects.length
                ? "Clear filters"
                : "Create your first project"}
            </button>
          </div>
        )}
        <footer className="hub-footer">
          Independent portfolio project · Fictional starting data · Built with
          AI coding assistance
        </footer>
      </main>
      {editor && (
        <ProjectEditor
          project={editor.project}
          onClose={() => setEditor(null)}
          onSave={(project) => {
            commit(
              replaceProject(workspace, project),
              editor.project ? "Project updated." : "Project created.",
            );
            setEditor(null);
            clearFilters();
          }}
        />
      )}
      {confirm && (
        <Modal
          title={
            confirm.kind === "delete"
              ? "Delete this project?"
              : confirm.kind === "reset"
                ? "Restore the fictional sample?"
                : "Replace workspace with this backup?"
          }
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm.kind === "delete"
              ? `“${confirm.project.title}” and all of its tasks will be removed.`
              : confirm.kind === "reset"
                ? "This replaces all current projects with the three fictional examples."
                : `This replaces all current projects with ${confirm.workspace.projects.length} projects from your backup.`}{" "}
            Download a backup first if you want to keep the current workspace.
          </p>
          <div className="hub-actions">
            <button
              className="hub-button"
              onClick={() => {
                if (confirm.kind === "delete")
                  commit(
                    {
                      ...workspace,
                      projects: workspace.projects.filter(
                        (p) => p.id !== confirm.project.id,
                      ),
                    },
                    "Project deleted.",
                  );
                else {
                  commit(
                    confirm.kind === "reset"
                      ? sampleWorkspace()
                      : confirm.workspace,
                    confirm.kind === "reset"
                      ? "Fictional sample restored."
                      : "Backup restored.",
                  );
                  clearFilters();
                }
                setConfirm(null);
              }}
            >
              {confirm.kind === "delete"
                ? "Delete project"
                : confirm.kind === "reset"
                  ? "Restore sample"
                  : "Replace workspace"}
            </button>
            <button className="hub-secondary" onClick={() => setConfirm(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
