import {
  getSession,
  loadStore,
  blankStudent,
  upsertStudent,
  deleteStudent,
  getStudent
} from './tb-store.js';

const session = getSession();
if (!session || session.role !== 'trainer') {
  location.href = 'index.html';
}

let selectedId = null;

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

function renderList() {
  const { students } = loadStore();
  const list = document.getElementById('student-list');
  list.innerHTML = students.map((s) => `
    <div class="student-row ${s.id === selectedId ? 'active' : ''}" data-id="${s.id}">
      <div>
        <strong>${s.name}</strong>
        <div class="section-sub" style="margin:0">Phase ${s.phase} · Vale ${s.valeEnabled ? 'ON' : 'OFF'}</div>
      </div>
      <span class="nav-badge ${s.valeEnabled ? 'nb-green' : 'nb-red'}">${s.valeEnabled ? 'Vale' : '—'}</span>
    </div>
  `).join('') || '<p class="section-sub">No students yet.</p>';

  list.querySelectorAll('.student-row').forEach((row) => {
    row.addEventListener('click', () => {
      selectedId = row.dataset.id;
      renderList();
      renderDetail();
    });
  });
}

function renderDetail() {
  const detail = document.getElementById('detail');
  const s = selectedId ? getStudent(selectedId) : null;
  if (!s) {
    detail.innerHTML = '<p class="section-sub">Select a student.</p>';
    return;
  }

  detail.innerHTML = `
    <h2 class="section-title">${s.name}</h2>
    <p class="section-sub">Profile · trainer only</p>

    <div class="field">
      <label>Name</label>
      <input id="f-name" value="${s.name.replace(/"/g, '&quot;')}" />
    </div>
    <div class="field">
      <label>Student login user</label>
      <input id="f-user" value="${String(s.portalUser || '').replace(/"/g, '&quot;')}" placeholder="e.g. student.maria" autocomplete="off" />
    </div>
    <div class="field">
      <label>Student password</label>
      <input id="f-pass" type="text" value="${String(s.portalPass || '').replace(/"/g, '&quot;')}" placeholder="Assign a password" autocomplete="off" />
    </div>
    <div class="field">
      <label>Phase</label>
      <select id="f-phase">
        <option value="1" ${s.phase === 1 ? 'selected' : ''}>1 — Structure</option>
        <option value="2" ${s.phase === 2 ? 'selected' : ''}>2 — Expansion</option>
        <option value="3" ${s.phase === 3 ? 'selected' : ''}>3 — Naturalness</option>
      </select>
    </div>
    <div class="field">
      <label>Phase label</label>
      <input id="f-phase-label" value="${(s.phaseLabel || '').replace(/"/g, '&quot;')}" />
    </div>

    <div class="toggle-row">
      <div>
        <strong>Vale</strong>
        <div class="section-sub" style="margin:0">ON enables Vale in this student’s Training Book (Alice-slot UI). OFF hides it. No toggle inside the book.</div>
      </div>
      <button type="button" class="toggle ${s.valeEnabled ? 'on' : ''}" id="f-vale" aria-label="Toggle Vale"></button>
    </div>

    <div class="field">
      <label>KPIs (ig, st, rc, ps, rs)</label>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
        ${['ig','st','rc','ps','rs'].map((k) => `
          <input id="kpi-${k}" type="number" min="0" max="100" value="${s.kpis?.[k] ?? 50}" title="${k}" />
        `).join('')}
      </div>
    </div>

    <div class="field">
      <label>Add session note</label>
      <textarea id="f-note" rows="3" placeholder="What froze them today?"></textarea>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button type="button" class="btn btn-metal" id="btn-save"><i class="ti ti-device-floppy"></i> Save profile</button>
      <a class="btn btn-ghost" href="index.html" id="preview-hint">Student opens TB from login</a>
      <button type="button" class="btn btn-danger" id="btn-del"><i class="ti ti-trash"></i> Delete</button>
    </div>

    <hr style="border:none;border-top:1px solid var(--border);margin:1rem 0;" />
    <h3 class="section-title" style="font-size:13px;">Exercises (${(s.exercises || []).length})</h3>
    <div id="ex-mini">
      ${(s.exercises || []).map((ex) => `
        <div class="session-log-item">
          <div class="sli-header"><strong>${ex.title}</strong> · ${ex.status}</div>
          <div class="sli-text">${ex.type || ''} — ${ex.objective || ex.meta || ''}</div>
        </div>
      `).join('') || '<p class="section-sub">No exercises.</p>'}
    </div>
  `;

  let valeOn = !!s.valeEnabled;
  document.getElementById('f-vale').addEventListener('click', (e) => {
    valeOn = !valeOn;
    e.currentTarget.classList.toggle('on', valeOn);
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    const next = getStudent(s.id);
    next.name = document.getElementById('f-name').value.trim() || next.name;
    next.portalUser = document.getElementById('f-user').value.trim().toLowerCase();
    next.portalPass = document.getElementById('f-pass').value;
    next.phase = Number(document.getElementById('f-phase').value);
    next.phaseLabel = document.getElementById('f-phase-label').value.trim();
    next.valeEnabled = valeOn;
    next.kpis = {
      ig: Number(document.getElementById('kpi-ig').value) || 0,
      st: Number(document.getElementById('kpi-st').value) || 0,
      rc: Number(document.getElementById('kpi-rc').value) || 0,
      ps: Number(document.getElementById('kpi-ps').value) || 0,
      rs: Number(document.getElementById('kpi-rs').value) || 0
    };
    next.kpiHistory = Array.isArray(next.kpiHistory) ? next.kpiHistory : [];
    next.kpiHistory.push({
      at: new Date().toISOString(),
      source: 'trainer',
      ig: next.kpis.ig,
      st: next.kpis.st,
      rc: next.kpis.rc,
      ps: next.kpis.ps,
      rs: next.kpis.rs
    });
    if (next.kpiHistory.length > 40) next.kpiHistory = next.kpiHistory.slice(-40);
    if (!next.portalUser || !next.portalPass) {
      toast('Set student user + password before they can log in.');
    }
    const note = document.getElementById('f-note').value.trim();
    if (note) {
      next.notes = next.notes || [];
      next.notes.unshift({ ts: new Date().toISOString(), text: note });
    }
    try {
      upsertStudent(next);
      toast('Saved.');
    } catch (e) {
      toast(e.message || 'Could not save.');
      return;
    }
    renderList();
    renderDetail();
  });

  document.getElementById('btn-del').addEventListener('click', () => {
    if (!confirm(`Delete ${s.name}?`)) return;
    deleteStudent(s.id);
    selectedId = null;
    toast('Deleted.');
    renderList();
    renderDetail();
  });
}

document.getElementById('btn-add').addEventListener('click', () => {
  const name = prompt('Student name');
  if (!name) return;
  const clean = name.trim();
  const low = clean.toLowerCase();
  if (low.includes('rivera') || low === 'alex rivera' || low === 'juan rivera') {
    toast('That name is blocked.');
    return;
  }
  const user = prompt('Student login user (required)') || '';
  const pass = prompt('Student password (required)') || '';
  if (!user.trim() || !pass) {
    toast('User + password required. Student not created.');
    return;
  }
  const s = blankStudent(clean);
  s.portalUser = user.trim().toLowerCase();
  s.portalPass = pass;
  try {
    upsertStudent(s);
  } catch (e) {
    toast(e.message || 'Blocked.');
    return;
  }
  selectedId = s.id;
  toast('Student added.');
  renderList();
  renderDetail();
});

renderList();
