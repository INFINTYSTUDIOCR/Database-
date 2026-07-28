import {
  findStudentByCredentials,
  setSession,
  verifyTrainerPin,
  clearSession
} from './tb-store.js';

clearSession();

const modeStudent = document.getElementById('mode-student');
const modeTrainer = document.getElementById('mode-trainer');

document.getElementById('show-trainer').addEventListener('click', () => {
  modeStudent.hidden = true;
  modeTrainer.hidden = false;
});
document.getElementById('show-student').addEventListener('click', () => {
  modeTrainer.hidden = true;
  modeStudent.hidden = false;
});

document.getElementById('btn-student').addEventListener('click', () => {
  const user = document.getElementById('student-user').value;
  const pass = document.getElementById('student-pass').value;
  const err = document.getElementById('err-student');
  const student = findStudentByCredentials(user, pass);
  if (!student) {
    err.textContent = 'Access denied. Wrong credentials or no account assigned.';
    return;
  }
  err.textContent = '';
  setSession({ role: 'student', studentId: student.id });
  location.href = 'student.html';
});

document.getElementById('student-pass').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-student').click();
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

document.getElementById('trainer-pin').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-trainer').click();
});

try {
  const openTrainer = location.hash === '#trainer' || sessionStorage.getItem('gospanol-open-trainer') === '1';
  if (openTrainer) {
    sessionStorage.removeItem('gospanol-open-trainer');
    modeStudent.hidden = true;
    modeTrainer.hidden = false;
  }
} catch (_) {}
