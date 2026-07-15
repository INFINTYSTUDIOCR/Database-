/**
 * Alice Companion Premium — WhatsApp activation + restore by email.
 * Card checkout is optional/secondary; primary path is WhatsApp.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'alice_premium_token';
  var EXPIRES_KEY = 'alice_premium_expires';
  var EMAIL_KEY = 'alice_premium_email';
  var BACKEND = typeof DEMO_BACKEND !== 'undefined' ? DEMO_BACKEND : 'https://alice-by-infinity.onrender.com';

  function getToken() {
    try {
      var exp = localStorage.getItem(EXPIRES_KEY);
      if (exp && Date.now() > new Date(exp).getTime()) {
        clearToken();
        return null;
      }
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function saveToken(token, expiresAt, email) {
    try {
      localStorage.setItem(STORAGE_KEY, token);
      if (expiresAt) localStorage.setItem(EXPIRES_KEY, expiresAt);
      if (email) localStorage.setItem(EMAIL_KEY, String(email).trim().toLowerCase());
    } catch (e) {}
  }

  function clearToken() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRES_KEY);
    } catch (e) {}
  }

  function savedEmail() {
    try { return localStorage.getItem(EMAIL_KEY) || ''; } catch (e) { return ''; }
  }

  function isActiveLocal() {
    return !!getToken();
  }

  function payload() {
    var t = getToken();
    return t ? { premiumToken: t } : {};
  }

  async function fetchConfig() {
    var r = await fetch(BACKEND + '/billing/config');
    if (!r.ok) throw new Error('config_unavailable');
    return r.json();
  }

  function askEmail(defaultEmail) {
    var email = window.prompt(
      'Tu email (el mismo que le diste por WhatsApp al activar):',
      defaultEmail || savedEmail() || ''
    );
    if (email == null) return null;
    email = String(email).trim().toLowerCase();
    if (!email || email.indexOf('@') < 0) {
      alert('Necesitamos un email válido.');
      return null;
    }
    try { localStorage.setItem(EMAIL_KEY, email); } catch (e) {}
    return email;
  }

  async function startCheckout(email) {
    email = email || askEmail();
    if (!email) return null;
    var origin = location.origin;
    var path = location.pathname.indexOf('try-alice') >= 0 ? location.pathname : '/try-alice.html';
    var body = {
      email: email,
      successUrl: origin + path + '?checkout={CHECKOUT_SESSION_ID}',
      cancelUrl: origin + path + '?checkout=cancel'
    };
    var r = await fetch(BACKEND + '/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    var data = await r.json();
    if (!r.ok) throw data;
    if (data.url) {
      location.href = data.url;
      return data;
    }
    throw { error: data.error || 'checkout_failed', message: data.message };
  }

  async function activateFromUrl() {
    var params = new URLSearchParams(location.search);
    var checkout = params.get('checkout');
    if (!checkout || checkout === 'cancel') {
      if (checkout === 'cancel') {
        params.delete('checkout');
        history.replaceState({}, '', location.pathname + (params.toString() ? '?' + params.toString() : ''));
      }
      return null;
    }
    var r = await fetch(BACKEND + '/billing/activate?checkout=' + encodeURIComponent(checkout));
    var data = await r.json();
    if (!r.ok || !data.premiumToken) return { error: data.error || 'activate_failed' };
    saveToken(data.premiumToken, data.expiresAt, savedEmail());
    params.delete('checkout');
    var clean = location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState({}, '', clean);
    return data;
  }

  async function restoreAccess(email) {
    email = email || askEmail(savedEmail());
    if (!email) return null;
    var r = await fetch(BACKEND + '/billing/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });
    var data = await r.json();
    if (!r.ok || !data.premiumToken) {
      var msg = data.error === 'expired'
        ? 'Tu acceso venció. Escribinos por WhatsApp para renovar.'
        : data.error === 'not_found'
          ? 'No encontramos acceso con ese email. Usá el mismo que diste por WhatsApp.'
          : 'No se pudo recuperar. Escribinos por WhatsApp.';
      alert(msg);
      return null;
    }
    saveToken(data.premiumToken, data.expiresAt, email);
    return data;
  }

  async function verifyRemote() {
    var token = getToken();
    if (!token) return false;
    try {
      var r = await fetch(BACKEND + '/billing/status?token=' + encodeURIComponent(token));
      if (!r.ok) return false;
      var data = await r.json();
      if (!data.active) {
        clearToken();
        return false;
      }
      if (data.expiresAt) saveToken(token, data.expiresAt);
      return true;
    } catch (e) {
      return isActiveLocal();
    }
  }

  function renderUpgradeButton(container, opts) {
    if (!container) return;
    opts = opts || {};
    fetchConfig().then(function (cfg) {
      var active = isActiveLocal();
      if (active) {
        container.innerHTML = '<div class="alice-premium-badge"><i class="ti ti-crown"></i> Alice Companion activa — ' +
          (cfg.days || 30) + ' días ilimitados</div>';
        return;
      }
      var price = cfg.crcHint || '₡24.500 · 30 días';
      var wa = cfg.whatsapp || 'https://wa.me/50660060981?text=' + encodeURIComponent('Hola! Quiero Alice Companion. Mi email: ');
      var html = '<div class="alice-premium-offer">' +
        '<strong>Alice Companion Premium</strong> · ' + price +
        '<span class="alice-premium-hint">Escribinos por WhatsApp con tu email. Te activamos el mismo día.</span>' +
        '</div>';
      html += '<a class="demo-cta-wa btn-premium-checkout" href="' + wa + '" target="_blank" rel="noopener" style="display:inline-flex;text-decoration:none;">' +
        '<i class="ti ti-brand-whatsapp"></i> ' + (opts.waLabel || 'Activar por WhatsApp') + '</a>';
      html += '<button type="button" class="btn-premium-restore" id="btn-alice-restore" style="display:block;margin-top:10px;background:transparent;border:0;color:inherit;text-decoration:underline;cursor:pointer;font-size:13px;">' +
        'Ya me activaron — entrar con mi email</button>';
      container.innerHTML = html;

      var restoreBtn = document.getElementById('btn-alice-restore');
      if (restoreBtn) {
        restoreBtn.onclick = function () {
          restoreAccess().then(function (data) {
            if (data && data.premiumToken) {
              alert('¡Listo! Acceso recuperado. Ya podés practicar sin límites.');
              location.reload();
            }
          });
        };
      }
    }).catch(function () {
      container.innerHTML = '<a class="demo-cta-wa" href="https://wa.me/50660060981?text=Hola!%20Quiero%20Alice%20Companion" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Alice Companion por WhatsApp</a>' +
        '<button type="button" id="btn-alice-restore" style="display:block;margin-top:10px;background:transparent;border:0;text-decoration:underline;cursor:pointer;font-size:13px;">Ya me activaron — entrar con mi email</button>';
      var restoreBtn = document.getElementById('btn-alice-restore');
      if (restoreBtn) {
        restoreBtn.onclick = function () {
          restoreAccess().then(function (data) {
            if (data && data.premiumToken) location.reload();
          });
        };
      }
    });
  }

  global.AliceBilling = {
    getToken: getToken,
    saveToken: saveToken,
    clearToken: clearToken,
    isActiveLocal: isActiveLocal,
    payload: payload,
    fetchConfig: fetchConfig,
    startCheckout: startCheckout,
    activateFromUrl: activateFromUrl,
    restoreAccess: restoreAccess,
    verifyRemote: verifyRemote,
    renderUpgradeButton: renderUpgradeButton
  };
})(typeof window !== 'undefined' ? window : global);
