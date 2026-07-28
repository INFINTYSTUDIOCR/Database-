/**
 * Spanol TB Engine — local store (v1).
 * Sister project GOSpanol.
 */
const STORE_KEY = 'spanol-tb-engine-v1';
const SESSION_KEY = 'spanol-tb-session-v1';
const TRAINER_PIN_DEFAULT = 'spanol';

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

function blankStudent(name) {
  return {
    id: uid(),
    name: name || 'Student',
    phase: 1,
    phaseLabel: 'Structure foundations',
    valeEnabled: false,
    kpis: { ig: 55, st: 48, rc: 52, ps: 50, rs: 54 },
    exercises: [
      {
        id: uid(),
        type: 'Speaking · estructura',
        title: 'Verb-first — soltá el “yo” innecesario',
        meta: 'KPI: Structure',
        status: 'progress',
        objective: 'Producir 8 oraciones sin yo de más bajo presión.',
        bad: 'Yo voy a la oficina. Yo estoy cansado.',
        good: 'Voy a la oficina. Estoy cansado.'
      },
      {
        id: uid(),
        type: 'Ser / estar',
        title: 'Identidad vs estado — 12 switches',
        meta: 'KPI: Structure',
        status: 'pending',
        objective: 'Elegir ser o estar sin dudar.',
        bad: 'Soy en la oficina / Estoy ingeniero',
        good: 'Estoy en la oficina / Soy ingeniero'
      },
      {
        id: uid(),
        type: 'Conectores',
        title: 'Uní dos ideas: porque / entonces / aunque / o sea',
        meta: 'KPI: Ideas + Structure',
        status: 'pending',
        objective: 'Cada turno = idea + conector + idea.',
        bad: 'Estoy cansado. Dormí poco.',
        good: 'Estoy cansado porque dormí poco.'
      },
      {
        id: uid(),
        type: 'Juego oral',
        title: '3 minutos con Vale — una corrección máxima',
        meta: 'Requiere Vale ON',
        status: 'pending',
        objective: 'Contar el día en español; Vale corrige una sola cosa.',
        bad: '(silencio / inglés)',
        good: 'Hoy fue raro porque… entonces…'
      }
    ],
    plan: [
      { day: 'Lunes', item: 'Clase con trainer — verb-first' },
      { day: 'Miércoles', item: 'Speed drills EN→ES (10 min)' },
      { day: 'Viernes', item: 'Refuerzo Vale (si ON) + review' }
    ],
    notes: [
      { ts: new Date().toISOString(), text: 'Entrada: entiende español; se congela al hablar. Foco: estructura oral.' }
    ],
    videos: [
      { title: 'Escenario: pedir ayuda en la oficina', meta: 'Simulación corta · ES', questions: ['¿Qué pediste?', '¿Usaste un conector?'] }
    ],
    createdAt: new Date().toISOString()
  };
}

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw && Array.isArray(raw.students)) return raw;
  } catch (_) {}
  const demo = blankStudent('Alex Rivera');
  demo.valeEnabled = true;
  const store = { students: [demo], trainerPin: TRAINER_PIN_DEFAULT };
  saveStore(store);
  return store;
}

function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function getStudent(id) {
  return loadStore().students.find((s) => s.id === id) || null;
}

function upsertStudent(student) {
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
  upsertStudent,
  deleteStudent,
  setSession,
  getSession,
  clearSession,
  verifyTrainerPin,
  TRAINER_PIN_DEFAULT
};
