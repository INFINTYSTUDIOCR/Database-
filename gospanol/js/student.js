import { getSession, getStudent, upsertStudent, DEFAULT_DRILLS } from './tb-store.js';

const session = getSession();
if (!session || session.role !== 'student' || !session.studentId) {
  location.href = 'index.html';
}

let student = getStudent(session.studentId);
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

function persist() {
  upsertStudent(student);
  student = getStudent(student.id) || student;
}

function radarPoints(k) {
  const cx = 100;
  const cy = 100;
  const maxR = 72;
  const angles = [-90, -18, 54, 126, 198].map((d) => (d * Math.PI) / 180);
  const vals = ['ig', 'st', 'rc', 'ps', 'rs'].map((id) => ((k?.[id] ?? 0) / 100) * maxR);
  return angles
    .map((a, i) => `${cx + Math.cos(a) * vals[i]},${cy + Math.sin(a) * vals[i]}`)
    .join(' ');
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
  document.getElementById('nb-exercises').textContent = String(
    (student.exercises || []).filter((e) => e.status !== 'done').length
  );
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
  const k = student.kpis || {};
  document.getElementById('view-overview').innerHTML = `
    <div class="phase-banner">
      <div>
        <div class="pb-phase">Phase ${student.phase}</div>
        <div class="pb-name">${student.phaseLabel || 'Structure foundations'}</div>
        <div class="pb-desc">Trainer installs the pattern live. This engine tracks KPIs and Spanish drills between classes — a separate ops app, not the marketing site.</div>
      </div>
      <div style="text-align:right">
        <div class="pb-score">${score}</div>
        <div class="pb-score-label">Weekly score</div>
      </div>
    </div>
    <div class="portal-section">
      <h2 class="section-title">Operational KPI radar</h2>
      <p class="section-sub">Same 5 performance axes — Spanish as the target</p>
      <div class="radar-wrap">
        <div>
          <svg class="radar-svg" viewBox="0 0 200 200" aria-label="KPI radar">
            <polygon points="100,28 168,72 142,148 58,148 32,72" fill="none" stroke="#D5DEE5" stroke-width="1"/>
            <polygon points="100,50 145,78 128,128 72,128 55,78" fill="none" stroke="#D5DEE5" stroke-width="1"/>
            <polygon points="100,72 122,88 114,118 86,118 78,88" fill="none" stroke="#D5DEE5" stroke-width="1"/>
            <line x1="100" y1="100" x2="100" y2="28" stroke="#D5DEE5"/>
            <line x1="100" y1="100" x2="168" y2="72" stroke="#D5DEE5"/>
            <line x1="100" y1="100" x2="142" y2="148" stroke="#D5DEE5"/>
            <line x1="100" y1="100" x2="58" y2="148" stroke="#D5DEE5"/>
            <line x1="100" y1="100" x2="32" y2="72" stroke="#D5DEE5"/>
            <polygon id="radar-poly" points="${radarPoints(k)}" fill="rgba(91,33,182,0.28)" stroke="#5B21B6" stroke-width="2"/>
            <text x="100" y="18" text-anchor="middle" font-size="9" fill="#5A6F7C">Ideas</text>
            <text x="178" y="72" text-anchor="start" font-size="9" fill="#5A6F7C">Structure</text>
            <text x="150" y="162" text-anchor="middle" font-size="9" fill="#5A6F7C">Recovery</text>
            <text x="50" y="162" text-anchor="middle" font-size="9" fill="#5A6F7C">Problem</text>
            <text x="18" y="72" text-anchor="end" font-size="9" fill="#5A6F7C">Response</text>
          </svg>
          <div class="radar-score-pill">Score ${score}</div>
        </div>
        <div>
          ${KPI_LABELS.map(([id, name]) => {
            const v = k[id] ?? 0;
            return `<div class="kpi-bar-row"><div class="kbar-name">${name}</div><div class="kbar-bg"><div class="kbar-fill" style="width:${v}%"></div></div><div class="kbar-val">${v}</div></div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <div class="portal-section">
      <h2 class="section-title">Platform exits</h2>
      <p class="section-sub">Leave the engine to practice — these are exits, not book tabs</p>
      <div class="tool-grid">
        <a class="tool-card ${student.valeEnabled ? '' : 'off'}" href="${student.valeEnabled ? 'vale.html' : '#'}" ${student.valeEnabled ? '' : 'onclick="return false"'}>
          <div class="tool-logo">V</div>
          <div>
            <div class="tool-name">Vale — oral companion</div>
            <div class="tool-desc">${student.valeEnabled ? 'Practice Spanish when your trainer isn’t there.' : 'OFF on your profile — ask your trainer.'}</div>
            <span class="tool-cta">${student.valeEnabled ? 'Open Vale →' : 'Disabled'}</span>
          </div>
        </a>
        <a class="tool-card" href="../hablemos.html">
          <div class="tool-logo" style="background:linear-gradient(135deg,#2F5D75,#4A90A4)">S</div>
          <div>
            <div class="tool-name">Sim — scenarios</div>
            <div class="tool-desc">Pressure practice in Spanish (sister sim).</div>
            <span class="tool-cta">Open Sim →</span>
          </div>
        </a>
        <a class="tool-card" href="../hablemos.html">
          <div class="tool-logo" style="background:linear-gradient(135deg,#1B3A4B,#2F5D75)">T</div>
          <div>
            <div class="tool-name">Structure drills</div>
            <div class="tool-desc">EN→ES pattern installs outside the book shell.</div>
            <span class="tool-cta">Open Structure →</span>
          </div>
        </a>
      </div>
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
      <p class="section-sub">Trainer online + book work + Vale reinforcement between classes</p>
      ${(student.plan || []).map((p) => `
        <div class="plan-row">
          <div class="plan-day">${p.day}</div>
          <div class="plan-item">${p.item}</div>
        </div>
      `).join('') || '<p class="section-sub">No plan yet.</p>'}
      <p class="exit-hint">Live class installs the pattern. Speed drills and Vale (if ON) reinforce — they never replace the trainer.</p>
    </div>
  `;
}

function renderDrills() {
  const results = student.drillResults || {};
  document.getElementById('view-drills').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Speed Drills</h2>
      <p class="section-sub">EN → ES · say it out loud · mark pass/fail</p>
      <div class="drill-grid" id="drill-grid">
        ${DEFAULT_DRILLS.map((d) => {
          const r = results[d.id];
          const cls = r === 'pass' ? 'is-pass' : r === 'fail' ? 'is-fail' : '';
          return `
          <div class="drill-item ${cls}" data-id="${d.id}">
            <div class="drill-en">${d.en}</div>
            <div class="drill-es">${d.es}</div>
            <div class="drill-btns">
              <button type="button" class="drill-btn drill-pass" data-r="pass">Pass</button>
              <button type="button" class="drill-btn drill-fail" data-r="fail">Retry</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
  document.getElementById('drill-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.drill-btn');
    if (!btn) return;
    const item = btn.closest('.drill-item');
    const id = item.dataset.id;
    const result = btn.dataset.r;
    student.drillResults = student.drillResults || {};
    student.drillResults[id] = result;
    persist();
    item.classList.toggle('is-pass', result === 'pass');
    item.classList.toggle('is-fail', result === 'fail');
    toast(result === 'pass' ? 'Nice — keep the pace.' : 'Again — verb first.');
  });
}

function renderVale() {
  const on = student.valeEnabled;
  document.getElementById('view-vale').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">Vale — coach 24/7</h2>
      <p class="section-sub">Companion slot · Spanish target · exit from the engine</p>
      ${on ? `
        <div class="info-box ib-metal">Vale is ON for your profile. Opening it leaves the Training Book Engine.</div>
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
        <div class="info-box ib-metal">Vale is OFF. Your trainer enables it in the GOSpanol subengine (student profile) — same pattern as the English coach toggle. No toggle inside this book.</div>
      `}
    </div>
  `;
}

function renderMeasurement() {
  document.getElementById('view-measurement').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">How we measure</h2>
      <p class="section-sub">Five operational KPIs — not a textbook grade</p>
      <div class="kpi-legend-grid">
        <div class="info-box ib-metal"><strong>Ideas</strong> — can you start without freezing?</div>
        <div class="info-box ib-metal"><strong>Structure</strong> — verb-first, ser/estar, connectors, clitics</div>
        <div class="info-box ib-metal"><strong>Recovery</strong> — bounce back when you stall</div>
        <div class="info-box ib-metal"><strong>Problem solve</strong> — handle the scenario ask</div>
        <div class="info-box ib-metal"><strong>Response</strong> — answer under time pressure</div>
      </div>
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
  const trainerNotes = student.notes || [];
  const mine = student.studentNotes || [];
  document.getElementById('view-sessions').innerHTML = `
    <div class="portal-section">
      <h2 class="section-title">My quick notes</h2>
      <p class="section-sub">Private reminders between classes (local to this engine)</p>
      <div class="note-form">
        <textarea id="note-input" placeholder="What froze today? What pattern stuck?"></textarea>
        <button type="button" class="btn btn-metal" id="btn-save-note" style="justify-content:center;width:fit-content;"><i class="ti ti-device-floppy"></i> Save note</button>
      </div>
      ${mine.map((n) => `
        <div class="session-log-item">
          <div class="sli-header">You · ${new Date(n.ts).toLocaleString()}</div>
          <div class="sli-text">${n.text}</div>
        </div>
      `).join('') || '<p class="section-sub">No personal notes yet.</p>'}
    </div>
    <div class="portal-section">
      <h2 class="section-title">Trainer session notes</h2>
      <p class="section-sub">Written by your trainer in the subengine</p>
      ${trainerNotes.map((n) => `
        <div class="session-log-item">
          <div class="sli-header">Trainer · ${new Date(n.ts).toLocaleString()}</div>
          <div class="sli-text">${n.text}</div>
        </div>
      `).join('') || '<p class="section-sub">No trainer notes yet.</p>'}
    </div>
  `;
  document.getElementById('btn-save-note')?.addEventListener('click', () => {
    const text = document.getElementById('note-input').value.trim();
    if (!text) {
      toast('Write something first.');
      return;
    }
    student.studentNotes = student.studentNotes || [];
    student.studentNotes.unshift({ ts: new Date().toISOString(), text });
    persist();
    toast('Note saved.');
    renderSessions();
    showView('sessions');
  });
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
