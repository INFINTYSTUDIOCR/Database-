(function () {
  var params = new URLSearchParams(location.search);
  var motivo = params.get('motivo');
  if (!motivo) return;
  var banners = {
    trabajo: 'Llegaste porque querés <strong>trabajar o pasar una entrevista</strong> en inglés. Este camino te lleva desde tu nivel real hasta operar bajo presión.',
    negocio: 'Llegaste porque tu <strong>negocio no puede depender de traductores</strong>. Este camino prioriza negociar y operar en inglés con velocidad.',
    familia: 'Llegaste porque querés <strong>hablar con tu familia</strong> — nietos, hijos, familiares en EE.UU. Empezamos desde donde estés, sin vergüenza.',
    bloqueo: 'Llegaste porque <strong>entendés pero te bloqueás al hablar</strong>. Este camino instala inglés bajo presión real — no más gramática en vacío.'
  };
  var text = banners[motivo];
  if (!text) return;
  var el = document.getElementById('path-motivo-banner');
  if (el) {
    el.innerHTML = text;
    el.classList.add('show');
  }
})();
