/**
 * Infinity Studio — shared commercial footer
 * Mounts into [data-site-footer]
 * Uses body[data-nav-root] / data-nav-home like site-nav.js
 */
(function () {
  'use strict';

  function root() {
    var r = document.body.getAttribute('data-nav-root');
    return r == null ? '../' : r;
  }

  function home() {
    return document.body.getAttribute('data-nav-home') || 'index.html';
  }

  function brandBase() {
    return document.body.getAttribute('data-brand-base') || '';
  }

  function local(file) {
    return root() + file;
  }

  function abs(path) {
    if (!path) return '#';
    if (/^https?:\/\//i.test(path) || path.charAt(0) === '#' || path.indexOf('mailto:') === 0) {
      return path;
    }
    // Commercial HTML is at site root (promoted). Always resolve via nav-root.
    return root() + path;
  }

  function col(title, links) {
    var html = '<div class="site-footer-col"><h3>' + title + '</h3>';
    links.forEach(function (l) {
      html += '<a href="' + l.href + '">' + l.label + '</a>';
    });
    html += '</div>';
    return html;
  }

  function build() {
    var h = home();
    return (
      '<div class="site-footer-inner">' +
        '<div class="site-footer-brand">' +
          '<a class="brand" href="' + h + '" aria-label="Infinity Studio">' +
            '<img class="brand-logo brand-logo-footer" src="' + brandBase() + 'assets/brand/webp/infinity-logo-horizontal-light-600.webp" width="300" height="64" alt="Infinity Studio" decoding="async" loading="lazy">' +
          '</a>' +
        '</div>' +
        '<div class="site-footer-grid">' +
          col('Programas', [
            { href: local('foundations.html'), label: 'Foundations' },
            { href: local('ort.html'), label: 'ORT' },
            { href: local('para-quien.html'), label: '¿Es para mí?' }
          ]) +
          col('Herramientas', [
            { href: local('diagnostico.html'), label: 'Diagnóstico' },
            { href: local('alice.html'), label: 'Alice' },
            { href: local('nexora.html'), label: 'Nexora' },
            { href: local('jill.html'), label: 'Jill' },
            { href: local('claire.html'), label: 'Claire' },
            { href: local('training-book.html'), label: 'Training Book' }
          ]) +
          col('Experiencias', [
            { href: local('job-finder.html'), label: 'Job Finder' },
            { href: local('conversatorio.html'), label: 'The Conversatory' },
            { href: local('off-the-clock.html'), label: 'Off The Clock' },
            { href: local('ingles-operacional-latinoamerica.html'), label: 'Inglés operacional Latam' }
          ]) +
          col('Empresa', [
            { href: h + '#resultados', label: 'Resultados' },
            { href: local('casos-de-exito.html'), label: 'Casos de éxito' },
            { href: local('pricing.html'), label: 'Precios' },
            { href: local('hablemos.html'), label: 'Hablemos' },
            { href: abs('portal-access.html'), label: 'Portal' }
          ]) +
        '</div>' +
        '<div class="site-footer-legal">' +
          '<span>Infinity Studio CR</span>' +
          '<a href="https://wa.me/50660060981" target="_blank" rel="noopener noreferrer">+506 6006 0981</a>' +
          '<a href="' + h + '">Inicio</a>' +
        '</div>' +
      '</div>' +
      '<footer class="cadamag-credit" aria-label="Autoría">' +
        '<p class="cadamag-credit-line">' +
          '<span class="cadamag-credit-by">Created by Cadamag Automação</span>' +
          '<span class="cadamag-credit-sep" aria-hidden="true">·</span>' +
          '<a class="cadamag-credit-link" href="mailto:cadamag.automacao@gmail.com">cadamag.automacao@gmail.com</a>' +
          '<span class="cadamag-credit-sep" aria-hidden="true">·</span>' +
          '<a class="cadamag-credit-link" href="https://wa.me/5592984168201" target="_blank" rel="noopener noreferrer">+55 (92) 98416-8201</a>' +
        '</p>' +
      '</footer>'
    );
  }

  function mount() {
    var host = document.querySelector('[data-site-footer]');
    if (!host) return;
    host.classList.add('site-footer');
    host.innerHTML = build();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
