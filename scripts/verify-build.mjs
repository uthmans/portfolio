import assert from "node:assert/strict";
import { readFile, access, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { surveyProject, businessProject, hubProject } from "../src/content.ts";

const base = "/portfolio/";
for (const route of [
  "index.html",
  "survey/index.html",
  "business/index.html",
  "business/services/room-planning/index.html",
  "business/services/styling/index.html",
  "business/services/workspace/index.html",
  "hub/index.html",
]) {
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
assert.equal(businessProject.status, "First version");
assert.equal(businessProject.demoUrl, "business/");
assert.equal(hubProject.status, "First version");
assert.equal(hubProject.demoUrl, "hub/");
const commit =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const deployment = {
  commit,
  builtAt: new Date().toISOString(),
  routes: [
    base,
    `${base}survey/`,
    `${base}business/`,
    `${base}hub/`,
    ...["room-planning", "styling", "workspace"].map(
      (slug) => `${base}business/services/${slug}/`,
    ),
  ],
  surveyStatus: surveyProject.status,
  businessStatus: businessProject.status,
  hubStatus: hubProject.status,
};
await writeFile(
  "dist/deployment.json",
  `${JSON.stringify(deployment, null, 2)}\n`,
);
console.log(
  `Verified all seven production pages and their assets. Deployment revision: ${commit}`,
);
