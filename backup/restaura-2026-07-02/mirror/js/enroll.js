function submitEnroll(programName) {
  var name = (document.getElementById('en-name') || {}).value || '';
  var email = (document.getElementById('en-email') || {}).value || '';
  var phone = (document.getElementById('en-phone') || {}).value || '';
  var schedule = (document.getElementById('en-schedule') || {}).value || '';
  var note = (document.getElementById('en-note') || {}).value || '';
  if (!name.trim() || !phone.trim()) {
    alert('Please complete name and WhatsApp.');
    return;
  }
  var msg = 'Hello! I want to join *' + programName + '* (Infinity Studio).\n\n'
    + 'Name: ' + name.trim() + '\n'
    + 'Email: ' + (email.trim() || '—') + '\n'
    + 'WhatsApp: ' + phone.trim() + '\n'
    + 'Details: ' + (schedule || '—') + '\n'
    + 'Message: ' + (note.trim() || '—');
  window.open('https://wa.me/50660060981?text=' + encodeURIComponent(msg), '_blank');
}
