/**
 * GOSpanol TB Engine store — no public demos, no open access.
 * Students exist only when a trainer creates them with credentials.
 */
const STORE_KEY = 'spanol-tb-engine-v2';
const SESSION_KEY = 'spanol-tb-session-v2';
const TRAINER_PIN_DEFAULT = 'spanol';
const LEGACY_KEYS = ['spanol-tb-engine-v1', 'spanol-tb-session-v1'];

const BLOCKED_DEMO_NAMES = [
  'alex rivera',
  'juan rivera',
  'johnny rivera',
  'demo student',
  'student demo'
];

const DEFAULT_DRILLS = [
  { es: 'Voy a la oficina', en: 'I go to the office', id: 'd1' },
  { es: 'Estoy cansado porque dormí poco', en: 'I am tired because I slept little', id: 'd2' },
  { es: 'Soy ingeniero', en: 'I am an engineer', id: 'd3' },
  { es: 'Esto es para el cliente', en: 'This is for the client', id: 'd4' },
  { es: 'Se lo di ayer', en: 'I gave it to him/her yesterday', id: 'd5' },
  { es: 'Aunque llueva, salgo', en: 'Even if it rains, I go out', id: 'd6' }
];

function uid() {
  return 's_' + Math.random().toString(36).slice(2, 9);
}

function isBlockedDemo(student) {
  const name = String(student?.name || '').trim().toLowerCase();
  if (BLOCKED_DEMO_NAMES.includes(name)) return true;
  if (name.includes('rivera') && (name.includes('alex') || name.includes('juan'))) return true;
  return false;
}

function blankStudent(name) {
  return {
    id: uid(),
    name: name || 'Student',
    portalUser: '',
    portalPass: '',
    phase: 1,
    phaseLabel: 'Structure foundations',
    valeEnabled: false,
    kpis: { ig: 40, st: 40, rc: 40, ps: 40, rs: 40 },
    exercises: [],
    plan: [],
    notes: [],
    studentNotes: [],
    drillResults: {},
    videos: [],
    createdAt: new Date().toISOString()
  };
}

function emptyStore() {
  return { students: [], trainerPin: TRAINER_PIN_DEFAULT };
}

function scrubStudents(students) {
  return (students || []).filter((s) => s && s.id && !isBlockedDemo(s));
}

function loadStore() {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}

  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw && Array.isArray(raw.students)) {
      const cleaned = scrubStudents(raw.students);
      const store = {
        students: cleaned,
        trainerPin: raw.trainerPin || TRAINER_PIN_DEFAULT
      };
      if (cleaned.length !== raw.students.length) saveStore(store);
      return store;
    }
  } catch (_) {}

  const store = emptyStore();
  saveStore(store);
  return store;
}

function saveStore(store) {
  const safe = {
    students: scrubStudents(store.students),
    trainerPin: store.trainerPin || TRAINER_PIN_DEFAULT
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(safe));
}

function getStudent(id) {
  return loadStore().students.find((s) => s.id === id) || null;
}

function findStudentByCredentials(user, pass) {
  const u = String(user || '').trim().toLowerCase();
  const p = String(pass || '');
  if (!u || !p) return null;
  return (
    loadStore().students.find(
      (s) =>
        String(s.portalUser || '').trim().toLowerCase() === u &&
        String(s.portalPass || '') === p
    ) || null
  );
}

function upsertStudent(student) {
  if (isBlockedDemo(student)) {
    throw new Error('Demo student names are not allowed.');
  }
  const store = loadStore();
  const i = store.students.findIndex((s) => s.id === student.id);
  if (i >= 0) store.students[i] = student;
  else store.students.push(student);
  saveStore(store);
  return student;
}

function deleteStudent(id) {
  const store = loadStore();
  store.students = store.students.filter((s) => s.id !== id);
  saveStore(store);
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  try {
    localStorage.removeItem('spanol-tb-session-v1');
  } catch (_) {}
}

function verifyTrainerPin(pin) {
  const store = loadStore();
  return String(pin || '') === String(store.trainerPin || TRAINER_PIN_DEFAULT);
}

export {
  DEFAULT_DRILLS,
  blankStudent,
  loadStore,
  saveStore,
  getStudent,
  findStudentByCredentials,
  upsertStudent,
  deleteStudent,
  setSession,
  getSession,
  clearSession,
  verifyTrainerPin,
  TRAINER_PIN_DEFAULT
};
