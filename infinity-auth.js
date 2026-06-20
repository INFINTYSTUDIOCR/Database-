/**
 * Infinity API auth — JWT for Student Portal, Engine, Nexora.
 * Falls back to Supabase when Render has not deployed /auth/* yet.
 */
var INFINITY_API = 'https://alice-by-infinity.onrender.com';
var AUTH_TOKEN_KEY = 'infinity_auth_token';
var AUTH_EXP_KEY = 'infinity_auth_exp';
var _authApiOk = null;

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
  clearPortalSession();
}

function setPortalSession(studentId, name, portalUser) {
  try {
    localStorage.setItem('infinity_portal_student_id', studentId || '');
    sessionStorage.setItem('portal_student_snapshot', JSON.stringify({
      id: studentId || '',
      portalUser: portalUser || '',
      name: name || ''
    }));
  } catch (e) {}
}

function clearPortalSession() {
  try {
    localStorage.removeItem('infinity_portal_student_id');
    localStorage.removeItem('nexora_scenario');
    localStorage.removeItem('nexora_agent');
    localStorage.removeItem('nexora_student_id');
    sessionStorage.removeItem('portal_student_snapshot');
  } catch (e) {}
}

/** JWT (Render) or sesión del Portal del Estudiante (login Supabase legacy) */
function hasPortalSession() {
  if (getAuthToken()) return true;
  try {
    if (localStorage.getItem('infinity_portal_student_id')) return true;
    if (localStorage.getItem('nexora_student_id')) return true;
    var snap = JSON.parse(sessionStorage.getItem('portal_student_snapshot') || 'null');
    if (snap && snap.id) return true;
  } catch (e) {}
  return false;
}

function authHeaders(extra) {
  var h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
  var t = getAuthToken();
  if (t) h.Authorization = 'Bearer ' + t;
  return h;
}

/** Check once per page load if Render has JWT auth deployed */
async function isAuthApiAvailable() {
  if (_authApiOk !== null) return _authApiOk;
  try {
    var r = await fetch(INFINITY_API + '/auth/status', { method: 'GET' });
    if (r.ok) {
      var d = await r.json();
      _authApiOk = !!(d && d.authLogin);
    } else {
      _authApiOk = false;
    }
  } catch (e) {
    _authApiOk = false;
  }
  return _authApiOk;
}

async function infinityLogin(user, password, role) {
  var r = await fetch(INFINITY_API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: user, password: password, role: role })
  });
  var text = await r.text();
  var d = {};
  try { d = text ? JSON.parse(text) : {}; } catch (e) { d = {}; }
  if (!r.ok) {
    var err = new Error(d.error || (r.status === 404 ? 'Auth route missing on server' : 'Login failed'));
    err.status = r.status;
    err.data = d;
    err.authRouteMissing = r.status === 404 || text.indexOf('Cannot POST') >= 0;
    err.authNotConfigured = r.status === 503 && (d.error || '').indexOf('not configured') >= 0;
    throw err;
  }
  setAuthToken(d.token, d.expiresIn);
  return d;
}

/** Try JWT login only when Render auth is live — avoids 404 noise in console */
async function infinityLoginIfAvailable(user, password, role) {
  if (!(await isAuthApiAvailable())) return null;
  try {
    return await infinityLogin(user, password, role);
  } catch (e) {
    if (e.status === 401) throw e;
    return null;
  }
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
  return r;
}

function requireAuthOrRedirect(loginPath) {
  if (!hasPortalSession()) {
    if (loginPath) window.location.href = loginPath;
    return false;
  }
  return true;
}
