/**
 * Assign "Cómo usar Kamuk" course to TOEIC Seniors + news + Greco roster tip.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

const COURSE_URL = 'https://studioinfinitycr.com/kamuk/training-book/como-usar/index.html?v=20260924';
const COURSE_TITLE = 'Curso: Cómo usar Kamuk (Seniors)';

async function upsert(table, id, data) {
  const r = await fetch(KAM_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: KAM_KEY,
      Authorization: 'Bearer ' + KAM_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error(table + ' ' + id + ' ' + r.status + ' ' + (await r.text()));
}

function isToeicCohort(d) {
  if (!d) return false;
  if (d.path_custom === 'toeic-undecimo') return true;
  const program = String((d.info && d.info.program) || '');
  const cohort = String((d.info && d.info.cohort) || '');
  return /TOEIC/i.test(program) || /TOEIC/i.test(cohort) || String(d.id || '').includes('KAM-T11');
}

async function main() {
  const newsId = 'NEWS-KAMUK-COMO-USAR';
  await upsert('kamuk_sessions', newsId, {
    title: 'Curso obligatorio: Cómo usar Kamuk',
    body:
      'Estudiantes Seniors y Robert Greco: completen el curso Cómo usar Kamuk (portal, Alice, Claire, Training Book vino).\n\n' +
      'Estudiantes: ' +
      COURSE_URL +
      '\nTrainer: ' +
      COURSE_URL +
      '&track=trainer\n\nQuiz mínimo 3/4.',
    dept: 'training',
    author: 'Robert Greco',
    ts: new Date().toISOString()
  });
  console.log('News OK', newsId);

  const rosterId = 'ROSTER-USR-KAM-GREGO';
  const rosterGet = await fetch(KAM_URL + '/rest/v1/kamuk_sessions?id=eq.' + rosterId + '&select=data', {
    headers: { apikey: KAM_KEY, Authorization: 'Bearer ' + KAM_KEY }
  });
  const rosterRows = await rosterGet.json();
  const roster = (rosterRows[0] && rosterRows[0].data) || {
    userId: 'USR-KAM-GREGO',
    name: 'Robert Grego',
    email: 'robert.grego@kamuk.cr'
  };
  roster.exp = 'Trainer · Kamuk TOEIC Seniors';
  roster.bio =
    (roster.bio || '') +
    (String(roster.bio || '').includes('Cómo usar Kamuk')
      ? ''
      : '\n\nCurso onboarding: ' + COURSE_URL + '&track=trainer');
  roster.courseComoUsar = COURSE_URL + '&track=trainer';
  await upsert('kamuk_sessions', rosterId, roster);
  console.log('Roster Greco tip OK');

  // Ensure Grego stays trainer (never master)
  await upsert('kamuk_users', 'USR-KAM-GREGO', {
    id: 'USR-KAM-GREGO',
    email: 'robert.grego@kamuk.cr',
    pass: 'KmRg#8d2c4a',
    name: 'Robert Grego',
    role: 'trainer',
    department: 'training',
    status: 'active',
    kamukAudit: true,
    fullEngagement: true,
    canViewPractice: true,
    canViewConnectionTime: true
  });
  console.log('Grego role=trainer');

  const list = await fetch(KAM_URL + '/rest/v1/kamuk_students?select=id,data', {
    headers: { apikey: KAM_KEY, Authorization: 'Bearer ' + KAM_KEY }
  }).then((r) => r.json());

  let n = 0;
  for (const row of list) {
    const d = row.data || {};
    if (!isToeicCohort(d)) continue;
    if (!Array.isArray(d.trainingBook)) d.trainingBook = [];
    const already = d.trainingBook.some((ex) => ex && ex.title === COURSE_TITLE);
    if (!already) {
      d.trainingBook.push({
        id: 'EX-COMO-USAR-' + row.id,
        title: COURSE_TITLE,
        kpi: 'Onboarding',
        objective: 'Completar el curso Cómo usar Kamuk (quiz ≥ 3/4).',
        script: 'Abrir Recursos → Curso Cómo usar Kamuk, o ' + COURSE_URL,
        studentTask: 'Hacé el track Estudiante, quiz mínimo 3/4, y avisá a Greco cuando termines.',
        freq: '1× esta semana',
        type: 'custom',
        source: 'como-usar-seed',
        week: new Date().toISOString().split('T')[0],
        assignedAt: new Date().toISOString(),
        assignedBy: 'Robert Grego',
        trainerCode: 'RG01',
        courseUrl: COURSE_URL
      });
    }
    d.onboardingCourse = 'como-usar-kamuk';
    d.onboardingCourseUrl = COURSE_URL;
    if (!Array.isArray(d.notes)) d.notes = [];
    const noteText = 'Asignado curso Cómo usar Kamuk (Seniors)';
    if (!d.notes.some((x) => x && x.text === noteText)) {
      d.notes.push({ date: new Date().toISOString(), trainer: 'Robert Grego', text: noteText, phase: 1 });
    }
    await upsert('kamuk_students', row.id, d);
    n++;
  }
  console.log('Students assigned:', n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
