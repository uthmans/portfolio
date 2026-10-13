import assert from "node:assert/strict";
import { readFile, access, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { surveyProject } from "../src/content.ts";

const base = "/portfolio/";
for (const route of ["index.html", "survey/index.html"]) {
  const html = await readFile(`dist/${route}`, "utf8");
  assert.ok(!html.includes("/src/"), `${route} must contain compiled code`);
  const assetLinks = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(
    assetLinks.some((url) => url.endsWith(".js")),
    `${route} has a JavaScript entry`,
  );
  for (const url of assetLinks) {
    assert.ok(url.startsWith(base), `${route}: unexpected asset base ${url}`);
    await access(`dist/${url.slice(base.length)}`);
  }
}
assert.equal(surveyProject.status, "First version");
assert.equal(surveyProject.demoUrl, "survey/");
const commit =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const deployment = {
  commit,
  builtAt: new Date().toISOString(),
  routes: [base, `${base}survey/`],
  surveyStatus: surveyProject.status,
};
await writeFile(
  "dist/deployment.json",
  `${JSON.stringify(deployment, null, 2)}\n`,
);
console.log(
  `Verified both production pages and their assets. Deployment revision: ${commit}`,
);
