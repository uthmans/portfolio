import { useState, type ChangeEvent } from "react";
import { MAX_FILE_BYTES, MAX_ROWS, parseCsv } from "./csv";
import { generateResponses } from "./generate";
import Chart from "./Chart";
import FeedbackStudio from "./Feedback";
import PortfolioBanner from "../components/PortfolioBanner";
import {
  filterResponses,
  questions,
  sample,
  summarize,
  toCsv,
  type Question,
  type ResponseRow,
} from "./data";

type Dataset = {
  rows: ResponseRow[];
  kind: "sample" | "generated" | "imported";
  name: string;
  seed?: number;
};

export default function SurveyApp() {
  const [question, setQuestion] = useState<Question>("satisfaction");
  const [track, setTrack] = useState("All");
  const [format, setFormat] = useState("All");
  const [notice, setNotice] = useState("");
  const [dataset, setDataset] = useState<Dataset>({
    rows: sample,
    kind: "sample",
    name: "Built-in fictional sample",
  });
  const [generationCount, setGenerationCount] = useState("100");
  const [dataErrors, setDataErrors] = useState<string[]>([]);
  const [datasetNotice, setDatasetNotice] = useState("");
  const [reading, setReading] = useState(false);
  const rows = filterResponses(dataset.rows, track, format);
  const visibleRows = rows.slice(0, 100);
  const fictional = dataset.kind !== "imported";
  const summary = summarize(rows, question);
  const filtered = track !== "All" || format !== "All";

  function loadDataset(next: Dataset, message: string) {
    setDataset(next);
    setTrack("All");
    setFormat("All");
    setQuestion("satisfaction");
    setDataErrors([]);
    setNotice("");
    setDatasetNotice(message);
  }

  function saveCsv(data: ResponseRow[], filename: string) {
    const url = URL.createObjectURL(
      new Blob([toCsv(data)], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function download() {
    saveCsv(
      rows,
      fictional
        ? "fictional-survey-responses.csv"
        : "imported-survey-responses.csv",
    );
    setNotice(
      `CSV download requested for ${rows.length} ${fictional ? "fictional " : ""}responses.`,
    );
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setDataErrors([]);
    setDatasetNotice("");
    if (file.size > MAX_FILE_BYTES) {
      setDataErrors([
        "The file is too large. Use a UTF-8 CSV of 2 MB or less.",
      ]);
      return;
    }
    setReading(true);
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      const result = parseCsv(text);
      if (result.ok)
        loadDataset(
          { rows: result.rows, kind: "imported", name: file.name },
          `Imported ${result.rows.length} responses from ${file.name}. Filters reset.`,
        );
      else setDataErrors(result.errors);
    } catch {
      setDataErrors([
        "The file could not be read as UTF-8 text. Save it as CSV UTF-8 and try again.",
      ]);
    } finally {
      setReading(false);
    }
  }

  function generate() {
    setDatasetNotice("");
    try {
      if (!/^\d+$/.test(generationCount))
        throw new Error("Choose a whole number from 10 to 1,000 responses.");
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      const generated = generateResponses(Number(generationCount), seed);
      loadDataset(
        {
          rows: generated,
          kind: "generated",
          name: "Generated fictional data",
          seed,
        },
        `Generated ${generated.length} fictional responses. Filters reset. Download the CSV to keep them.`,
      );
    } catch (error) {
      setDataErrors([
        error instanceof Error
          ? error.message
          : "Could not generate the dataset.",
      ]);
    }
  }

  return (
    <>
      <a className="skip-link" href="#survey-main">
        Skip to results
      </a>
      <PortfolioBanner
        title="Survey Insights Studio"
        context="Independent demo"
      />
      <main id="survey-main" className="studio-main">
        <div className="studio-title">
          <div>
            <span className="eyebrow">A LITTLE CLARITY IN THE DATA</span>
            <h1>
              Survey Insights <em>Studio.</em>
            </h1>
            <p>Explore feedback. See the counts. Understand the calculation.</p>
            <p><a href="#written-feedback">Explore written-feedback analysis ↓</a></p>
          </div>
          <span className="sample-badge">
            {dataset.kind === "imported"
              ? "Imported CSV"
              : dataset.kind === "generated"
                ? "Generated fictional"
                : "Fictional sample"}{" "}
            · {dataset.rows.length} responses
          </span>
        </div>
        <aside className="dataset-note">
          <strong>{dataset.name}</strong>
          <p>
            {dataset.kind === "sample"
              ? "The built-in sample is feedback from an imaginary community learning series. Every response is made up."
              : dataset.kind === "generated"
                ? `These randomly generated responses are entirely fictional. Ratings are chosen from 1–5, with about 10% of answers intentionally left blank.`
                : "Your imported CSV is now used for the charts and calculations. Its responses are not labeled as fictional."}{" "}
            Imported and generated data stay in this tab and reset on reload.
            Download a CSV to keep them. Rating data is processed in your browser.
            The separate written-feedback workspace below explains its AI options.
          </p>
        </aside>

        <section
          className="dataset-panel"
          aria-labelledby="dataset-title"
          aria-busy={reading}
        >
          <div className="dataset-heading">
            <div>
              <span className="eyebrow">CHOOSE YOUR DATA</span>
              <h2 id="dataset-title">
                Bring a CSV, or make a fictional dataset.
              </h2>
            </div>
            <button
              className="reset-filters"
              disabled={reading}
              onClick={() =>
                loadDataset(
                  {
                    rows: sample,
                    kind: "sample",
                    name: "Built-in fictional sample",
                  },
                  "Reset to the 12-response fictional sample. Filters reset.",
                )
              }
            >
              Reset to sample
            </button>
          </div>
          <div className="dataset-options">
            <div>
              <h3>Import your CSV</h3>
              <p>
                Use the format below. Invalid files leave your current dataset
                and filters unchanged.
              </p>
              <label className="file-label" htmlFor="survey-csv">
                Choose CSV file
              </label>
              <input
                id="survey-csv"
                type="file"
                accept=".csv,text/csv"
                disabled={reading}
                onChange={importFile}
                aria-describedby="csv-limits"
              />
              <small id="csv-limits">
                UTF-8, comma-separated · Up to 2 MB and{" "}
                {MAX_ROWS.toLocaleString("en-US")} rows
              </small>
            </div>
            <div>
              <h3>No file? Try random fictional data.</h3>
              <p>
                Generate a fresh dataset, explore its results, and download it
                as a valid CSV.
              </p>
              <div className="generator-controls">
                <label htmlFor="generation-count">
                  Number of responses
                  <input
                    id="generation-count"
                    type="number"
                    min="10"
                    max="1000"
                    step="1"
                    value={generationCount}
                    disabled={reading}
                    onChange={(event) => setGenerationCount(event.target.value)}
                  />
                </label>
                <button disabled={reading} onClick={generate}>
                  Generate fictional dataset
                </button>
              </div>
              <small>
                10–1,000 responses · A new random dataset on each click
              </small>
            </div>
          </div>
          <details className="csv-guide">
            <summary>Required CSV format & example</summary>
            <p>
              One response per row. Include exactly these five headers, in any
              order. Header names and category values are case-sensitive. Quoted
              fields are supported. Save as{" "}
              <strong>CSV UTF-8 (comma-separated)</strong> from your
              spreadsheet.
            </p>
            <div className="csv-format-table">
              <dl>
                <div>
                  <dt>id</dt>
                  <dd>
                    Unique, 1–64 letters, numbers, hyphens, or underscores;
                    start with a letter or number. Use anonymous IDs, such as
                    R01.
                  </dd>
                </div>
                <div>
                  <dt>track</dt>
                  <dd>Websites, Automations, or Data</dd>
                </div>
                <div>
                  <dt>format</dt>
                  <dd>Online or In person</dd>
                </div>
                <div>
                  <dt>satisfaction</dt>
                  <dd>Whole number 1–5, or blank for a missing answer</dd>
                </div>
                <div>
                  <dt>confidence</dt>
                  <dd>Whole number 1–5, or blank for a missing answer</dd>
                </div>
              </dl>
            </div>
            <pre>
              id,track,format,satisfaction,confidence{"\n"}
              R01,Websites,Online,5,4{"\n"}R02,Data,In person,,3
            </pre>
            <p>
              Blank ratings are excluded from calculations, never treated as
              zero. Do not use 0, N/A, or text for a missing rating. All rows
              must pass validation before any data is replaced.
            </p>
            <button
              className="reset-filters"
              onClick={() => {
                saveCsv(sample, "survey-example.csv");
                setDatasetNotice(
                  "Example CSV download requested. Your active dataset is unchanged.",
                );
              }}
            >
              Download example CSV
            </button>
          </details>
          {reading && (
            <p role="status" className="data-change-notice">
              Reading and validating your CSV…
            </p>
          )}
          {dataErrors.length > 0 && (
            <div role="alert" className="dataset-errors">
              <h3>Dataset unchanged</h3>
              <p>Fix these issues and try again:</p>
              <ul>
                {dataErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <p role="status" className="data-change-notice">
            {datasetNotice}
          </p>
        </section>

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
          Showing {rows.length} of {dataset.rows.length} responses ·{" "}
          {summary.answered} answered this question · {summary.missing} missing
        </p>
        <div className="summary-grid">
          <div>
            <span>Filtered responses</span>
            <strong>{summary.total}</strong>
            <small>Of {dataset.rows.length} in the dataset</small>
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
              {fictional
                ? "This fictional dataset illustrates the tool’s behavior; it is not evidence about real people or programs."
                : "These calculations describe the imported responses only. A small or filtered sample does not establish broader findings."}
            </p>
          </section>
          <section className="export-panel" aria-labelledby="export-title">
            <span className="eyebrow">TAKE A CLOSER LOOK</span>
            <h2 id="export-title">Check the source rows.</h2>
            <p>
              Download the {rows.length} filtered{" "}
              {fictional ? "fictional " : ""}responses and compare them with the
              chart. Both question columns are included, and all filtered rows
              are exported even when the table preview is limited.
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
                {fictional ? "Fictional responses" : "Imported responses"};
                showing {Math.min(rows.length, 100)} of {rows.length} filtered
                rows. A dash means no answer. Calculations use all filtered
                rows.
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
                {visibleRows.map((row) => (
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
        <FeedbackStudio />
      </main>
      <footer className="studio-footer">
        <span>
          Built with AI coding assistance · CSV processing stays in your browser
        </span>
        <a href="../#work">Back to the portfolio ↑</a>
      </footer>
    </>
  );
}
