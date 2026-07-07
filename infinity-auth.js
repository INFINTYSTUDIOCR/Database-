/**
 * Infinity API auth — JWT for Student Portal, Engine, Nexora.
 * Token in sessionStorage + localStorage (popup windows).
 */
var INFINITY_API = 'https://alice-by-infinity.onrender.com';
var AUTH_TOKEN_KEY = 'infinity_auth_token';
var AUTH_EXP_KEY = 'infinity_auth_exp';

function getAuthToken() {
  var t = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
  if (!t) return null;
  var exp = parseInt(sessionStorage.getItem(AUTH_EXP_KEY) || localStorage.getItem(AUTH_EXP_KEY) || '0', 10);
  if (exp && Date.now() > exp) {
    clearAuthToken();
    return null;
  }
  return t;
}

function setAuthToken(token, expiresInSec) {
  var exp = Date.now() + (expiresInSec || 86400) * 1000;
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_EXP_KEY, String(exp));
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_EXP_KEY, String(exp));
}

function clearAuthToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_EXP_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXP_KEY);
}

function authHeaders(extra) {
  var h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
  var t = getAuthToken();
  if (t) h.Authorization = 'Bearer ' + t;
  return h;
}

async function infinityLogin(user, password, role, opts) {
  opts = opts || {};
  var r = await fetch(INFINITY_API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: user, password: password, role: role })
  });
  var text = await r.text();
  var d;
  try { d = JSON.parse(text); } catch (e) {
    if (opts.silent) return null;
    var err = new Error('El servidor de acceso no respondió correctamente. Esperá unos segundos e intentá de nuevo.');
    err.status = r.status;
    throw err;
  }
  if (!r.ok) {
    if (opts.silent) return null;
    var err = new Error(d.error || 'Login failed');
    err.status = r.status;
    err.data = d;
    throw err;
  }
  setAuthToken(d.token, d.expiresIn);
  return d;
}

async function infinityFetch(path, options) {
  options = options || {};
  var headers = authHeaders(options.headers);
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  options.headers = headers;
  var url = path.indexOf('http') === 0 ? path : INFINITY_API + path;
  var r = await fetch(url, options);
  if (r.status === 401) clearAuthToken();
  if (r.status === 403) {
    try {
      var d = await r.clone().json();
      if (d && (d.code === 'ACCOUNT_SUSPENDED' || d.code === 'NEXORA_DISABLED' || d.error === 'Account suspended')) {
        clearAuthToken();
      }
    } catch (e) { /* ignore */ }
  }
  return r;
}

function requireAuthOrRedirect(loginPath) {
  if (!getAuthToken()) {
    if (loginPath) window.location.href = loginPath;
    return false;
  }
  return true;
}
