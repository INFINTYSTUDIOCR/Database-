function submitEnroll(programName) {
  var name = (document.getElementById('en-name') || {}).value || '';
  var email = (document.getElementById('en-email') || {}).value || '';
  var phone = (document.getElementById('en-phone') || {}).value || '';
  var schedule = (document.getElementById('en-schedule') || {}).value || '';
  var note = (document.getElementById('en-note') || {}).value || '';
  var es = (document.documentElement.lang || 'es') === 'es';
  if (!name.trim() || !phone.trim()) {
    alert(es ? 'Completá nombre y WhatsApp.' : 'Please complete name and WhatsApp.');
    return;
  }
  var msg = es
    ? '¡Hola! Quiero *' + programName + '* (Infinity Studio CR).\n\n'
      + 'Nombre: ' + name.trim() + '\n'
      + 'Correo: ' + (email.trim() || '—') + '\n'
      + 'WhatsApp: ' + phone.trim() + '\n'
      + 'Interés: ' + (schedule || '—') + '\n'
      + 'Mensaje: ' + (note.trim() || '—')
    : 'Hello! I want to join *' + programName + '* (Infinity Studio).\n\n'
      + 'Name: ' + name.trim() + '\n'
      + 'Email: ' + (email.trim() || '—') + '\n'
      + 'WhatsApp: ' + phone.trim() + '\n'
      + 'Details: ' + (schedule || '—') + '\n'
      + 'Message: ' + (note.trim() || '—');
  window.open('https://wa.me/50660060981?text=' + encodeURIComponent(msg), '_blank');
}
