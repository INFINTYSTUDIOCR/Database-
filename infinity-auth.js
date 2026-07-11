/**
 * Infinity API auth — JWT for Student Portal, Engine, Nexora.
 * Token in sessionStorage + localStorage (popup windows).
 * Session credentials (sessionStorage only) allow one silent re-login after 401
 * so a Render redeploy / cold start does not kill the whole voice session.
 */
var INFINITY_API = 'https://alice-by-infinity.onrender.com';
var AUTH_TOKEN_KEY = 'infinity_auth_token';
var AUTH_EXP_KEY = 'infinity_auth_exp';
var AUTH_USER_KEY = 'infinity_auth_user';
var AUTH_PASS_KEY = 'infinity_auth_pass';
var AUTH_ROLE_KEY = 'infinity_auth_role';
var _infinityReloginPromise = null;

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

function setAuthCredentials(user, password, role) {
  try {
    if (user) sessionStorage.setItem(AUTH_USER_KEY, String(user));
    if (password != null) sessionStorage.setItem(AUTH_PASS_KEY, String(password));
    if (role) sessionStorage.setItem(AUTH_ROLE_KEY, String(role));
  } catch (e) { /* private mode */ }
}

function clearAuthCredentials() {
  try {
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_PASS_KEY);
    sessionStorage.removeItem(AUTH_ROLE_KEY);
  } catch (e) { /* ignore */ }
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
  setAuthCredentials(user, password, role || 'student');
  return d;
}

/** One silent re-login using session credentials (after 401 / expired JWT). */
async function infinityReloginSilent() {
  if (_infinityReloginPromise) return _infinityReloginPromise;
  _infinityReloginPromise = (async function () {
    try {
      var user = sessionStorage.getItem(AUTH_USER_KEY);
      var pass = sessionStorage.getItem(AUTH_PASS_KEY);
      var role = sessionStorage.getItem(AUTH_ROLE_KEY) || 'student';
      if (!user || !pass) return null;
      return await infinityLogin(user, pass, role, { silent: true });
    } catch (e) {
      return null;
    } finally {
      _infinityReloginPromise = null;
    }
  })();
  return _infinityReloginPromise;
}

/**
 * Ensure a live JWT exists. Retries login against the API.
 * Returns true if getAuthToken() is usable.
 */
async function infinityEnsureAuth(opts) {
  opts = opts || {};
  if (getAuthToken()) {
    if (!opts.force) return true;
  }
  var user = opts.user || sessionStorage.getItem(AUTH_USER_KEY);
  var pass = opts.password || sessionStorage.getItem(AUTH_PASS_KEY);
  var role = opts.role || sessionStorage.getItem(AUTH_ROLE_KEY) || 'student';
  if (!user || !pass) return !!getAuthToken();

  var attempts = Math.max(1, opts.attempts || 3);
  for (var i = 0; i < attempts; i++) {
    var d = await infinityLogin(user, pass, role, { silent: true });
    if (d && getAuthToken()) return true;
    await new Promise(function (resolve) { setTimeout(resolve, 700 * (i + 1)); });
  }
  return !!getAuthToken();
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
  if (r.status === 401 && !options._authRetried) {
    var relog = await infinityReloginSilent();
    if (relog && getAuthToken()) {
      var retryOpts = Object.assign({}, options, { _authRetried: true });
      // Rebuild headers with the fresh token; drop stale Authorization from prior merge.
      var baseExtra = Object.assign({}, options.headers || {});
      delete baseExtra.Authorization;
      delete baseExtra.authorization;
      retryOpts.headers = authHeaders(baseExtra);
      return infinityFetch(path, retryOpts);
    }
    clearAuthToken();
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('infinity:auth-required', { detail: { path: path } }));
      }
    } catch (e) { /* ignore */ }
  }
  if (r.status === 403) {
    try {
      var d = await r.clone().json();
      if (d && (d.code === 'ACCOUNT_SUSPENDED' || d.code === 'NEXORA_DISABLED' || d.error === 'Account suspended')) {
        clearAuthToken();
        clearAuthCredentials();
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
