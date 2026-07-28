import { loadStore, setSession, verifyTrainerPin } from './tb-store.js';

const studentSelect = document.getElementById('student-select');
const modeStudent = document.getElementById('mode-student');
const modeTrainer = document.getElementById('mode-trainer');

function fillStudents() {
  const { students } = loadStore();
  studentSelect.innerHTML = students.map((s) =>
    `<option value="${s.id}">${s.name} · Phase ${s.phase}</option>`
  ).join('');
}

document.getElementById('show-trainer').addEventListener('click', () => {
  modeStudent.hidden = true;
  modeTrainer.hidden = false;
});
document.getElementById('show-student').addEventListener('click', () => {
  modeTrainer.hidden = true;
  modeStudent.hidden = false;
});

document.getElementById('btn-student').addEventListener('click', () => {
  const id = studentSelect.value;
  if (!id) {
    document.getElementById('err-student').textContent = 'Pick a student.';
    return;
  }
  setSession({ role: 'student', studentId: id });
  location.href = 'student.html';
});

document.getElementById('btn-trainer').addEventListener('click', () => {
  const pin = document.getElementById('trainer-pin').value;
  if (!verifyTrainerPin(pin)) {
    document.getElementById('err-trainer').textContent = 'Wrong PIN.';
    return;
  }
  setSession({ role: 'trainer', at: Date.now() });
  location.href = 'trainer.html';
});

fillStudents();

try {
  const openTrainer = location.hash === '#trainer' || sessionStorage.getItem('gospanol-open-trainer') === '1';
  if (openTrainer) {
    sessionStorage.removeItem('gospanol-open-trainer');
    modeStudent.hidden = true;
    modeTrainer.hidden = false;
  }
} catch (_) {}
