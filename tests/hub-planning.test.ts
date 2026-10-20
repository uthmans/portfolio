import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBrief, validatePlan, projectFromPlan, fictionalBrief } from '../src/hub/planning.ts';
import { parseWorkspace } from '../src/hub/model.ts';
const plan = { title: 'Bakery website', summary: 'Draft a mobile-friendly bakery website.', tasks: ['Clarify menu requirements', 'Prototype the enquiry flow'], questions: ['Who supplies the menu content?'], risks: ['Enquiry delivery is undecided.'] };
test('brief and model plan validation reject empty, oversized and malformed content', () => {
  assert.equal(validateBrief(fictionalBrief), fictionalBrief);
  for (const brief of ['', 'short', 'x'.repeat(4001), { brief: fictionalBrief }]) assert.throws(() => validateBrief(brief));
  assert.deepEqual(validatePlan(plan), plan);
  for (const bad of [{ ...plan, tasks: [] }, { ...plan, tasks: ['Same', ' same '] }, { ...plan, title: 'x'.repeat(81) }, { ...plan, risks: ['x'.repeat(91)] }, { ...plan, tasks: Array(11).fill('Task') }, { ...plan, questions: null }]) assert.throws(() => validatePlan(bad));
});
test('reviewed plans become compatible projects with manual amounts, notes and unchecked tasks', () => {
  const project = projectFromPlan(plan, 'Fictional bakery', '1250.50', '2026-12-01');
  assert.equal(project.budget, 125050); assert.equal(project.spent, 0); assert.equal(project.stage, 'Planned');
  assert.ok(project.tasks.every(t => !t.done)); assert.equal(new Set(project.tasks.map(t => t.id)).size, 2);
  assert.match(project.notes, /Questions to clarify/); assert.match(project.notes, /Enquiry delivery is undecided/);
  assert.deepEqual(parseWorkspace(JSON.stringify({ version: 1, projects: [project] })).projects[0], project);
  const unset = projectFromPlan(plan, 'Owner', '', ''); assert.equal(unset.budget, 0); assert.equal(unset.due, '');
  assert.throws(() => projectFromPlan(plan, '', '', ''));
  assert.throws(() => projectFromPlan(plan, 'Owner', '-5', ''));
  assert.throws(() => projectFromPlan(plan, 'Owner', '', '2026-02-30'));
  const maximal = { title: 'x'.repeat(80), summary: 's'.repeat(300), tasks: ['t'.repeat(120)], questions: Array(3).fill('q'.repeat(90)), risks: Array(3).fill('r'.repeat(90)) };
  assert.ok(projectFromPlan(maximal, 'Owner', '', '').notes.length <= 1000);
});
