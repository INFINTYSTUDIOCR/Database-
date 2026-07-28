import { getSession, getStudent, DEFAULT_DRILLS } from './tb-store.js';

const session = getSession();
if (!session || session.role !== 'student' || !session.studentId) {
  location.href = 'index.html';
}

const student = getStudent(session.studentId);
if (!student) location.href = 'index.html';

const KPI_LABELS = [
  ['ig', 'Ideas'],
  ['st', 'Structure'],
  ['rc', 'Recovery'],
  ['ps', 'Problem solve'],
  ['rs', 'Response']
];

function avgKpi(k) {
  const vals = Object.values(k || {});
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function pillClass(v) {
  if (v >= 70) return 'kp-strong';
  if (v >= 55) return 'kp-dev';
  return 'kp-weak';
}

function statusClass(s) {
  if (s === 'done') return 'status-done';
  if (s === 'progress') return 'status-progress';
  return 'status-pending';
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`view-${id}`)?.classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === id);
  });
}

function renderShell() {
  document.getElementById('tb-student-name').textContent = `${student.name} · Phase ${student.phase}`;
  document.getElementById('sc-name').textContent = student.name;
  document.getElementById('sc-meta').textContent = `Phase ${student.phase} · ${student.phaseLabel || 'Spanish ops'}`;
  document.getElementById('sc-kpis').innerHTML = KPI_LABELS.map(([id, name]) => {
    const v = student.kpis?.[id] ?? 0;
    return `<span class="kpi-pill ${pillClass(v)}">${name} ${v}</span>`;
  }).join('');
  document.getElementById('nb-exercises').textContent = String((student.exercises || []).filter((e) => e.status !== 'done').length);
  document.getElementById('nb-videos').textContent = String((student.videos || []).length);

  const valeNav = document.getElementById('nav-vale');
  const valeDemo = document.getElementById('nav-vale-demo');
  if (student.valeEnabled) {
    valeNav.style.opacity = '1';
    valeDemo.textContent = 'Open →';
  } else {
    valeNav.style.opacity = '0.45';
    valeDemo.textContent = 'OFF';
  }
}

function renderOverview() {
  const score = avgKpi(student.kpis);
  document.getElementById('view-overview').innerHTML = `
    <div class="phase-banner">
      <div>
        <div class="pb-phase">Phase ${student.phase}</div>
        <div class="pb-name">${student.phaseLabel || 'Structure foundations'}</div>
        <div class="pb-desc">Trainer installs the pattern live. Your book tracks KPIs and Spanish drills between classes.</div>
      </div>
      <div style="text-align:right">
        <div class="pb-score">${score}</div>
        <div class="pb-score-label">Weekly score</div>
      </div>
    </div>
    <div class="portal-section">
      <h2 class="section-title">Operational KPI radar</h2>
      <p class="section-sub">Same 5 performance axes — Spanish as the target</p>
      ${KPI_LABELS.map(([id, name]) => {
        const v = student.kpis?.[id] ?? 0;
        return `<div class="kpi-bar-row"><div class="kbar-name">${name}</div><div class="kbar-bg"><div class="kbar-fill" style="width:${v}%"></div></div><div class="kbar-val">${v}</div></div>`;
      }).join('')}
    </div>
    <div class="portal-section">
      <h2 class="section-title">Platform</h2>
      <p class="section-sub">Companion slot (same placement as the English book’s coach)</p>
      <a class="tool-card ${student.valeEnabled ? '' : 'off'}" href="${student.valeEnabled ? 'vale.html' : '#'}" ${student.valeEnabled ? '' : 'onclick="return false"'}>
        <div class="tool-logo">V</div>
        <div>
          <div class="tool-name">Vale — coach 24/7</div>
          <div class="tool-desc">${student.valeEnabled ? 'Practice Spanish oral structure when your trainer isn’t there. Chat, correct, celebrate.' : 'Vale is OFF for your profile. Ask your trainer to enable it in the subengine.'}</div>
          <span class="tool-cta">${student.valeEnabled ? 'Open Vale →' : 'Disabled'}</span>
        </div>
      </a>
      ${student.valeEnabled ? `
      <div class="vale-thread">
        <div class="vale-msg bot"><strong>VALE</strong> Contame de tu día — dos ideas unidas con <em>porque</em> o <em>entonces</em>.</div>
        <div class="vale-msg user">Hoy estoy cansado porque dormí poco.</div>
        <div class="vale-msg bot"><strong>VALE</strong> Pura vida — estructura limpia. Ahora sin “yo”. Otra vez.</div>
      </div>` : ''}
    </div>
  `;
}

function renderExercises() {
  const list = student.exercises || [];
  document.getElementById('view-exercises').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Assigned exercises</h2>
      <p class="section-sub">Personalized by your trainer · Spanish operational</p>
      ${list.map((ex) => `
        <div class="ex-card">
          <div class="ex-header">
            <div>
              <div class="ex-type">${ex.type || 'Exercise'}</div>
              <div class="ex-title">${ex.title}</div>
            </div>
            <span class="status-badge ${statusClass(ex.status)}">${ex.status}</span>
          </div>
          <div class="ex-body">
            <div class="ex-objective">${ex.objective || ex.meta || ''}</div>
            ${ex.bad ? `<div class="ex-example-bad">Avoid: ${ex.bad}</div>` : ''}
            ${ex.good ? `<div class="ex-example-good">Target: ${ex.good}</div>` : ''}
          </div>
        </div>
      `).join('') || '<p class="section-sub">No exercises yet.</p>'}
    </div>
  `;
}

function renderPlan() {
  document.getElementById('view-plan').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Session plan</h2>
      <p class="section-sub">Trainer online + book work between classes</p>
      ${(student.plan || []).map((p) => `
        <div class="session-log-item">
          <div class="sli-header"><strong>${p.day}</strong></div>
          <div class="sli-text">${p.item}</div>
        </div>
      `).join('') || '<p class="section-sub">No plan yet.</p>'}
    </div>
  `;
}

function renderDrills() {
  document.getElementById('view-drills').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Speed Drills</h2>
      <p class="section-sub">EN → ES · say it out loud · mark pass/fail</p>
      <div class="drill-grid" id="drill-grid">
        ${DEFAULT_DRILLS.map((d) => `
          <div class="drill-item" data-id="${d.id}">
            <div class="drill-en">${d.en}</div>
            <div class="drill-es">${d.es}</div>
            <div class="drill-btns">
              <button type="button" class="drill-btn drill-pass" data-r="pass">Pass</button>
              <button type="button" class="drill-btn drill-fail" data-r="fail">Retry</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('drill-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.drill-btn');
    if (!btn) return;
    toast(btn.dataset.r === 'pass' ? 'Nice — keep the pace.' : 'Again — verb first.');
  });
}

function renderVale() {
  const on = student.valeEnabled;
  document.getElementById('view-vale').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Vale — coach 24/7</h2>
      <p class="section-sub">Same companion slot as the English book’s coach — Spanish target</p>
      ${on ? `
        <div class="info-box ib-metal">Vale is ON for your profile. Open the companion to practice oral structure.</div>
        <a class="tool-card" href="vale.html">
          <div class="tool-logo">V</div>
          <div>
            <div class="tool-name">Launch Vale</div>
            <div class="tool-desc">Voice + text · correct structure · celebrate wins</div>
            <span class="tool-cta">Open Vale →</span>
          </div>
        </a>
        <div class="vale-thread">
          <div class="vale-msg bot"><strong>VALE</strong> ¿Cómo te fue hoy? Usá un conector.</div>
        </div>
      ` : `
        <div class="info-box ib-metal">Vale is OFF. Your trainer enables it in the GOSpanol subengine (student profile) — same pattern as the English coach toggle.</div>
      `}
    </div>
  `;
}

function renderMeasurement() {
  document.getElementById('view-measurement').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">How we measure</h2>
      <p class="section-sub">Five operational KPIs — not a textbook grade</p>
      <div class="info-box ib-metal"><strong>Ideas</strong> — can you start without freezing?</div>
      <div class="info-box ib-metal"><strong>Structure</strong> — verb-first, ser/estar, connectors, clitics</div>
      <div class="info-box ib-metal"><strong>Recovery</strong> — bounce back when you stall</div>
      <div class="info-box ib-metal"><strong>Problem solve</strong> — handle the scenario ask</div>
      <div class="info-box ib-metal"><strong>Response</strong> — answer under time pressure</div>
    </div>
  `;
}

function renderPhase(n, title, body) {
  document.getElementById(`view-phase${n}`).innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Phase ${n} — ${title}</h2>
      <p class="section-sub">Spanish operational track</p>
      <div class="info-box ib-metal">${body}</div>
    </div>
  `;
}

function renderVideos() {
  document.getElementById('view-videos').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Videos & games</h2>
      <p class="section-sub">Spanish scenarios and oral games</p>
      ${(student.videos || []).map((v) => `
        <div class="session-log-item">
          <div class="sli-header"><strong>${v.title}</strong> · ${v.meta || ''}</div>
          <div class="sli-text">${(v.questions || []).map((q) => `• ${q}`).join('<br>')}</div>
        </div>
      `).join('') || '<p class="section-sub">No items yet.</p>'}
    </div>
  `;
}

function renderSessions() {
  document.getElementById('view-sessions').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Session notes</h2>
      <p class="section-sub">Written by your trainer</p>
      ${(student.notes || []).map((n) => `
        <div class="session-log-item">
          <div class="sli-header">${new Date(n.ts).toLocaleString()}</div>
          <div class="sli-text">${n.text}</div>
        </div>
      `).join('') || '<p class="section-sub">No notes yet.</p>'}
    </div>
  `;
}

document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.view;
    if (id === 'vale' && !student.valeEnabled) {
      toast('Vale is OFF on your profile.');
    }
    showView(id);
  });
});

renderShell();
renderOverview();
renderExercises();
renderPlan();
renderDrills();
renderVale();
renderMeasurement();
renderPhase(1, 'Structure', 'Verb-first, ser/estar, gender, basic clitics. Drop the freeze.');
renderPhase(2, 'Expansion', 'Connectors, past contrast, work talk. Stack ideas under pressure.');
renderPhase(3, 'Naturalness', 'Fillers, reactions, smooth turns. Sound like a speaker — not a textbook.');
renderVideos();
renderSessions();
showView('overview');
