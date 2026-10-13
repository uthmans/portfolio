import { useState } from "react";
import Chart from "./Chart";
import {
  filterResponses,
  questions,
  sample,
  summarize,
  toCsv,
  type Question,
} from "./data";

export default function SurveyApp() {
  const [question, setQuestion] = useState<Question>("satisfaction");
  const [track, setTrack] = useState("All");
  const [format, setFormat] = useState("All");
  const [notice, setNotice] = useState("");
  const rows = filterResponses(sample, track, format);
  const summary = summarize(rows, question);
  const filtered = track !== "All" || format !== "All";

  function download() {
    const url = URL.createObjectURL(
      new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fictional-survey-responses.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`CSV download requested for ${rows.length} fictional responses.`);
  }

  return (
    <>
      <a className="skip-link" href="#survey-main">
        Skip to results
      </a>
      <header className="studio-header">
        <a href="../">← Uthman’s portfolio</a>
        <span>INDEPENDENT DEMO / FIRST VERSION</span>
      </header>
      <main id="survey-main" className="studio-main">
        <div className="studio-title">
          <div>
            <span className="eyebrow">A LITTLE CLARITY IN THE DATA</span>
            <h1>
              Survey Insights <em>Studio.</em>
            </h1>
            <p>Explore feedback. See the counts. Understand the calculation.</p>
          </div>
          <span className="sample-badge">
            Fictional sample · {sample.length} responses
          </span>
        </div>
        <aside className="dataset-note">
          <strong>Meet the sample</strong>
          <p>
            Feedback from an imaginary community learning series on websites,
            automations, and data. Every response is made up. This first version
            uses only the built-in sample; CSV import is the next milestone.
            There is no AI integration or server storage.
          </p>
        </aside>

        <section className="studio-controls" aria-labelledby="controls-title">
          <div className="controls-heading">
            <h2 id="controls-title">Explore the responses</h2>
            {filtered && (
              <button
                className="reset-filters"
                onClick={() => {
                  setTrack("All");
                  setFormat("All");
                  setNotice("Filters cleared.");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="select-grid">
            <label>
              Question
              <select
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value as Question)
                }
              >
                {Object.entries(questions).map(([key, value]) => (
                  <option value={key} key={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Learning track
              <select
                value={track}
                onChange={(event) => setTrack(event.target.value)}
              >
                <option value="All">All tracks</option>
                {["Websites", "Automations", "Data"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Session format
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
              >
                <option value="All">All formats</option>
                <option>Online</option>
                <option>In person</option>
              </select>
            </label>
          </div>
        </section>

        <p className="results-status" role="status">
          Showing {rows.length} of {sample.length} responses ·{" "}
          {summary.answered} answered this question · {summary.missing} missing
        </p>
        <div className="summary-grid">
          <div>
            <span>Filtered responses</span>
            <strong>{summary.total}</strong>
            <small>Of {sample.length} in the dataset</small>
          </div>
          <div>
            <span>Answered this question</span>
            <strong>{summary.answered}</strong>
            <small>{summary.missing} missing, excluded from calculations</small>
          </div>
          <div>
            <span>Mean rating</span>
            <strong>
              {summary.mean === null ? "—" : summary.mean.toFixed(2)}
              <small> / 5</small>
            </strong>
            <small>Based on {summary.answered} answers</small>
          </div>
        </div>

        <section className="results-panel" aria-labelledby="chart-title">
          <div className="results-heading">
            <div>
              <span className="eyebrow">RATING DISTRIBUTION</span>
              <h2 id="chart-title">{questions[question].prompt}</h2>
              <p>1 = lowest rating · 5 = highest rating</p>
            </div>
            <span className="chart-base">Base: {summary.answered} answers</span>
          </div>
          {summary.answered ? (
            <Chart summary={summary} />
          ) : (
            <div className="empty-results">
              <h3>No answers for this selection</h3>
              <p>
                Choose another question or clear the filters. Missing values are
                never treated as zero.
              </p>
            </div>
          )}
          <p className="chart-caption">
            Percentages use the answered responses for the current question, not
            all filtered rows. Rounded percentages may not add to exactly 100%.
          </p>
        </section>

        <div className="studio-bottom">
          <section className="method-panel" aria-labelledby="method-title">
            <h2 id="method-title">Behind the numbers</h2>
            <p>
              The mean is the sum of ratings divided by the number of answered
              responses. Blank values are excluded from the mean and
              percentages, and counted separately. Filters combine: a response
              must match both the track and the format.
            </p>
            <p>
              These small fictional samples illustrate the tool’s behavior; they
              are not evidence about real people or programs.
            </p>
            <details>
              <summary>CSV format & next steps</summary>
              <p>
                The download includes{" "}
                <code>id,track,format,satisfaction,confidence</code>. Ratings
                are whole numbers from 1 to 5; a blank means missing. Next,
                we’ll add CSV import with validation and support for your own
                browser-local data.
              </p>
            </details>
          </section>
          <section className="export-panel" aria-labelledby="export-title">
            <span className="eyebrow">TAKE A CLOSER LOOK</span>
            <h2 id="export-title">Check the source rows.</h2>
            <p>
              Download the {rows.length} filtered fictional responses and
              compare them with the chart. Both question columns are included.
            </p>
            <button onClick={download} disabled={!rows.length}>
              Download filtered CSV ↓
            </button>
            <p className="export-notice" role="status">
              {notice}
            </p>
          </section>
        </div>

        <section className="rows-panel" aria-labelledby="rows-title">
          <h2 id="rows-title">The responses behind this view</h2>
          <div
            className="table-scroll"
            role="region"
            aria-label="Survey responses, horizontally scrollable"
            tabIndex={0}
          >
            <table>
              <caption>
                {rows.length} fictional responses; a dash means no answer.
              </caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Track</th>
                  <th scope="col">Format</th>
                  <th scope="col">Satisfaction</th>
                  <th scope="col">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.id}</th>
                    <td>{row.track}</td>
                    <td>{row.format}</td>
                    <td>{row.satisfaction ?? "—"}</td>
                    <td>{row.confidence ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <footer className="studio-footer">
        <span>Built with AI coding assistance · Original fictional data</span>
        <a href="../#work">Back to the portfolio ↑</a>
      </footer>
    </>
  );
}
