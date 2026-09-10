import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const infPath = join(root, 'js', 'infinity-recursos-library.js');
let src = readFileSync(infPath, 'utf8');

if (!src.includes('E6 Email completo')) {
  const e5Needle = "item('email', 'E5 Encierro'";
  const e5Idx = src.indexOf(e5Needle);
  if (e5Idx < 0) throw new Error('E5 not found');
  const lineEnd = src.indexOf('\n', e5Idx);
  const e6 =
    "\n    item('email', 'E6 Email completo', 'Formato E en un solo pass', 'Escribí el Formato E completo de una vez (E1–E5): encabezado, empatía, explicación con 2 conectores + 1 método linker, ejecución (qué YA hiciste) y encierro con I will + hora + regards. Mínimo 55 palabras. Ejemplo de escritorio (no copies ciego).', 'Hello Marta, thank you for writing. I understand the payroll freeze is blocking supplier ACH. I reviewed the Operating Account restriction because two payments declined. However I will not lift every control. In other words, I escalated to Operations and I have documented Previous contacts. I will call you today before 4:30 p.m. Kind regards.', 'Hello Daniel, thank you for writing. I understand the Lisbon decline is blocking check-in. I reviewed Cards because the hotel MCC fired. However I will not lift every control. In other words, I set the travel notice and I activated the virtual card. I will call you today before 4:30 p.m. Kind regards.'),";
  src = src.slice(0, lineEnd) + e6 + src.slice(lineEnd);
}

const explorerStart = src.indexOf('  function explorer(el, cats, items, kind)');
if (explorerStart < 0) throw new Error('explorer not found');

const newTail = `  function deskBrand(opts) {
    opts = opts || {};
    var b = String(opts.brand || '').toLowerCase();
    if (b === 'kamuk') return 'Kamuk Holdings';
    if (b === 'infinity') return 'Infinity Holdings';
    try {
      var path = String((global.location && location.pathname) || '');
      if (path.toLowerCase().indexOf('/kamuk/') >= 0) return 'Kamuk Holdings';
    } catch (e) {}
    return 'Infinity Holdings';
  }

  function explorer(el, cats, items, kind, opts) {
    if (!el) return;
    opts = opts || {};
    var brand = deskBrand(opts);
    var cat = cats[0].id;
    var q = '';
    var openId = '';

    items.forEach(function (it, i) {
      if (!it._id) it._id = it.cat + '-' + i + '-' + fold(it.en || it.title || '').slice(0, 24);
    });

    if (kind === 'gloss') {
      var e2 = null;
      for (var i = 0; i < items.length; i++) {
        if (/^E2 Empat/i.test(items[i].en || '')) { e2 = items[i]; break; }
      }
      if (e2) {
        cat = e2.cat || 'email';
        openId = e2._id;
      }
    }

    function filtered() {
      var query = fold(q);
      return items.filter(function (it) {
        if (!query && it.cat !== cat) return false;
        if (!query) return true;
        var blob = fold([it.en, it.es, it.how, it.title, it.why, (it.examples || []).join(' ')].join(' '));
        return blob.indexOf(query) >= 0;
      });
    }

    function render() {
      var list = filtered();
      var chips = '';
      if (kind === 'gloss') {
        chips = list.map(function (it) {
          return '<button type="button" class="inf-tb-card kh-lib-chip' + (openId === it._id ? ' is-on' : '') + '" data-id="' + esc(it._id) + '"><b>' + esc(it.en) + '</b><small>' + esc(it.es) + '</small></button>';
        }).join('');
      } else {
        chips = list.map(function (it) {
          return '<a class="inf-tb-read-card kh-read-card" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer"><strong>' + esc(it.title) + '</strong><span>' + esc(it.why) + '</span><span class="inf-tb-read-go kh-read-go">Abrir ↗</span></a>';
        }).join('');
      }
      var selected = null;
      if (kind === 'gloss' && openId) {
        selected = list.filter(function (it) { return it._id === openId; })[0] || items.filter(function (it) { return it._id === openId; })[0];
      }
      var panel = '';
      if (kind === 'gloss') {
        panel = selected
          ? '<div class="inf-tb-panel kh-lib-panel"><h4>' + esc(selected.en) + '</h4><div class="inf-tb-es kh-lib-es">Español: <strong>' + esc(selected.es) + '</strong>' + (selected.gloss ? ' — ' + esc(selected.gloss) : '') + '</div><p class="inf-tb-how kh-lib-how">' + esc(selected.how) + '</p>' + ((selected.forms && selected.forms.length) ? '<div class="inf-tb-forms kh-lib-forms"><b>Formas, conjugaciones y para qué</b><ul class="inf-tb-ex kh-lib-ex">' + selected.forms.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>' : '') + '<ul class="inf-tb-ex kh-lib-ex"><li>' + esc(selected.examples[0]) + '</li><li>' + esc(selected.examples[1]) + '</li></ul></div>'
          : '<div class="inf-tb-panel kh-lib-panel"><p class="inf-tb-empty kh-lib-empty">Tocá Email (Formato E) o Phone (AMR). En Expresiones está the thing is. Buscá o tocá un chip.</p></div>';
      }
      var leadGloss = 'Buscá Encabezado, AMR, however o PIN. Cada chip es un ejemplo para el desk de ' + brand + ' (queue, Emails/Compose/Send, notes, Resolve).';
      var leadRead = 'Después de Jill, leé 5–10 min. Solo sitios libres verificados (sin 404, sin muro duro). Abrí en una pestaña nueva.';
      el.innerHTML = '<p class="inf-tb-lead kh-lib-lead">' + (kind === 'gloss' ? leadGloss : leadRead) + '</p>'
        + '<input class="inf-tb-search kh-lib-search" type="search" enterkeyhint="search" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="' + (kind === 'gloss' ? 'Buscá: Encabezado, AMR, however, PIN, AA…' : 'Buscá: Burns, BBC Scotland, Austen…') + '" value="' + esc(q) + '">'
        + '<div class="inf-tb-cats kh-lib-cats">' + cats.map(function (c) {
          return '<button type="button" class="inf-tb-cat kh-lib-cat' + (c.id === cat ? ' is-on' : '') + '" data-cat="' + c.id + '">' + esc(c.label) + '</button>';
        }).join('') + '</div>'
        + '<div class="inf-tb-count kh-lib-count">' + list.length + (kind === 'gloss' ? ' expresiones' : ' lecturas') + (q ? ' · filtro activo' : '') + '</div>'
        + (kind === 'gloss' ? '<div class="inf-tb-grid kh-lib-chips">' + (chips || '<p class="inf-tb-empty kh-lib-empty">Nada con esa búsqueda.</p>') + '</div>' + panel
          : '<div class="inf-tb-read-grid kh-read-grid">' + (chips || '<p class="inf-tb-empty kh-lib-empty">Nada con esa búsqueda.</p>') + '</div>');
      var search = el.querySelector('.inf-tb-search, .kh-lib-search');
      if (search && q) {
        search.focus();
        try { search.setSelectionRange(q.length, q.length); } catch (e) {}
      }
    }

    el.className = (el.className + ' inf-tb-shell kh-lib').replace(/\\s+/g, ' ').trim();
    el.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-cat]');
      if (c) { cat = c.getAttribute('data-cat'); q = ''; openId = ''; render(); return; }
      var chip = ev.target.closest('[data-id]');
      if (chip) {
        var id = chip.getAttribute('data-id');
        openId = openId === id ? '' : id;
        render();
      }
    });
    el.addEventListener('input', function (ev) {
      if (!ev.target.classList.contains('inf-tb-search') && !ev.target.classList.contains('kh-lib-search')) return;
      q = ev.target.value;
      openId = '';
      render();
    });
    render();
  }

  var api = {
    mountGlossary: function (el, opts) { explorer(el, GLOSS_CATS, GLOSS_ITEMS, 'gloss', opts); },
    mountReadings: function (el, opts) { explorer(el, READ_CATS, READ_ITEMS, 'read', opts); },
    cats: GLOSS_CATS,
    items: GLOSS_ITEMS
  };
  global.InfinityRecursosLibrary = api;
  global.KamukRecursosLibrary = api;
})(window);
`;

src = src.slice(0, explorerStart) + newTail;

const kamukPath = join(root, 'js', 'kamuk-recursos-library.js');
writeFileSync(infPath, src);
writeFileSync(kamukPath, src);
console.log('OK bytes', src.length);
console.log('E6', src.includes('E6 Email completo'));
console.log('inf-tb', src.includes('inf-tb-card'));
console.log('dual', src.includes('InfinityRecursosLibrary') && /global\\.KamukRecursosLibrary = api/.test(src));
console.log('auto E2', src.includes('E2 Empat'));
