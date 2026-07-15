(function () {
  var CANON = 'https://studioinfinitycr.com';
  var host = location.hostname;
  var path = location.pathname;

  if (/github\.io$/i.test(host)) {
    var clean = path.replace(/^\/Database-/i, '') || '/';
    location.replace(CANON + clean + location.search + location.hash);
    return;
  }

  if (host === 'www.studioinfinitycr.com') {
    location.replace(CANON + path + location.search + location.hash);
    return;
  }

  if (/\/index\.html$/i.test(path)) {
    location.replace(CANON + '/' + location.search + location.hash);
  }
})();

var SITE_ORIGIN = 'https://studioinfinitycr.com';
