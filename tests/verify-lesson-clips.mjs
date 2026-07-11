/**
 * Smoke: every Foundations track in jill-canon-map has a lesson clip with labeled slots.
 *   node tests/verify-lesson-clips.mjs
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(readFileSync(path.join(root, 'config/jill-canon-map.json'), 'utf8'));
const clipSrc = readFileSync(path.join(root, 'js/jill-lesson-clip.js'), 'utf8');
const g = {};
const sandbox = { window: g, globalThis: g, console };
vm.createContext(sandbox);
vm.runInContext(clipSrc, sandbox);
const Clip = g.JillLessonClip;
if (!Clip) {
  console.error('FAIL: JillLessonClip not loaded');
  process.exit(1);
}

const trackIds = (map.tracks || []).map((t) => t.id);
const missing = [];
const emptyLabels = [];
for (const id of trackIds) {
  if (!Clip.supports(id)) {
    missing.push(id);
    continue;
  }
  const def = Clip.getClip(id);
  const bad = (def.slots || []).filter((s) => !s.label || !String(s.label).trim());
  if (!def.slots || !def.slots.length || bad.length) emptyLabels.push(id);
}

const nexus = ['nexus_idea_chain', 'nexus_linkers', 'nexus_star', 'nexus_recovery'];
const nexusMissing = nexus.filter((id) => !Clip.supports(id));

console.log(JSON.stringify({
  tracks: trackIds.length,
  clips: Clip.listIds().length,
  missing,
  emptyLabels,
  nexusMissing,
  ok: !missing.length && !emptyLabels.length && !nexusMissing.length
}, null, 2));

if (missing.length || emptyLabels.length || nexusMissing.length) process.exit(1);
