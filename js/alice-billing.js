/**
 * Alice Premium — checkout + local pass token.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'alice_premium_token';
  var EXPIRES_KEY = 'alice_premium_expires';
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

  function saveToken(token, expiresAt) {
    try {
      localStorage.setItem(STORAGE_KEY, token);
      if (expiresAt) localStorage.setItem(EXPIRES_KEY, expiresAt);
    } catch (e) {}
  }

  function clearToken() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRES_KEY);
    } catch (e) {}
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

  async function startCheckout(email) {
    var origin = location.origin;
    var body = {
      email: email || undefined,
      successUrl: origin + '/try-alice.html?checkout={CHECKOUT_SESSION_ID}',
      cancelUrl: origin + '/try-alice.html?checkout=cancel'
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
    if (!checkout || checkout === 'cancel') return null;
    var r = await fetch(BACKEND + '/billing/activate?checkout=' + encodeURIComponent(checkout));
    var data = await r.json();
    if (!r.ok || !data.premiumToken) return null;
    saveToken(data.premiumToken, data.expiresAt);
    params.delete('checkout');
    var clean = location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState({}, '', clean);
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
        container.innerHTML = '<div class="alice-premium-badge"><i class="ti ti-crown"></i> Alice Premium active</div>';
        return;
      }
      var price = cfg.priceLabel || '$19.99';
      var html = '<div class="alice-premium-offer">' +
        '<strong>Alice Premium</strong> · ' + cfg.days + ' days unlimited · ' + price +
        '<span class="alice-premium-hint">' + (cfg.crcHint || '') + '</span>' +
        '</div>';
      if (cfg.enabled) {
        html += '<button type="button" class="btn-premium-checkout" id="btn-alice-premium">' +
          '<i class="ti ti-credit-card"></i> ' + (opts.checkoutLabel || 'Pay with card — unlock now') +
          '</button>';
      } else {
        html += '<p class="alice-premium-hint">Card checkout opens soon — WhatsApp works today.</p>';
      }
      html += '<a class="demo-cta-wa" href="' + (cfg.whatsapp || 'https://wa.me/50660060981') + '" target="_blank" rel="noopener">' +
        '<i class="ti ti-brand-whatsapp"></i> ' + (opts.waLabel || 'Pay via WhatsApp') + '</a>';
      container.innerHTML = html;
      var btn = document.getElementById('btn-alice-premium');
      if (btn) {
        btn.onclick = function () {
          btn.disabled = true;
          btn.textContent = 'Opening checkout…';
          startCheckout(opts.email).catch(function (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ti ti-credit-card"></i> Pay with card — unlock now';
            alert(err.message || 'Checkout unavailable. Use WhatsApp.');
          });
        };
      }
    }).catch(function () {
      container.innerHTML = '<a class="demo-cta-wa" href="https://wa.me/50660060981?text=Hola!%20Quiero%20Alice%20Premium" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Get Alice Premium</a>';
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
    verifyRemote: verifyRemote,
    renderUpgradeButton: renderUpgradeButton
  };
})(typeof window !== 'undefined' ? window : global);
