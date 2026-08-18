(function () {
  var CANON = 'https://studioinfinitycr.com';
  var host = location.hostname;
  var path = location.pathname || '/';

  if (/github\.io$/i.test(host)) {
    // Kamuk GitHub twin → official /kamuk/ (same kamuk_students logins).
    if (/kamukschool/i.test(host) || /Operarive-Training-Database/i.test(path)) {
      var rest = path.replace(/^\/Operarive-Training-Database\/?/i, '');
      if (!rest || /^index\.html$/i.test(rest)) rest = '';
      location.replace(CANON + '/kamuk/' + rest + location.search + location.hash);
      return;
    }
    var clean = path.replace(/^\/Database-/i, '') || '/';
    location.replace(CANON + clean + location.search + location.hash);
    return;
  }

  if (host === 'www.studioinfinitycr.com') {
    location.replace(CANON + path + location.search + location.hash);
    return;
  }

  // Only the site ROOT index — never /kamuk/index.html (iOS Home Screen / WhatsApp).
  if (path === '/index.html') {
    location.replace(CANON + '/' + location.search + location.hash);
  }
})();

var SITE_ORIGIN = 'https://studioinfinitycr.com';
