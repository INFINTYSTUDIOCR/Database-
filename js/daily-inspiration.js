(function(global){
  'use strict';

  var MESSAGES = [
    { text: 'Sos pieza clave de este equipo. Cada sesión tuya mueve el propósito de Infinity hacia adelante.', sub: 'Que Dios bendiga tu camino hoy.' },
    { text: 'Tu constancia inspira. No subestimes el impacto que tenés en quienes entrenan y aprenden a tu lado.', sub: 'Seguí adelante — Él va contigo.' },
    { text: 'En Infinity creemos en vos. Tu esfuerzo de hoy construye el profesional que el mundo real necesita.', sub: 'Bendiciones en cada paso.' },
    { text: 'Determinación + entrenamiento = resultados. Vos elegís aparecer, y eso ya te hace diferente.', sub: 'Que tu día esté lleno de luz.' },
    { text: 'Cada trainer y cada estudiante suma. Sin vos, el ecosistema no sería el mismo.', sub: 'Dios guía tu camino.' },
    { text: 'Hoy es un buen día para avanzar un paso más. Lo que practiques hoy, mañana lo vas a usar.', sub: 'Confiá en el proceso — y en tu fe.' },
    { text: 'Studio Infinity CR existe gracias a personas como vos: comprometidas, valientes y con ganas de crecer.', sub: 'Que Dios te dé sabiduría y paz.' },
    { text: 'Tu voz importa. Tu progreso importa. Vos importás para esta organización.', sub: 'Bendito seas en tu jornada.' },
    { text: 'El entrenamiento real no es fácil — por eso valoramos tu presencia. Seguí, estamos con vos.', sub: 'Que el Señor abra puertas en tu camino.' },
    { text: 'Infinity no es solo inglés: es capacidad, carácter y confianza. Vos estás formando las tres.', sub: 'Que Dios multiplique tu esfuerzo.' },
    { text: 'Gracias por ser parte de este equipo. Tu dedicación empuja a todos hacia adelante.', sub: 'Bendiciones hoy y siempre.' },
    { text: 'Los grandes profesionales se forjan sesión a sesión. Vos ya estás en ese camino.', sub: 'Que Dios te fortalezca.' },
    { text: 'Recordá: no estás solo en esto. Tenés un equipo, un método y un propósito claro.', sub: 'Que tu fe te sostenga hoy.' },
    { text: 'Tu trainer confía en vos. Nosotros confiamos en vos. Ahora seguí confiando en vos mismo.', sub: 'Dios bendiga tus decisiones.' },
    { text: 'Cada día de entrenamiento es una inversión en tu futuro. Gracias por elegir Infinity.', sub: 'Que camines con propósito y paz.' },
    { text: 'Sos determinante para nosotros: sin estudiantes y trainers como vos, Infinity no existiría.', sub: 'Que Dios cuide tu camino.' },
    { text: 'Hoy podés ser 1% mejor que ayer. Ese 1%, acumulado, cambia vidas — incluida la tuya.', sub: 'Bendiciones en tu entrenamiento.' },
    { text: 'Tu zona de confort se agranda cada vez que aparecés. Eso es liderazgo personal.', sub: 'Que el Señor te dé valor.' },
    { text: 'Infinity es familia profesional. Vos pertenecés aquí. Tu crecimiento es nuestro orgullo.', sub: 'Que Dios te bendiga abundantemente.' },
    { text: 'Salí adelante con fe y trabajo. Estamos construyendo algo grande — juntos.', sub: 'Que tu camino esté bajo Su cuidado.' },
    { text: 'Para el equipo Infinity, vos no sos un número: sos una historia de esfuerzo y superación.', sub: 'Bendiciones en cada paso que des hoy.' },
    { text: 'El mundo real espera profesionales preparados. Gracias por entrenar como si ya estuvieras ahí.', sub: 'Que Dios ilumine tu mente y tu corazón.' },
    { text: 'Tu presencia eleva el estándar del equipo. Seguí mostrando el camino con tu ejemplo.', sub: 'Que Dios guarde tu camino.' },
    { text: 'Hoy recordá: sos capaz, sos importante y sos parte de algo que trasciende un aula.', sub: 'Bendito el camino que recorrés.' },
    { text: 'Infinity cree en entrenar personas, no perfiles. Vos tenés nombre, historia y futuro.', sub: 'Que Dios te acompañe siempre.' },
    { text: 'Cada sesión completada es victoria. Celebrá el avance — y seguí con determinación.', sub: 'Que tu fe y tu esfuerzo se multipliquen.' },
    { text: 'Trainers y estudiantes: ustedes son el corazón de Studio Infinity CR. Gracias por estar.', sub: 'Que Dios bendiga sus caminos hoy.' },
    { text: 'No importa qué tan difícil se sienta hoy: aparecer ya es ganar. Y vos apareciste.', sub: 'Seguí adelante — bendiciones.' },
    { text: 'Tu potencial es mayor que cualquier obstáculo de hoy. Entrenemos con esa verdad en mente.', sub: 'Que Dios te dé fuerza nueva.' },
    { text: 'Infinity existe para ver brillar personas como vos. Hoy brilla — aunque sea un poco más que ayer.', sub: 'Que Dios bendiga tu camino, hoy y siempre.' }
  ];

  var _pending = null;
  var _currentUserId = null;
  var _onClose = null;

  function pad(n){ return String(n).padStart(2, '0'); }

  function todayKey(userId){
    var d = new Date();
    return 'infinity_daily_inspire_' + (userId || 'guest') + '_' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dayIndex(){
    var start = new Date(new Date().getFullYear(), 0, 0);
    return Math.floor((Date.now() - start) / 86400000);
  }

  function alreadyShown(userId){
    try { return localStorage.getItem(todayKey(userId)) === '1'; } catch(e){ return false; }
  }

  function markShown(userId){
    try { localStorage.setItem(todayKey(userId), '1'); } catch(e){}
  }

  function isBlocked(){
    var termsPortal = document.getElementById('portal-terms-gate');
    if(termsPortal && termsPortal.style.display === 'flex') return true;
    var termsEngine = document.getElementById('modal-infinity-terms');
    if(termsEngine && termsEngine.classList.contains('show')) return true;
    var survey = document.getElementById('survey-modal');
    if(survey && survey.style.display === 'flex') return true;
    var nx = document.getElementById('nx-crm-modal');
    if(nx && nx.style.display === 'flex') return true;
    return false;
  }

  function ensureOverlay(){
    if(document.getElementById('daily-inspire-overlay')) return;
    var wrap = document.createElement('div');
    wrap.id = 'daily-inspire-overlay';
    wrap.className = 'daily-inspire-overlay';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = ''
      + '<div class="daily-tv" role="dialog" aria-labelledby="daily-inspire-label">'
      + '<div class="daily-tv-antenna" aria-hidden="true"></div>'
      + '<div class="daily-tv-body">'
      + '<div class="daily-tv-brand">Studio Infinity CR · Transmisión del día</div>'
      + '<div class="daily-tv-screen-wrap"><div class="daily-tv-screen">'
      + '<div class="daily-tv-label" id="daily-inspire-label">Mensaje del día</div>'
      + '<div class="daily-tv-text" id="daily-inspire-text"></div>'
      + '<div class="daily-tv-sub" id="daily-inspire-sub"></div>'
      + '</div></div>'
      + '<div class="daily-tv-knob-row" aria-hidden="true"><span class="daily-tv-knob"></span><span class="daily-tv-knob"></span></div>'
      + '<button type="button" class="daily-tv-btn" id="daily-inspire-close">¡Gracias! · Continuar</button>'
      + '</div></div>';
    document.body.appendChild(wrap);
    document.getElementById('daily-inspire-close').addEventListener('click', function(){
      close();
    });
    wrap.addEventListener('click', function(e){
      if(e.target === wrap) close();
    });
  }

  function getMessage(audience){
    var idx = dayIndex() % MESSAGES.length;
    var msg = MESSAGES[idx];
    if(audience === 'trainer'){
      return {
        text: msg.text.replace(/estudiante/gi, 'equipo').replace(/Estudiantes/g, 'Equipo'),
        sub: msg.sub
      };
    }
    return msg;
  }

  function show(opts){
    opts = opts || {};
    if(alreadyShown(opts.userId)) return finishClose();
    if(isBlocked()){
      _pending = opts;
      setTimeout(function(){ show(opts); }, 700);
      return;
    }
    _pending = null;
    _currentUserId = opts.userId || 'guest';
    _onClose = typeof opts.onClose === 'function' ? opts.onClose : null;

    ensureOverlay();
    var msg = getMessage(opts.audience || 'student');
    var greeting = opts.name ? ('Hola, ' + opts.name.split(' ')[0] + '. ') : '';
    document.getElementById('daily-inspire-text').textContent = greeting + msg.text;
    document.getElementById('daily-inspire-sub').textContent = msg.sub;
    var overlay = document.getElementById('daily-inspire-overlay');
    overlay.classList.add('is-visible');
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
  }

  function finishClose(){
    var cb = _onClose;
    _onClose = null;
    _currentUserId = null;
    if(cb) try { cb(); } catch(e){}
  }

  function close(){
    if(_currentUserId) markShown(_currentUserId);
    var overlay = document.getElementById('daily-inspire-overlay');
    if(overlay){
      overlay.classList.remove('is-visible');
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
    finishClose();
  }

  function schedule(opts){
    opts = opts || {};
    if(alreadyShown(opts.userId)) {
      if(typeof opts.onClose === 'function') opts.onClose();
      return;
    }
    setTimeout(function(){ show(opts); }, opts.delay || 650);
  }

  global.DailyInspiration = {
    schedule: schedule,
    show: show,
    close: close,
    alreadyShown: alreadyShown
  };
})(typeof window !== 'undefined' ? window : this);
